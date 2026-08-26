"""
LLM Response Agent — Phase 4

Consumes ReactionTriggered from Governor, builds a short prompt referencing
the *pattern* (not just current label), calls llama.cpp OpenAI-compatible
endpoint asynchronously, and emits LLMResponse.

Key requirements:
- Called ONLY when Governor triggers (not continuous)
- Async non-blocking: use httpx AsyncClient or asyncio.to_thread
- Short prompt for Gemma 4 E4B speed
- Phrase as "facial-expression patterns", never claims about internal state
- Video feed stays smooth while generating
"""
import asyncio
import logging
import re
import time
import os
from datetime import datetime

from agents.models import ReactionTriggered, LLMResponse
from agents.context import ContextMemoryAgent

logger = logging.getLogger("reflectra.llm")


def sanitize_llm_text(raw: str) -> str:
    """
    P7.2: Hard-strip reasoning artifacts from any LLM output.

    - Extracts text after explicit 'Final:/Response:/Answer:' markers
    - Prefers the last long prose line; drops list/step artifacts
    - Returns '' if nothing safe remains (caller substitutes canned line)
    """
    text = (raw or "").strip()
    if not text:
        return ""

    # Explicit final-answer markers anywhere in the dump (incl. "Final Selection:")
    m = re.search(
        r"(?:final(?:\s+\w{1,12})?|response|answer|closing)\s*[:\-]\s*(.+)",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if m:
        text = m.group(1).strip()

    # Line-level cleanup: strip bullets/numbering, keep only prose-looking lines
    lines = []
    for ln in text.splitlines():
        ln = ln.strip()
        ln = re.sub(r"^[\*\u2022\-\d]+[\.\)\:]?\s*", "", ln)
        if ln:
            lines.append(ln)
    prose = [ln for ln in lines if len(ln) >= 25 and "**" not in ln and not re.match(r"^\d+[\.\)]", ln)]
    candidate = prose[-1] if prose else (lines[-1] if lines else "")

    # Reject anything still looking like reasoning/meta output
    banned_phrases = ("**", "```", "constraint", "drafting", "review against",
                      "thinking process", "let me ", "as reflectra, i")
    low = candidate.lower()
    if (
        not candidate
        or any(b in low for b in banned_phrases)
        or re.search(r"\bstep\s*\d+[\.\:\-]", low)
        or re.match(r"^\d+[\.\)]", candidate)
    ):
        return ""
    if len(candidate) < 10:  # too short to be a real reflection
        return ""

    return re.sub(r"\s+", " ", candidate).strip()

# Prompt template — short, pattern-referencing, safe phrasing
# /no_think: Qwen3-family soft switch; harmless no-op for Gemma
SYSTEM_PROMPT = (
    "/no_think You are Reflectra, an adaptive AI mirror. You observe facial-expression patterns, "
    "not internal feelings. Output only final response, no reasoning. "
    "Respond in 1-2 short sentences, warm and concise. "
    "Reference the pattern or change you noticed (e.g. 'a shift toward...', 'a sustained pattern of...'), "
    "never diagnose emotions as facts. Keep it under 30 words."
)

def build_user_prompt(trigger: ReactionTriggered, context: ContextMemoryAgent) -> str:
    """
    Build a contextual prompt from trigger + session context.
    Uses: current, previous, trend, duration, session duration.
    """
    snap = context.snapshot()
    # Describe pattern, not label
    pattern_desc = (
        f"Observed pattern: facial expressions shifted from '{trigger.from_emotion.value}' "
        f"to '{trigger.to_emotion.value}' ({trigger.trigger_type}, {trigger.reason}), "
        f"confidence {trigger.confidence:.2f}. Session {snap.session_duration:.0f}s, "
        f"{snap.total_reactions} prior reflections."
    )
    return pattern_desc

class LLMResponseAgent:
    def __init__(
        self,
        context: ContextMemoryAgent,
        base_url: str = "http://localhost:8085/v1",
        model: str = "gemma-4-e4b",
        max_tokens: int = 350,
        temperature: float = 0.7,
        timeout_sec: float = 20.0,
    ):
        self.context = context
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.timeout_sec = timeout_sec

    async def _call_llm(self, user_prompt: str) -> tuple[str, float]:
        """
        Call llama.cpp OpenAI-compatible endpoint. Returns (sanitized_text, latency_ms).
        P7.2: output passes through sanitize_llm_text — never leaks reasoning.
        P7 (Qwen): disables thinking via chat_template_kwargs; retries without it on 400.
        """
        import httpx

        url = f"{self.base_url}/chat/completions"
        base_payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": False,
        }
        start = time.monotonic()
        try:
            # P7: short connect timeout so dead LLM degrades in ~2s
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout_sec, connect=2.0)) as client:
                data = None
                # Try with thinking disabled first (Qwen3-family); fall back cleanly
                for attempt, payload in enumerate((
                    {**base_payload, "chat_template_kwargs": {"enable_thinking": False}},
                    base_payload,
                )):
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 400 and attempt == 0:
                        continue  # server rejected the kwarg — retry plain
                    resp.raise_for_status()
                    data = resp.json()
                    break
                if data is None:
                    raise RuntimeError("LLM request failed both attempts")
                msg = data["choices"][0]["message"]
                text = sanitize_llm_text(msg.get("content") or "")
                if not text:
                    text = sanitize_llm_text(msg.get("reasoning_content") or msg.get("reasoning") or "")
                latency = (time.monotonic() - start) * 1000
                return text, latency
        except Exception as e:
            logger.warning(f"LLM call failed ({type(e).__name__}: {e}), using canned fallback")
            latency = (time.monotonic() - start) * 1000
            return "", latency

    async def generate(self, trigger: ReactionTriggered) -> LLMResponse:
        user_prompt = build_user_prompt(trigger, self.context)
        text, latency = await self._call_llm(user_prompt)
        if not text:
            text = (
                f"I noticed a shift toward {trigger.to_emotion.value} in your "
                f"facial-expression pattern — thanks for sharing this moment."
            )
            model_name = "fallback"
        else:
            model_name = self.model
        # Safety: enforce short response
        if len(text.split()) > 40:
            text = " ".join(text.split()[:35]) + "."
        return LLMResponse(
            text=text,
            trigger=trigger,
            latency_ms=latency,
            timestamp=datetime.now(),
            model=model_name,
        )

    async def process_reactions(self, reaction_queue: asyncio.Queue, llm_queue: asyncio.Queue):
        """
        Main loop: consumes ReactionTriggered, generates LLMResponse, puts to llm_queue.
        Only fires on Governor trigger — never polls continuously.
        P7.3: coalesces queued triggers (keeps newest), drops stale ones (>10s old).
        """
        logger.info(f"LLM agent started (model={self.model} base={self.base_url})")
        while True:
            try:
                trigger: ReactionTriggered = await asyncio.wait_for(reaction_queue.get(), timeout=0.1)
            except asyncio.TimeoutError:
                continue

            # Coalesce: drain queue, keep newest
            while not reaction_queue.empty():
                try:
                    newer = reaction_queue.get_nowait()
                    dropped = trigger
                    trigger = newer
                    age = (datetime.now() - dropped.timestamp).total_seconds()
                    logger.info(f"LLM coalesced/dropped stale trigger {dropped.from_emotion.value}->{dropped.to_emotion.value} ({age:.0f}s)")
                except asyncio.QueueEmpty:
                    break

            # Drop if this trigger itself is already stale
            age = (datetime.now() - trigger.timestamp).total_seconds()
            if age > 10.0:
                logger.info(f"LLM skipping stale trigger ({age:.0f}s old): {trigger.from_emotion.value}->{trigger.to_emotion.value}")
                continue

            logger.info(f"LLM generating for trigger {trigger.from_emotion.value}->{trigger.to_emotion.value} [{trigger.trigger_type}]")
            try:
                resp = await self.generate(trigger)
                await llm_queue.put(resp)
                logger.info(f"LLM done {resp.latency_ms:.0f}ms: {resp.text[:60]}...")
                print(f"[LLM {resp.latency_ms:.0f}ms] {resp.text}", flush=True)
            except Exception as e:
                logger.error(f"LLM generation error: {e}")
