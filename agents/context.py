"""
Context/Memory Agent — Maintains session state for Reflectra.

Tracks: session start time, mood history log, time since last reaction,
dominant mood counts, no-face streak. Pure Python, no LLM.

This is Phase 3: provides context for the Governor to decide when to react.
"""
import time
import logging
from collections import deque, Counter
from dataclasses import dataclass

from agents.models import MoodState, Emotion

logger = logging.getLogger("reflectra.context")


@dataclass
class SessionSnapshot:
    session_duration: float
    mood_history_len: int
    dominant_mood: Emotion | None
    time_since_last_reaction: float
    total_reactions: int
    no_face_streak: int


class ContextMemoryAgent:
    """
    Maintains session memory.

    - mood_history: rolling log of MoodState (with wall-time)
    - session_start: monotonic start
    - last_reaction_time: monotonic time of last Governor trigger
    - no_face_streak: consecutive MoodStates with stability==0 (no face)
    """

    def __init__(self, max_history: int = 200):
        self.session_start = time.monotonic()
        self.max_history = max_history
        self.mood_history: deque[tuple[float, MoodState]] = deque(maxlen=max_history)
        self.last_reaction_time: float | None = None
        self.total_reactions = 0
        self.no_face_streak = 0
        self._dominant_counter: Counter[Emotion] = Counter()

    def update(self, mood: MoodState) -> None:
        now = time.monotonic()
        self.mood_history.append((now, mood))
        # P7.4: synthetic (debug-injected) moods must not pollute real dominant-mood stats
        if mood.source == "real":
            self._dominant_counter[mood.current] += 1

        # Track no-face streak: stability 0 means no face in window
        if mood.stability == 0.0:
            self.no_face_streak += 1
        else:
            self.no_face_streak = 0

        logger.debug(
            f"Context: mood={mood.current.value} stability={mood.stability:.2f} "
            f"history={len(self.mood_history)} no_face_streak={self.no_face_streak}"
        )

    def mark_reaction(self) -> None:
        self.last_reaction_time = time.monotonic()
        self.total_reactions += 1

    def time_since_last_reaction(self) -> float:
        if self.last_reaction_time is None:
            return time.monotonic() - self.session_start
        return time.monotonic() - self.last_reaction_time

    def session_duration(self) -> float:
        return time.monotonic() - self.session_start

    def dominant_mood(self) -> Emotion | None:
        if not self._dominant_counter:
            return None
        return self._dominant_counter.most_common(1)[0][0]

    def snapshot(self) -> SessionSnapshot:
        return SessionSnapshot(
            session_duration=self.session_duration(),
            mood_history_len=len(self.mood_history),
            dominant_mood=self.dominant_mood(),
            time_since_last_reaction=self.time_since_last_reaction(),
            total_reactions=self.total_reactions,
            no_face_streak=self.no_face_streak,
        )

    def recent_moods(self, n: int = 10) -> list[MoodState]:
        return [m for _, m in list(self.mood_history)[-n:]]
