"""
Reaction Governor — Rule-based decision agent (Phase 3).

Decides WHEN to react. Pure Python, NOT an LLM call.

Triggers:
 1. Mood changed AND sustained for `sustained_seconds` (duration in MoodState)
 2. Strong emotion: stability >= `strong_threshold` (e.g. 0.75) AND trend stable/rising
 3. Cooldown: `min_cooldown_sec` since last reaction — prevents spam
 4. Edge: if `no_face_streak` >= `no_face_suppress` OR mood.stability==0 → suppress

On trigger, emits ReactionTriggered with dummy_text "[DUMMY] Reacting to: ..."

Tuning: start with sustained=2.0s, strong=0.75, cooldown=8s, suppress after 5 no-face moods.
"""
import asyncio
import logging
import time
from datetime import datetime

from agents.models import MoodState, ReactionTriggered, Emotion
from agents.context import ContextMemoryAgent

logger = logging.getLogger("reflectra.governor")


class ReactionGovernor:
    def __init__(
        self,
        context: ContextMemoryAgent,
        sustained_seconds: float = 2.0,
        strong_threshold: float = 0.75,
        min_cooldown_sec: float = 8.0,
        no_face_suppress: int = 5,
    ):
        self.context = context
        self.sustained_seconds = sustained_seconds
        self.strong_threshold = strong_threshold
        self.min_cooldown_sec = min_cooldown_sec
        self.no_face_suppress = no_face_suppress
        self._last_triggered_shift: tuple[Emotion, Emotion] | None = None
        self._last_triggered_mood: Emotion | None = None

    def _cooldown_ok(self) -> tuple[bool, float]:
        # First reaction should not be blocked by cooldown
        if self.context.last_reaction_time is None:
            return True, 0.0
        elapsed = self.context.time_since_last_reaction()
        remaining = self.min_cooldown_sec - elapsed
        if remaining > 0:
            return False, remaining
        return True, 0.0

    def should_trigger(self, mood: MoodState) -> tuple[bool, str, str]:
        """
        Evaluate rules. Returns (trigger, trigger_type, reason).
        """
        # Edge: no face for a while → suppress
        if self.context.no_face_streak >= self.no_face_suppress:
            return False, "suppressed", f"no_face_streak={self.context.no_face_streak} suppress"

        if mood.stability == 0.0:
            return False, "suppressed", "stability 0 (no face) suppress"

        # Cooldown gate
        ok, remaining = self._cooldown_ok()
        if not ok:
            return False, "cooldown", f"cooldown {remaining:.1f}s remaining"

        # Repeat-guard: if emotion shifted to a new one, clear old shift lock
        if self._last_triggered_mood is not None and mood.current != self._last_triggered_mood:
            self._last_triggered_shift = None
            self._last_triggered_mood = None

        shift_sig = (mood.previous, mood.current)

        # Rule 1: mood shift sustained
        if (
            mood.current != mood.previous
            and mood.duration >= self.sustained_seconds
            and mood.stability >= 0.5
            and self._last_triggered_shift != shift_sig
        ):
            return True, "mood_shift", f"{mood.previous.value}->{mood.current.value} sustained {mood.duration:.1f}s"

        # Rule 2: strong emotion (high stability, not shifting) — exclude neutral to avoid spam
        if (
            mood.current != Emotion.NEUTRAL
            and mood.stability >= self.strong_threshold
            and mood.duration >= 1.0
            and (self._last_triggered_mood != mood.current or self.context.time_since_last_reaction() >= 30.0)
        ):
            return True, "strong_emotion", f"strong {mood.current.value} stability {mood.stability:.2f} dur {mood.duration:.1f}s"

        return False, "no_trigger", "stable/unchanged mood"

    def make_reaction(self, mood: MoodState, trigger_type: str, reason: str) -> ReactionTriggered:
        now = datetime.now()
        self._last_triggered_shift = (mood.previous, mood.current)
        self._last_triggered_mood = mood.current
        dummy = f"[DUMMY] Reacting to: {mood.previous.value}->{mood.current.value} ({trigger_type}: {reason})"
        return ReactionTriggered(
            reason=reason,
            trigger_type=trigger_type,
            from_emotion=mood.previous,
            to_emotion=mood.current,
            confidence=mood.stability,
            timestamp=now,
            cooldown_remaining=0.0,
            dummy_text=dummy,
            source=getattr(mood, "source", "real"),
        )

    async def process_moods(self, mood_queue: asyncio.Queue, reaction_queue: asyncio.Queue):
        """
        Main loop: reads MoodState from mood_queue (populated by StateAgent),
        consults ContextMemoryAgent, decides trigger, emits ReactionTriggered.
        """
        logger.info(
            f"Governor started (sustained={self.sustained_seconds}s strong={self.strong_threshold} cooldown={self.min_cooldown_sec}s)"
        )
        while True:
            try:
                mood: MoodState = await asyncio.wait_for(mood_queue.get(), timeout=0.1)
            except asyncio.TimeoutError:
                continue

            # Update context with every mood
            self.context.update(mood)

            trigger, ttype, reason = self.should_trigger(mood)

            if trigger:
                reaction = self.make_reaction(mood, ttype, reason)
                self.context.mark_reaction()
                await reaction_queue.put(reaction)
                logger.info(f"GOVERNOR TRIGGER [{ttype}] {reaction.dummy_text}")
                print(reaction.dummy_text, flush=True)
            else:
                # Log suppression at debug level to avoid spam
                logger.debug(f"Governor no-trigger [{ttype}] {reason} mood={mood.current.value} dur={mood.duration:.1f}s")
