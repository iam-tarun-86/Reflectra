"""
Reflectra — Shared data models for the multi-agent pipeline.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class Emotion(str, Enum):
    ANGRY = "angry"
    DISGUST = "disgust"
    FEAR = "fear"
    HAPPY = "happy"
    SAD = "sad"
    SURPRISE = "surprise"
    NEUTRAL = "neutral"


class MoodTrend(str, Enum):
    STABLE = "stable"
    SHIFTING = "shifting"
    RISING = "rising"       # positive emotion increasing
    FALLING = "falling"     # positive emotion decreasing


@dataclass
class EmotionEvent:
    """Output of the Vision Agent — a single emotion reading."""
    emotion: Emotion
    confidence: float          # 0.0 – 1.0
    timestamp: datetime
    face_detected: bool
    raw_scores: dict = field(default_factory=dict)  # full emotion breakdown
    face_box: dict = field(default_factory=dict)    # {x, y, w, h} bounding box
    source: str = "real"       # P7.4: "real" | "debug"


@dataclass
class MoodState:
    """Output of the Emotional State Agent — smoothed mood over time."""
    current: Emotion
    previous: Emotion
    trend: MoodTrend
    duration: float            # seconds the current mood has been dominant
    stability: float           # 0.0 – 1.0, how consistent recent readings are
    source: str = "real"       # P7.4: "real" | "debug"


@dataclass
class ReactionTriggered:
    """Output of the Reaction Governor — decision to react (Phase 3 dummy, Phase 4 LLM)."""
    reason: str                # human-readable trigger reason
    trigger_type: str          # e.g. "mood_shift", "strong_emotion", "sustained"
    from_emotion: Emotion
    to_emotion: Emotion
    confidence: float          # stability at trigger time
    timestamp: datetime
    cooldown_remaining: float = 0.0
    dummy_text: str = ""       # Phase 3: "[DUMMY] Reacting to: neutral->happy"
    source: str = "real"       # P7.4: "real" | "debug"


@dataclass
class LLMResponse:
    """Output of LLM Response Agent — contextual response for the mirror."""
    text: str                  # LLM generated text (short, pattern-referencing)
    trigger: ReactionTriggered  # the reaction that caused it
    latency_ms: float
    timestamp: datetime
    model: str = ""            # e.g. gemma-4-e4b
