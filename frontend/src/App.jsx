import React, { useState, useEffect, useCallback, useRef } from "react";
import { RetroGrid } from "./components/RetroGrid";
import { OrbitalRings } from "./components/OrbitalRings";
import { Header } from "./components/Header";
import { WelcomeHero } from "./components/WelcomeHero";
import { BiometricMirror } from "./components/BiometricMirror";
import { EmotionRadar } from "./components/EmotionRadar";
import { EmotionSpectrum } from "./components/EmotionSpectrum";
import { NeuralPipeline } from "./components/NeuralPipeline";
import { SpokenReflection } from "./components/SpokenReflection";
import { TimelineStream } from "./components/TimelineStream";
import { TelemetryConsole } from "./components/TelemetryConsole";
import { DemoDeck } from "./components/DemoDeck";
import { AnalyticsModal } from "./components/AnalyticsModal";

import { useWebSocket } from "./hooks/useWebSocket";
import { useSpeech } from "./hooks/useSpeech";
import { soundFX } from "./utils/audioFX";

const MOOD_COLORS = {
  happy: "#10b981",
  sad: "#38bdf8",
  angry: "#f43f5e",
  surprise: "#fbbf24",
  fear: "#c084fc",
  disgust: "#a3e635",
  neutral: "#94a3b8",
};

export default function App() {
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [isStarted, setIsStarted] = useState(urlParams?.get("autostart") === "true" || false);

  const { isConnected, fps, metadata, lastEchoBlob, sendFrame, sendDebugEmotion } = useWebSocket();
  const { isVoiceEnabled, isSpeaking, speak, toggleVoice } = useSpeech();

  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [timelineData, setTimelineData] = useState([]);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [logs, setLogs] = useState([
    { time: "0.0", agent: "System", message: "EmotionLens Neural Dashboard initialized." },
  ]);
  const [isSummaryOpen, setIsSummaryOpen] = useState(urlParams?.get("modal") === "true" || false);
  const [governorStatus, setGovernorStatus] = useState("IDLE");
  const [currentReflection, setCurrentReflection] = useState(
    "Welcome to EmotionLens. Express yourself and notice how your emotional patterns reflect in real time."
  );
  const [llmLatency, setLlmLatency] = useState(null);
  const [llmModel, setLlmModel] = useState("Local LLM");

  const lastLoggedRawRef = useRef(0);
  const lastReflectionRef = useRef(currentReflection);

  const handleStart = useCallback(() => {
    setIsStarted(true);
    setSessionStartTime(Date.now());
    speak("Neural Mirror initialized. Welcome to EmotionLens.");
  }, [speak]);

  const addLog = useCallback((agent, message) => {
    const timeSec = ((Date.now() - sessionStartTime) / 1000).toFixed(1);
    setLogs((prev) => [...prev.slice(-50), { time: timeSec, agent, message }]);
  }, [sessionStartTime]);

  // Handle incoming metadata updates
  useEffect(() => {
    if (!metadata || !isStarted) return;

    // 1. Mood State & Timeline Point
    if (metadata.mood) {
      const mood = metadata.mood;
      const timeSec = (Date.now() - sessionStartTime) / 1000;
      const isShift = mood.current !== mood.previous && mood.duration < 2.5;

      if (isShift) {
        soundFX.playEmotionShift(mood.current);
        setShiftHistory((prev) => [
          ...prev.slice(-15),
          {
            time: timeSec.toFixed(1),
            from: mood.previous,
            to: mood.current,
          },
        ]);
        addLog("State", `Shift: ${mood.previous} ➔ ${mood.current} (${mood.trend} ${Math.round(mood.stability * 100)}%)`);
      }

      setTimelineData((prev) => [
        ...prev.slice(-300),
        {
          t: timeSec,
          emotion: mood.current,
          stability: mood.stability,
          valence: metadata.valence !== undefined ? metadata.valence : 0,
          shift: isShift,
        },
      ]);
    }

    // 2. Reaction Governor
    if (metadata.reaction) {
      setGovernorStatus("TRIGGER");
      addLog("Governor", `TRIGGER [${metadata.reaction.trigger_type}] ${metadata.reaction.from}➔${metadata.reaction.to}: ${metadata.reaction.reason}`);
      setTimeout(() => setGovernorStatus("COOLDOWN"), 2000);
      setTimeout(() => setGovernorStatus("IDLE"), 4000);
    }

    // 3. LLM Response & Speech Synthesis
    if (metadata.llm && metadata.llm.text) {
      const newText = metadata.llm.text;
      if (newText !== lastReflectionRef.current) {
        lastReflectionRef.current = newText;
        setCurrentReflection(newText);
        setLlmLatency(metadata.llm.latency_ms);
        setLlmModel(metadata.llm.model || "Local LLM");
        addLog("LLM", `Observation: "${newText}" (${metadata.llm.latency_ms}ms)`);
        speak(newText);
      }
    }

    // 4. Raw Feature Telemetry
    if (metadata.raw) {
      const now = Date.now();
      if (now - lastLoggedRawRef.current > 5000) {
        lastLoggedRawRef.current = now;
        const top = Object.entries(metadata.raw).sort((a, b) => b[1] - a[1])[0];
        if (top) {
          addLog("Vision", `Dominant facial feature: ${top[0]} (${Math.round(top[1] * 100)}%)`);
        }
      }
    }
  }, [metadata, isStarted, sessionStartTime, addLog, speak]);

  // Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const k = e.key.toLowerCase();
      if (k === "v") toggleVoice();
      if (k === "e") setIsSummaryOpen(true);
      if (k === "d" || k === "1") sendDebugEmotion("happy");
      if (k === "2") sendDebugEmotion("sad");
      if (k === "3") sendDebugEmotion("surprise");
      if (k === "4") sendDebugEmotion("neutral");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleVoice, sendDebugEmotion]);

  const dominantMood = metadata?.mood?.current || "neutral";
  const moodColor = MOOD_COLORS[dominantMood] || "#94a3b8";
  const moodGlow = `${moodColor}33`;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Background Visual Effects */}
      <RetroGrid moodGlowColor={moodGlow} />
      <OrbitalRings moodColor={moodColor} />

      {/* Tap to Begin Screen */}
      {!isStarted && <WelcomeHero onStart={handleStart} />}

      {/* Header */}
      <Header
        isConnected={isConnected}
        fps={fps}
        isVoiceEnabled={isVoiceEnabled}
        onToggleVoice={toggleVoice}
        onOpenSummary={() => setIsSummaryOpen(true)}
        onStandby={() => setIsStarted(false)}
      />

      {/* Main Content Layout */}
      <main className="relative z-10 flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full flex flex-col gap-5">
        
        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column: Video Mirror & Biometric Radar (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <BiometricMirror
              onFrameCapture={isStarted ? sendFrame : null}
              lastEchoBlob={lastEchoBlob}
              isFaceDetected={metadata?.face_detected !== undefined ? metadata.face_detected : true}
              faceBox={metadata?.face_box || null}
              dominantMood={dominantMood}
              stability={metadata?.mood?.stability || 0}
              valence={metadata?.valence !== undefined ? metadata.valence : 0}
              fps={fps}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EmotionRadar
                valence={metadata?.valence !== undefined ? metadata.valence : 0}
                arousal={metadata?.arousal !== undefined ? metadata.arousal : 0.5}
                moodColor={moodColor}
              />
              <EmotionSpectrum
                rawScores={metadata?.raw || {}}
                dominantMood={dominantMood}
                trend={metadata?.mood?.trend || "stable"}
                duration={metadata?.mood?.duration || 0}
                stability={metadata?.mood?.stability || 0}
              />
            </div>
          </div>

          {/* Right Column: Neural Command Center (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <NeuralPipeline
              isVisionActive={isConnected}
              stateStability={metadata?.mood?.stability || 0}
              contextSessionSec={metadata?.session_duration || (Date.now() - sessionStartTime) / 1000}
              governorStatus={governorStatus}
              llmLatency={llmLatency}
            />

            <SpokenReflection
              text={currentReflection}
              latency={llmLatency}
              model={llmModel}
              isSpeaking={isSpeaking}
              dominantMood={dominantMood}
              valence={metadata?.valence !== undefined ? metadata.valence : 0}
              arousal={metadata?.arousal !== undefined ? metadata.arousal : 0.5}
              stability={metadata?.mood?.stability || 0.8}
              onSpeakAgain={() => speak(currentReflection)}
            />

            <DemoDeck
              onInjectEmotion={(emo) => {
                soundFX.playClick();
                sendDebugEmotion(emo);
                addLog("Debug", `Simulated emotion: ${emo.toUpperCase()}`);
              }}
              onVoiceTest={() => {
                soundFX.playClick();
                speak(currentReflection);
              }}
            />

            <TelemetryConsole
              logs={logs}
              onClear={() => setLogs([])}
            />
          </div>

        </div>

        {/* Bottom Timeline Full-Width */}
        <TimelineStream timelineData={timelineData} />

      </main>

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        sessionDuration={(Date.now() - sessionStartTime) / 1000}
        totalReactions={metadata?.total_reactions || 0}
        dominantMood={dominantMood}
        shiftHistory={shiftHistory}
        timelineData={timelineData}
        lastReflection={currentReflection}
        onSpeak={speak}
      />
    </div>
  );
}
