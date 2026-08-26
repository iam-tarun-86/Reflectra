"""
Reflectra — An Adaptive AI Mirror
Backend entry point
"""
import asyncio
import json
import os
import time
import logging
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from agents.vision import VisionAgent
from agents.state import EmotionalStateAgent
from agents.context import ContextMemoryAgent
from agents.governor import ReactionGovernor
from agents.llm import LLMResponseAgent, sanitize_llm_text
from agents.models import Emotion, MoodState, MoodTrend, ReactionTriggered, LLMResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reflectra")

app = FastAPI(title="Reflectra", description="An Adaptive AI Mirror — Multi-Agent Emotion Recognition")

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
LLM_BASE_URL = os.environ.get("REFLECTRA_LLM_URL", "http://localhost:8085/v1")
LLM_MODEL = os.environ.get("REFLECTRA_LLM_MODEL", "gemma-4-e4b")

_last_summary_ts = {"t": 0.0}


def check_token(request: Request) -> None:
    """P7.5: optional REFLECTRA_TOKEN env — if set, require ?token= or x-reflectra-token header."""
    expected = os.environ.get("REFLECTRA_TOKEN")
    if not expected:
        return
    supplied = request.query_params.get("token") or request.headers.get("x-reflectra-token")
    if supplied != expected:
        raise HTTPException(status_code=401, detail="invalid or missing token")


@app.get("/")
async def root():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/debug/trigger/{emotion}")
async def debug_trigger(emotion: str):
    """Inject a fake mood for testing Governor without real face."""
    try:
        emo = Emotion(emotion.lower())
    except ValueError:
        return {"error": f"unknown emotion {emotion}", "valid": [e.value for e in Emotion]}
    fake = MoodState(current=emo, previous=Emotion.NEUTRAL, trend=MoodTrend.STABLE, duration=2.0, stability=0.8)
    return {"injected": fake.current.value, "hint": "Use the Frontend Test button for live injection"}


@app.post("/session/summary")
async def session_summary(payload: dict, request: Request = None):
    """
    Generate session closing observation via LLM.
    Expects: {dominant, shifts: [{from,to,time}], points, last_mood}
    P7.5: token-gated + rate-limited to 1 request / 3s.
    """
    try:
        if request is not None:
            check_token(request)
        now = time.time()
        if now - _last_summary_ts["t"] < 3.0:
            return JSONResponse(status_code=429, content={"error": "rate limited", "retry_after_s": 3})
        _last_summary_ts["t"] = now

        dominant = payload.get("dominant", "neutral")
        shifts = payload.get("shifts", [])
        points = payload.get("points", 0)
        last_mood = payload.get("last_mood", "neutral")
        shift_str = "; ".join([f"{s.get('from','?')}->{s.get('to','?')} at {s.get('time','?')}s" for s in shifts]) or "no major shifts"
        user_prompt = (
            f"Session summary: observed {points} mood points. "
            f"Dominant: {dominant}. Shifts: {shift_str}. Last: {last_mood}. "
            "Provide a warm 1-sentence closing reflection as Reflectra, referencing facial-expression patterns (not diagnosing feelings), under 25 words. Output only the final sentence, no reasoning."
        )
        import httpx
        url = f"{LLM_BASE_URL}/chat/completions"
        req = {
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": "/no_think You are Reflectra, an adaptive AI mirror. Observe facial-expression patterns, not internal feelings. Output only final 1 sentence, no reasoning, under 25 words."},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": 400,
            "temperature": 0.7,
            "stream": False,
        }
        start = time.monotonic()
        # P7: short connect timeout so dead LLM fails in ~2s, not 20s
        async with httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=2.0)) as client:
            resp = await client.post(url, json=req)
            resp.raise_for_status()
            data = resp.json()
            msg = data["choices"][0]["message"]
            text = sanitize_llm_text(msg.get("content") or "")
            if not text:
                text = sanitize_llm_text(msg.get("reasoning_content") or "")
            latency = (time.monotonic() - start) * 1000
            if not text:
                text = "Thanks for sharing your presence — a gentle, reflective session."
                return {"text": text, "latency_ms": round(latency, 1), "model": "fallback"}
            return {"text": text[:200], "latency_ms": round(latency, 1), "model": LLM_MODEL}
    except HTTPException:
        raise
    except Exception as e:
        return {"text": "Thanks for this session — noticed gentle shifts and steady presence.", "latency_ms": 0, "model": "fallback", "error": str(e)}


@app.websocket("/ws/video")
async def video_websocket(websocket: WebSocket):
    # P7.5: optional token gate before accept
    expected = os.environ.get("REFLECTRA_TOKEN")
    if expected:
        supplied = websocket.query_params.get("token") or websocket.headers.get("x-reflectra-token")
        if supplied != expected:
            await websocket.close(code=1008)
            return
    await websocket.accept()
    logger.info("Client connected to /ws/video")

    # Create queues for the agent pipeline
    frame_queue: asyncio.Queue = asyncio.Queue(maxsize=5)
    event_queue: asyncio.Queue = asyncio.Queue(maxsize=20)
    state_queue: asyncio.Queue = asyncio.Queue(maxsize=10)

    # Create agents (Phase 3: Context + Governor)
    vision_agent = VisionAgent(sample_rate_hz=5.0)
    state_agent = EmotionalStateAgent(window_size=15)
    context_agent = ContextMemoryAgent(max_history=200)
    governor = ReactionGovernor(
        context=context_agent,
        sustained_seconds=1.2,  # lowered for demo responsiveness (was 2.0)
        strong_threshold=0.60,  # lowered from 0.75 to catch subtle happy
        min_cooldown_sec=4.0,   # lowered from 8.0 for testing
        no_face_suppress=5,
    )
    reaction_queue: asyncio.Queue = asyncio.Queue(maxsize=10)
    llm_queue: asyncio.Queue = asyncio.Queue(maxsize=10)
    llm_agent = LLMResponseAgent(context=context_agent, base_url="http://localhost:8085/v1", model="gemma-4-e4b", max_tokens=350)

    # Start agent background tasks
    vision_task = asyncio.create_task(
        vision_agent.process_frames(frame_queue, event_queue)
    )
    state_task = asyncio.create_task(
        state_agent.process_events(event_queue, state_queue)
    )
    governor_task = asyncio.create_task(
        governor.process_moods(state_queue, reaction_queue)
    )
    llm_task = asyncio.create_task(
        llm_agent.process_reactions(reaction_queue, llm_queue)
    )


    frame_count = 0
    start_time = time.monotonic()
    current_mood = MoodState(
        current=Emotion.NEUTRAL,
        previous=Emotion.NEUTRAL,
        trend=MoodTrend.STABLE,
        duration=0.0,
        stability=0.0,
    )
    last_reaction: ReactionTriggered | None = None
    last_llm: LLMResponse | None = None

    # Lock to serialize concurrent websocket sends (metadata vs echo)
    send_lock = asyncio.Lock()

    # Background task: send metadata updates to browser every 0.5s
    async def metadata_sender():
        nonlocal current_mood, last_reaction, last_llm
        while True:
            try:
                await asyncio.sleep(0.5)
                # Pull latest mood from Context (Governor already consumed state_queue)
                if context_agent.mood_history:
                    _, latest = context_agent.mood_history[-1]
                    if latest is not current_mood:
                        current_mood = latest
                        logger.info(
                            f"Mood: {current_mood.current.value} | Trend: {current_mood.trend.value} | "
                            f"Duration: {current_mood.duration:.1f}s | Stability: {current_mood.stability:.2f}"
                        )
                # Drain LLM queue (Phase 4) — keep latest; still drain old reaction_queue for fallback
                while not llm_queue.empty():
                    try:
                        last_llm = llm_queue.get_nowait()
                        # Keep dummy synced for panel
                        last_reaction = last_llm.trigger
                    except asyncio.QueueEmpty:
                        break
                # Fallback: if no LLM yet, still show dummy reaction
                while not reaction_queue.empty():
                    try:
                        last_reaction = reaction_queue.get_nowait()
                    except asyncio.QueueEmpty:
                        break

                elapsed = time.monotonic() - start_time
                snap = context_agent.snapshot()
                meta = {
                    "frame_count": frame_count,
                    "fps": round(frame_count / elapsed, 1) if elapsed > 0 else 0,
                    "session_duration": round(snap.session_duration, 1),
                    "total_reactions": snap.total_reactions,
                    "no_face_streak": snap.no_face_streak,
                }
                if current_mood:
                    meta["mood"] = {
                        "current": current_mood.current.value,
                        "previous": current_mood.previous.value,
                        "trend": current_mood.trend.value,
                        "duration": round(current_mood.duration, 1),
                        "stability": round(current_mood.stability, 2),
                    }
                if state_agent._last_event is not None:
                    raw = {k: round(float(v), 3) for k, v in state_agent._last_event.raw_scores.items()}
                    meta["raw"] = raw
                    meta["face_detected"] = state_agent._last_event.face_detected
                    if state_agent._last_event.face_box:
                        meta["face_box"] = state_agent._last_event.face_box
                    # Compute biometric valence (-1.0 to +1.0) & arousal (0.0 to 1.0)
                    h = raw.get("happy", 0.0)
                    su = raw.get("surprise", 0.0)
                    sa = raw.get("sad", 0.0)
                    an = raw.get("angry", 0.0)
                    fe = raw.get("fear", 0.0)
                    di = raw.get("disgust", 0.0)
                    ne = raw.get("neutral", 0.0)
                    val = (h * 1.0 + su * 0.4) - (sa * 0.8 + an * 0.9 + fe * 0.7 + di * 0.7)
                    meta["valence"] = round(max(-1.0, min(1.0, val)), 3)
                    arousal = (h * 0.4 + su * 0.9 + an * 0.8 + fe * 0.8) - (sa * 0.3 + ne * 0.4)
                    meta["arousal"] = round(max(0.0, min(1.0, (arousal + 1.0) / 2.0)), 3)

                if last_reaction:
                    meta["reaction"] = {
                        "dummy_text": last_reaction.dummy_text,
                        "trigger_type": last_reaction.trigger_type,
                        "reason": last_reaction.reason,
                        "from": last_reaction.from_emotion.value,
                        "to": last_reaction.to_emotion.value,
                    }
                if last_llm:
                    meta["llm"] = {
                        "text": last_llm.text,
                        "latency_ms": round(last_llm.latency_ms, 1),
                        "model": last_llm.model,
                    }
                meta_bytes = json.dumps(meta).encode()
                header = len(meta_bytes).to_bytes(4, "big")
                async with send_lock:
                    await websocket.send_bytes(header + meta_bytes)
            except Exception:
                break

    meta_task = asyncio.create_task(metadata_sender())

    try:
        while True:
            msg = await websocket.receive()
            # P7.1: Starlette returns a disconnect message instead of raising — handle it
            if msg.get("type") == "websocket.disconnect":
                break
            # Handle text debug messages (e.g. {"debug":"happy"})
            if "text" in msg and msg["text"] is not None:
                try:
                    payload = json.loads(msg["text"])
                    if "debug" in payload:
                        emo_str = payload["debug"]
                        try:
                            emo = Emotion(emo_str.lower())
                            # Directly inject a sustained MoodState into governor queue (bypass DeepFace).
                            # P7.4: tagged source="debug" so Context/summary can exclude synthetic data.
                            fake_mood = MoodState(current=emo, previous=Emotion.NEUTRAL, trend=MoodTrend.STABLE, duration=2.0, stability=0.85, source="debug")
                            logger.info(f"DEBUG inject mood {fake_mood.previous.value}->{fake_mood.current.value} (source=debug)")
                            await state_queue.put(fake_mood)
                        except ValueError:
                            pass
                    continue
                except Exception:
                    continue
            if "bytes" in msg and msg["bytes"] is not None:
                data = msg["bytes"]
            else:
                continue
            frame_count += 1

            # Feed frame to Vision Agent (drop oldest if full)
            if frame_queue.full():
                try:
                    frame_queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is not None:
                try:
                    frame_queue.put_nowait((frame_count, frame))
                except asyncio.QueueFull:
                    pass

            # Echo frame back IMMEDIATELY — serialized via lock to avoid interleaving with metadata
            async with send_lock:
                await websocket.send_bytes(data)

    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        elapsed = time.monotonic() - start_time
        fps = frame_count / elapsed if elapsed > 0 else 0
        logger.info(f"Client disconnected. Total frames: {frame_count} | Avg rate: {fps:.1f} FPS")
        vision_agent.stop()
        for task in [vision_task, state_task, governor_task, llm_task, meta_task]:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass


# Serve frontend static files (JS, CSS, etc.)
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
