"""
Vision Agent — Captures frames and runs DeepFace emotion analysis.

Runs inference at a controlled sample rate (not every frame) using
asyncio.to_thread() so it never blocks the WebSocket event loop.
"""
import asyncio
import logging
import time
from datetime import datetime

import cv2
import numpy as np

from agents.models import EmotionEvent, Emotion

logger = logging.getLogger("reflectra.vision")


class VisionAgent:
    """
    Reads frames from an OpenCV VideoCapture and runs DeepFace analysis
    at a controlled sample rate. Outputs EmotionEvent objects via a queue.
    """

    def __init__(self, sample_rate_hz: float = 5.0, detection_backend: str = "retinaface"):
        """
        Args:
            sample_rate_hz: How many inferences per second (5-10 recommended).
            detection_backend: DeepFace face detection backend.
        """
        self.sample_rate_hz = sample_rate_hz
        self.detection_backend = detection_backend
        self._frame_interval = 1.0 / sample_rate_hz
        self._running = False
        self._last_analysis_time = 0.0
        self._model_loaded = False

    def _load_model(self):
        """Pre-load DeepFace model in background thread."""
        if self._model_loaded:
            return
        try:
            from deepface import DeepFace
            # Pre-build the model by running a dummy analysis
            # This avoids the cold-start delay on the first real frame
            logger.info("Loading DeepFace model (first time may download weights)...")
            dummy = np.zeros((100, 100, 3), dtype=np.uint8)
            DeepFace.analyze(
                img_path=dummy,
                actions=["emotion"],
                detector_backend=self.detection_backend,
                enforce_detection=False,
                silent=True,
            )
            self._model_loaded = True
            logger.info("DeepFace model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load DeepFace model: {e}")
            raise

    def _analyze_frame(self, frame: np.ndarray) -> EmotionEvent:
        """
        Run DeepFace analysis on a single frame (called in thread pool).
        Returns an EmotionEvent.
        """
        from deepface import DeepFace

        try:
            results = DeepFace.analyze(
                img_path=frame,
                actions=["emotion"],
                detector_backend=self.detection_backend,
                enforce_detection=False,
                silent=True,
            )

            # DeepFace returns a list; take first result
            if isinstance(results, list):
                result = results[0]
            else:
                result = results

            # Extract emotion scores
            emotion_scores = result.get("emotion", {})
            dominant_emotion = result.get("dominant_emotion", "neutral")
            # retinaface returns face_confidence=0.0 when no face (with enforce_detection=False
            # it returns whole-image region w=99 h=99 but confidence 0). Use confidence threshold.
            face_conf = result.get("face_confidence", 0)
            # DeepFace may return None or 0 when no face detected
            try:
                face_conf_val = float(face_conf) if face_conf is not None else 0.0
            except (TypeError, ValueError):
                face_conf_val = 0.0
            face_detected = face_conf_val > 0.5

            # If no face detected, force NEUTRAL — DeepFace still returns a dominant
            # emotion with enforce_detection=False even on empty frames, which is misleading
            if not face_detected:
                return EmotionEvent(
                    emotion=Emotion.NEUTRAL,
                    confidence=0.0,
                    timestamp=datetime.now(),
                    face_detected=False,
                    raw_scores={k: v / 100.0 for k, v in emotion_scores.items()} if emotion_scores else {},
                )

            # Map to our Emotion enum
            try:
                emotion = Emotion(dominant_emotion.lower())
            except ValueError:
                emotion = Emotion.NEUTRAL

            # Extract region bounding box if available
            region = result.get("region", {})
            face_box = {}
            if isinstance(region, dict) and "x" in region and "w" in region:
                face_box = {
                    "x": int(region.get("x", 0)),
                    "y": int(region.get("y", 0)),
                    "w": int(region.get("w", 0)),
                    "h": int(region.get("h", 0)),
                }

            return EmotionEvent(
                emotion=emotion,
                confidence=face_conf_val,
                timestamp=datetime.now(),
                face_detected=True,
                raw_scores={k: v / 100.0 for k, v in emotion_scores.items()},
                face_box=face_box,
            )

        except Exception as e:
            logger.warning(f"Analysis error in frame processing: {e}")
            return EmotionEvent(
                emotion=Emotion.NEUTRAL,
                confidence=0.0,
                timestamp=datetime.now(),
                face_detected=False,
            )

    async def process_frames(self, frame_queue: asyncio.Queue, event_queue: asyncio.Queue):
        """
        Main loop: picks frames from frame_queue at the controlled sample rate,
        runs DeepFace analysis in a thread, and puts EmotionEvent into event_queue.

        Args:
            frame_queue: Queue of (frame_index, np.ndarray) tuples from WebSocket handler.
            event_queue: Queue to put EmotionEvent results into.
        """
        # Load model in thread to avoid blocking
        await asyncio.to_thread(self._load_model)

        self._running = True
        logger.info(f"Vision agent started (sample rate: {self.sample_rate_hz} Hz)")

        while self._running:
            now = time.monotonic()
            elapsed = now - self._last_analysis_time

            if elapsed < self._frame_interval:
                await asyncio.sleep(0.01)
                continue

            # Grab the latest frame (discard old ones to avoid backlog)
            frame = None
            while not frame_queue.empty():
                try:
                    _, frame = frame_queue.get_nowait()
                except asyncio.QueueEmpty:
                    break

            if frame is None:
                await asyncio.sleep(0.01)
                continue

            # Run inference in thread pool (never blocks event loop)
            event = await asyncio.to_thread(self._analyze_frame, frame)
            self._last_analysis_time = time.monotonic()

            await event_queue.put(event)

    def stop(self):
        self._running = False
