import { useState, useEffect, useCallback, useRef } from "react";

export function useSpeech() {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const voiceRef = useRef(null);

  const initVoices = useCallback(() => {
    if (!synthRef.current) return;
    const voices = synthRef.current.getVoices();
    // Prioritize natural English voices
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Natural") ||
          v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Jenny") ||
          v.name.includes("Ava"))
    );
    voiceRef.current = preferred || voices.find((v) => v.lang.startsWith("en")) || voices[0];
  }, []);

  useEffect(() => {
    if (!synthRef.current) return;
    synthRef.current.onvoiceschanged = initVoices;
    initVoices();
  }, [initVoices]);

  const speak = useCallback(
    (text) => {
      if (!isVoiceEnabled || !synthRef.current) return;
      synthRef.current.cancel(); // Stop prior speech

      const cleanText = (text || "").replace(/[\[\]\(\)\*\"]/g, "").trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = 1.0;
      utterance.pitch = 1.04;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [isVoiceEnabled]
  );

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled((prev) => {
      if (prev && synthRef.current) {
        synthRef.current.cancel();
      }
      return !prev;
    });
  }, []);

  return {
    isVoiceEnabled,
    isSpeaking,
    speak,
    toggleVoice,
  };
}
