"""
REFLECTRA — V2 Engine & Bugfix Verification Suite
"""
import asyncio
import time
from datetime import datetime
import pytest

from agents.models import EmotionEvent, Emotion, MoodTrend, MoodState, ReactionTriggered
from agents.state import EmotionalStateAgent
from agents.context import ContextMemoryAgent
from agents.governor import ReactionGovernor
from agents.llm import sanitize_llm_text


def test_state_agent_continuous_emission_without_stall():
    """Verify that StateAgent does not stall after window fills to 15 items."""
    async def run():
        agent = EmotionalStateAgent(window_size=15)
        eq: asyncio.Queue = asyncio.Queue()
        sq: asyncio.Queue = asyncio.Queue()
        task = asyncio.create_task(agent.process_events(eq, sq))

        # Send 35 stable events
        for _ in range(35):
            ev = EmotionEvent(
                emotion=Emotion.NEUTRAL,
                confidence=0.85,
                timestamp=datetime.now(),
                face_detected=True,
                raw_scores={"neutral": 0.85},
            )
            await eq.put(ev)
            await asyncio.sleep(0.005)

        await asyncio.sleep(0.1)
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

        emitted = []
        while not sq.empty():
            emitted.append(sq.get_nowait())

        # With 35 events, emitting on change + every 5 events should yield at least 7 states
        assert len(emitted) >= 7, f"Expected >=7 emissions, got {len(emitted)}"

    asyncio.run(run())


def test_governor_repeat_guard_blocks_duplicate_triggers():
    """Verify that Governor does not trigger repeatedly for the exact same mood shift."""
    ctx = ContextMemoryAgent()
    gov = ReactionGovernor(context=ctx, sustained_seconds=1.2, min_cooldown_sec=4.0)

    # First shift at 1.5s: should trigger
    mood1 = MoodState(current=Emotion.HAPPY, previous=Emotion.NEUTRAL, trend=MoodTrend.STABLE, duration=1.5, stability=0.85)
    ctx.update(mood1)
    trig1, ttype1, reason1 = gov.should_trigger(mood1)
    assert trig1 is True
    assert ttype1 == "mood_shift"
    gov.make_reaction(mood1, ttype1, reason1)
    ctx.mark_reaction()

    # Simulate cooldown elapsing (4.5s later), same happy state continuing (duration=6.0s)
    mood2 = MoodState(current=Emotion.HAPPY, previous=Emotion.NEUTRAL, trend=MoodTrend.STABLE, duration=6.0, stability=0.85)
    ctx.update(mood2)
    # Mock elapsed time > cooldown
    ctx.time_since_last_reaction = lambda: 5.0

    trig2, ttype2, _ = gov.should_trigger(mood2)
    # Must NOT trigger again for the same shift!
    assert trig2 is False
    assert ttype2 == "no_trigger"


def test_sanitizer_preserves_valid_word_step():
    """Verify sanitizer keeps valid sentences containing 'step' while rejecting reasoning steps."""
    valid_text = "I noticed a gentle step toward a more joyful, peaceful expression."
    assert sanitize_llm_text(valid_text) == valid_text

    # Reasoning dump with 'Step 1:' must be rejected
    reasoning_dump = "Step 1: Analyze user face\nStep 2: Formulate mirror response"
    assert sanitize_llm_text(reasoning_dump) == ""


def test_face_box_in_emotion_event():
    """Verify face_box dictionary is preserved in EmotionEvent."""
    box = {"x": 120, "y": 80, "w": 200, "h": 220}
    event = EmotionEvent(
        emotion=Emotion.HAPPY,
        confidence=0.95,
        timestamp=datetime.now(),
        face_detected=True,
        face_box=box,
    )
    assert event.face_box == box


def test_vision_agent_analyze_frame_with_mock(monkeypatch):
    """Verify VisionAgent._analyze_frame returns proper EmotionEvent without NameError."""
    import numpy as np
    from agents.vision import VisionAgent

    agent = VisionAgent(sample_rate_hz=5.0)

    # Mock DeepFace.analyze
    mock_result = [{
        "emotion": {"happy": 91.5, "neutral": 5.0, "sad": 3.5},
        "dominant_emotion": "happy",
        "face_confidence": 0.94,
        "region": {"x": 100, "y": 120, "w": 250, "h": 260}
    }]

    import deepface
    monkeypatch.setattr(deepface.DeepFace, "analyze", lambda *args, **kwargs: mock_result)

    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    event = agent._analyze_frame(dummy_frame)

    assert event.face_detected is True
    assert event.emotion == Emotion.HAPPY
    assert event.confidence == 0.94
    assert event.face_box == {"x": 100, "y": 120, "w": 250, "h": 260}
    assert round(event.raw_scores["happy"], 3) == 0.915

