"""
Emotional State Agent — Smooths noisy Vision Agent output into a stable MoodState.

Uses a rolling window of EmotionEvents to:
- Filter out single-frame noise (one stray "sad" among "happy" frames)
- Track how long the current dominant mood has lasted
- Detect trend (stable, shifting, rising, falling)
- Calculate stability score
"""
import asyncio
import logging
import time
from collections import deque
from datetime import datetime

from agents.models import EmotionEvent, Emotion, MoodState, MoodTrend

logger = logging.getLogger("reflectra.state")


class EmotionalStateAgent:
    """
    Consumes EmotionEvents and produces a smoothed MoodState.

    Parameters:
        window_size: Number of recent events to consider (default 15).
        stability_threshold: Fraction of window that must agree for "stable" (default 0.7).
        shift_threshold: Fraction that must change to declare a "shift" (default 0.4).
    """

    def __init__(
        self,
        window_size: int = 15,
        stability_threshold: float = 0.7,
        shift_threshold: float = 0.4,
    ):
        self.window_size = window_size
        self.stability_threshold = stability_threshold
        self.shift_threshold = shift_threshold

        self._window: deque[EmotionEvent] = deque(maxlen=window_size)
        self._current_mood: Emotion = Emotion.NEUTRAL
        self._previous_mood: Emotion = Emotion.NEUTRAL
        self._mood_start_time: float = time.monotonic()
        self._last_event: EmotionEvent | None = None
        self._total_events: int = 0

    def _compute_mood(self) -> MoodState:
        """
        Analyze the rolling window and compute a MoodState.
        Pure logic — no I/O.
        """
        now = time.monotonic()

        src = (
            self._last_event.source
            if self._last_event
            else (self._window[-1].source if self._window else "real")
        )
        if not self._window:
            return MoodState(
                current=self._current_mood,
                previous=self._previous_mood,
                trend=MoodTrend.STABLE,
                duration=0.0,
                stability=0.0,
                source=src,
            )

        # Count emotions in window (only face-detected events)
        face_events = [e for e in self._window if e.face_detected]
        if not face_events:
            return MoodState(
                current=self._current_mood,
                previous=self._previous_mood,
                trend=MoodTrend.STABLE,
                duration=now - self._mood_start_time,
                stability=0.0,
                source=src,
            )

        # Count occurrences of each emotion
        emotion_counts: dict[Emotion, int] = {}
        for e in face_events:
            emotion_counts[e.emotion] = emotion_counts.get(e.emotion, 0) + 1

        # Find dominant emotion in window
        dominant = max(emotion_counts, key=emotion_counts.get)
        dominant_fraction = emotion_counts[dominant] / len(face_events)

        # Stability = how consistent the window is
        stability = dominant_fraction

        # Detect mood shift
        if dominant != self._current_mood:
            # Check if the new mood is sustained enough to switch
            if dominant_fraction >= self.shift_threshold:
                self._previous_mood = self._current_mood
                self._current_mood = dominant
                self._mood_start_time = now
                logger.info(
                    f"Mood shift: {self._previous_mood.value} → {self._current_mood.value} "
                    f"(fraction: {dominant_fraction:.2f})"
                )

        # Determine trend
        if len(face_events) >= 4:
            recent_half = [e.emotion for e in face_events[len(face_events) // 2:]]
            earlier_half = [e.emotion for e in face_events[:len(face_events) // 2]]

            # Count "positive" emotions
            positive = {Emotion.HAPPY, Emotion.SURPRISE}
            recent_pos = sum(1 for e in recent_half if e in positive)
            earlier_pos = sum(1 for e in earlier_half if e in positive)

            recent_ratio = recent_pos / len(recent_half) if recent_half else 0
            earlier_ratio = earlier_pos / len(earlier_half) if earlier_half else 0

            if recent_ratio - earlier_ratio > 0.2:
                trend = MoodTrend.RISING
            elif earlier_ratio - recent_ratio > 0.2:
                trend = MoodTrend.FALLING
            elif dominant_fraction < self.stability_threshold:
                trend = MoodTrend.SHIFTING
            else:
                trend = MoodTrend.STABLE
        else:
            trend = MoodTrend.STABLE

        return MoodState(
            current=self._current_mood,
            previous=self._previous_mood,
            trend=trend,
            duration=now - self._mood_start_time,
            stability=stability,
            source=src,
        )

    async def process_events(self, event_queue: asyncio.Queue, state_queue: asyncio.Queue):
        """
        Main loop: reads EmotionEvents from event_queue, maintains rolling window,
        and puts MoodState into state_queue whenever it changes.
        """
        logger.info(f"Emotional State agent started (window: {self.window_size})")
        last_state = None

        while True:
            try:
                event: EmotionEvent = await asyncio.wait_for(event_queue.get(), timeout=0.1)
            except asyncio.TimeoutError:
                continue

            self._window.append(event)
            self._last_event = event
            self._total_events += 1

            state = self._compute_mood()

            # Emit on change or every 5 events (~1s at 5Hz) for continuous live duration & context updates
            state_changed = (
                last_state is None
                or state.current != last_state.current
                or state.trend != last_state.trend
            )

            if state_changed or (self._total_events % 5 == 0):
                await state_queue.put(state)
                last_state = state
                logger.debug(
                    f"Mood: {state.current.value} | Trend: {state.trend.value} | "
                    f"Duration: {state.duration:.1f}s | Stability: {state.stability:.2f}"
                )
