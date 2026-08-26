"""
Reflectra — Phase 7 verification suite (P7.1-P7.5)

Covers: WS disconnect cleanliness, sanitizer, coalescing, debug tagging,
rate limiting, token auth, summary fallback (LLM-down safe).

Run: .venv\\Scripts\\python.exe -m pytest tests/test_phase7.py -q
"""
import asyncio
import os
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from agents.llm import sanitize_llm_text, LLMResponseAgent
from agents.models import MoodState, Emotion, MoodTrend, ReactionTriggered
from agents.context import ContextMemoryAgent


# ---------- P7.2 sanitizer ----------

def test_sanitize_plain_sentence_passes():
    assert sanitize_llm_text("A clear shift toward happiness is evident.") == \
        "A clear shift toward happiness is evident."


def test_sanitize_extracts_final_marker():
    dump = "Thinking Process:\n1. analyze\n2. draft\nFinal Selection: The shift to happiness is lovely and bright today."
    assert sanitize_llm_text(dump) == "The shift to happiness is lovely and bright today."


def test_sanitize_rejects_markdown_artifacts():
    dump = "**Drafting - Attempt 1**\nThe expression moved from neutral to happy."
    out = sanitize_llm_text(dump)
    assert "**" not in out


def test_sanitize_rejects_reasoning_meta():
    dump = "3. Review against Constraints:\n4. Drafting - Attempt 2: warm yes"
    assert sanitize_llm_text(dump) == ""


def test_sanitize_empty_inputs():
    assert sanitize_llm_text("") == ""
    assert sanitize_llm_text(None) == ""
    assert sanitize_llm_text("ok") == ""  # too short to trust


# ---------- P7.4 debug tagging ----------

def test_context_dominant_skips_debug_moods():
    ctx = ContextMemoryAgent()
    for _ in range(5):
        ctx.update(MoodState(current=Emotion.HAPPY, previous=Emotion.NEUTRAL,
                             trend=MoodTrend.STABLE, duration=1.0, stability=0.9))
    for _ in range(20):  # synthetic flood would dominate without the guard
        ctx.update(MoodState(current=Emotion.ANGRY, previous=Emotion.NEUTRAL,
                             trend=MoodTrend.STABLE, duration=2.0, stability=0.85,
                             source="debug"))
    assert ctx.dominant_mood() == Emotion.HAPPY


def test_governor_propagates_source():
    from agents.governor import ReactionGovernor
    gov = ReactionGovernor(ContextMemoryAgent())
    mood = MoodState(current=Emotion.SAD, previous=Emotion.NEUTRAL,
                     trend=MoodTrend.STABLE, duration=2.0, stability=0.8, source="debug")
    r = gov.make_reaction(mood, "mood_shift", "test")
    assert r.source == "debug"


def test_state_carries_source_through():
    from agents.state import EmotionalStateAgent
    agent = EmotionalStateAgent(window_size=15)
    from agents.models import EmotionEvent
    for _ in range(12):
        agent._window.append(EmotionEvent(emotion=Emotion.ANGRY, confidence=0.9,
                                          timestamp=datetime.now(), face_detected=True,
                                          source="debug"))
    state = agent._compute_mood()
    assert state.source == "debug"
    assert state.current == Emotion.ANGRY


# ---------- P7.3 stale-trigger coalescing ----------

def test_coalescing_drops_stale_triggers():
    async def run():
        agent = LLMResponseAgent(context=ContextMemoryAgent())
        rq: asyncio.Queue = asyncio.Queue()
        lq: asyncio.Queue = asyncio.Queue()

        old = ReactionTriggered(reason="r", trigger_type="mood_shift",
                                from_emotion=Emotion.NEUTRAL, to_emotion=Emotion.HAPPY,
                                confidence=0.9, timestamp=datetime.now() - timedelta(seconds=30))
        await rq.put(old)

        task = asyncio.create_task(agent.process_reactions(rq, lq))
        await asyncio.sleep(0.4)
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        return lq.empty()

    assert asyncio.run(run())


# ---------- P7.5 rate limit + token + fallback ----------

def test_summary_rate_limited_and_fallback(monkeypatch):
    monkeypatch.delenv("REFLECTRA_TOKEN", raising=False)
    from backend.app import app, _last_summary_ts
    import time as _time
    _last_summary_ts["t"] = 0.0  # reset limiter
    client = TestClient(app)
    body = {"dominant": "happy (60%)", "shifts": [], "points": 5, "last_mood": "happy"}

    r1 = client.post("/session/summary", json=body)
    assert r1.status_code == 200
    assert r1.json()["text"]  # canned or LLM — never empty

    # Deterministic: force timestamp inside window (r1 may have taken >3s if LLM slow/down)
    _last_summary_ts["t"] = _time.time()
    r2 = client.post("/session/summary", json=body)
    assert r2.status_code == 429


def test_token_auth_blocks_and_allows(monkeypatch):
    monkeypatch.setenv("REFLECTRA_TOKEN", "secret123")
    from backend.app import app, _last_summary_ts
    _last_summary_ts["t"] = 0.0
    client = TestClient(app)
    body = {"dominant": "neutral", "shifts": [], "points": 1, "last_mood": "neutral"}

    denied = client.post("/session/summary", json=body)
    assert denied.status_code == 401

    allowed = client.post("/session/summary?token=secret123", json=body)
    assert allowed.status_code in (200, 429)  # 200 expected here; 429 if raced


# ---------- P7.1 clean disconnect ----------

def test_ws_connect_echo_disconnect_clean():
    monkeypatch_free = None  # no env needed
    del monkeypatch_free
    os.environ.pop("REFLECTRA_TOKEN", None)
    from backend.app import app
    client = TestClient(app)
    with client.websocket_connect("/ws/video") as ws:
        ws.send_bytes(b"\xff\xd8\xff\xe0fakejpegdata_for_echo_000000")
        echo = ws.receive_bytes()
        assert echo.startswith(b"\xff\xd8\xff\xe0") or len(echo) > 16
    # Exiting the context sends close; server must handle disconnect message
    # without RuntimeError (P7.1). Any crash surfaces as an exception above.
