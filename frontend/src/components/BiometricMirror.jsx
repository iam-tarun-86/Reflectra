import { useRef, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useFaceTracker } from "../hooks/useFaceTracker";

const MOOD_COLORS = {
  happy: "#10b981",
  sad: "#38bdf8",
  angry: "#f43f5e",
  surprise: "#fbbf24",
  fear: "#c084fc",
  disgust: "#a3e635",
  neutral: "#94a3b8",
};

export function BiometricMirror({
  onFrameCapture,
  lastEchoBlob,
  isFaceDetected,
  faceBox,
  dominantMood = "neutral",
  stability = 0,
  valence = 0,
  fps = "0.0",
}) {
  const videoRef = useRef(null);
  const echoCanvasRef = useRef(null);
  const hudCanvasRef = useRef(null);
  const captureCanvasRef = useRef(null);

  const [viewMode, setViewMode] = useState("mirror"); // 'mirror' | 'raw'
  const [cameraError, setCameraError] = useState(null);

  const { getSmoothedBox } = useFaceTracker();

  // Initialize Camera Stream
  useEffect(() => {
    let stream = null;
    let animId = null;
    let isCancelled = false;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        });

        if (videoRef.current && !isCancelled) {
          videoRef.current.srcObject = stream;
        }

        if (!captureCanvasRef.current) {
          const c = document.createElement("canvas");
          c.width = 640;
          c.height = 480;
          captureCanvasRef.current = c;
        }

        const captureCtx = captureCanvasRef.current.getContext("2d");
        let lastSend = 0;
        const SEND_INTERVAL_MS = 50; // 20 FPS throttle
        let inFlight = false;

        const loop = (now) => {
          if (isCancelled) return;
          animId = requestAnimationFrame(loop);

          if (videoRef.current && videoRef.current.readyState >= 2) {
            if (now - lastSend >= SEND_INTERVAL_MS && !inFlight) {
              lastSend = now;
              inFlight = true;
              captureCtx.drawImage(videoRef.current, 0, 0, 640, 480);
              captureCanvasRef.current.toBlob(
                (blob) => {
                  inFlight = false;
                  if (blob && onFrameCapture) {
                    blob.arrayBuffer().then((buf) => {
                      onFrameCapture(buf);
                    });
                  }
                },
                "image/jpeg",
                0.65
              );
            }
          }
        };

        animId = requestAnimationFrame(loop);
      } catch (err) {
        setCameraError(err.message);
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (animId) cancelAnimationFrame(animId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [onFrameCapture]);

  // Render Echo Frames
  useEffect(() => {
    if (!lastEchoBlob || !echoCanvasRef.current) return;
    const url = URL.createObjectURL(lastEchoBlob.blob);
    let isCleanedUp = false;
    const img = new Image();
    img.onload = () => {
      if (!isCleanedUp) {
        const ctx = echoCanvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 640, 480);
        }
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return () => {
      isCleanedUp = true;
      URL.revokeObjectURL(url);
    };
  }, [lastEchoBlob]);

  // Holographic JARVIS-Style HUD Canvas Drawing Loop
  useEffect(() => {
    let animId = null;
    const canvas = hudCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const render = () => {
      animId = requestAnimationFrame(render);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const smoothed = getSmoothedBox(faceBox, isFaceDetected);
      const moodCol = MOOD_COLORS[dominantMood] || "#94a3b8";

      if (isFaceDetected && smoothed) {
        // Mirrored coordinate calculation
        const bx = W - (smoothed.x + smoothed.w);
        const by = smoothed.y;
        const bw = smoothed.w;
        const bh = smoothed.h;

        ctx.save();

        // 1. Cyber L-Brackets with Radiant Screen Glow
        const cornerLen = Math.min(26, bw * 0.25);
        ctx.strokeStyle = moodCol;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = moodCol;
        ctx.shadowBlur = 14;

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cornerLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - cornerLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cornerLen, by + bh);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // 2. Center Crosshair
        const cx = bx + bw / 2;
        const cy = by + bh * 0.46;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy);
        ctx.lineTo(cx + 7, cy);
        ctx.moveTo(cx, cy - 7);
        ctx.lineTo(cx, cy + 7);
        ctx.stroke();

        // 3. Eye Tracking Vector Reticles
        const eyeY = by + bh * 0.36;
        const leftEyeX = bx + bw * 0.32;
        const rightEyeX = bx + bw * 0.68;
        const eyeR = Math.max(7, bw * 0.07);

        ctx.strokeStyle = moodCol;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(leftEyeX, eyeY, eyeR, 0, Math.PI * 2);
        ctx.arc(rightEyeX, eyeY, eyeR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset shadow

        // 4. Floating Holographic Leader-Line Telemetry Tag
        const tagX = bx + bw + 18;
        const tagY = by + 12;

        if (tagX + 130 < W) {
          // Leader Line
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx + bw, by + 18);
          ctx.lineTo(tagX, tagY);
          ctx.lineTo(tagX + 120, tagY);
          ctx.stroke();

          // Pinned Badge
          ctx.fillStyle = "rgba(10, 15, 28, 0.85)";
          ctx.fillRect(tagX, tagY + 2, 120, 32);
          ctx.strokeStyle = moodCol;
          ctx.strokeRect(tagX, tagY + 2, 120, 32);

          ctx.fillStyle = moodCol;
          ctx.font = "bold 10px 'JetBrains Mono', monospace";
          ctx.fillText(`AFFECT: ${dominantMood.toUpperCase()}`, tagX + 6, tagY + 15);

          ctx.fillStyle = "#cbd5e1";
          ctx.font = "9px 'JetBrains Mono', monospace";
          ctx.fillText(`STAB: ${Math.round(stability * 100)}% | VAL: ${valence >= 0 ? '+' : ''}${valence.toFixed(2)}`, tagX + 6, tagY + 28);
        }

        // Top Pill
        const pillH = 26;
        const pillW = Math.max(130, bw * 0.72);
        const pillX = bx + bw / 2 - pillW / 2;
        const pillY = Math.max(8, by - pillH - 8);

        ctx.fillStyle = "rgba(10, 15, 28, 0.9)";
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 6);
        ctx.fill();
        ctx.strokeStyle = moodCol;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `${dominantMood.toUpperCase()} ${Math.round(stability * 100)}%`,
          pillX + pillW / 2,
          pillY + pillH / 2
        );

        ctx.restore();
      } else {
        // Ambient Face Scanner Guide
        const time = performance.now() * 0.0015;
        const scanY = (Math.sin(time) * 0.4 + 0.5) * H;

        ctx.strokeStyle = "rgba(192, 132, 252, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(W * 0.25, scanY);
        ctx.lineTo(W * 0.75, scanY);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.ellipse(W / 2, H / 2, W * 0.22, H * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    animId = requestAnimationFrame(render);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [faceBox, isFaceDetected, dominantMood, stability, valence, getSmoothedBox]);

  const moodCol = MOOD_COLORS[dominantMood] || "#94a3b8";

  return (
    <div
      className="glass-panel rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden shadow-2xl transition-all duration-700"
      style={{
        boxShadow: `0 10px 40px -10px ${moodCol}25, 0 0 0 1px ${moodCol}30`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Eye className="w-4 h-4 text-purple-400" />
          <span>Biometric Mirror & JARVIS Face HUD 2.0</span>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-slate-900/90 border border-white/[0.12]">
          <button
            onClick={() => setViewMode("mirror")}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
              viewMode === "mirror"
                ? "bg-purple-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Mirror HUD
          </button>
          <button
            onClick={() => setViewMode("raw")}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
              viewMode === "raw"
                ? "bg-purple-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Raw Feed
          </button>
        </div>
      </div>

      {/* Video Viewport Container */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/85 border border-white/[0.12] shadow-inner flex items-center justify-center">
        {cameraError ? (
          <div className="text-center p-6 text-rose-400 text-sm">
            <p className="font-bold">Camera Access Failed</p>
            <p className="text-xs text-slate-400 mt-1">{cameraError}</p>
          </div>
        ) : (
          <>
            {/* Raw local webcam */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${
                viewMode === "raw" ? "block" : "hidden"
              }`}
            />

            {/* AI Processed echo frame */}
            <canvas
              ref={echoCanvasRef}
              width={640}
              height={480}
              className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${
                viewMode === "mirror" ? "block" : "hidden"
              }`}
            />

            {/* Holographic Cyber HUD Canvas Overlay */}
            <canvas
              ref={hudCanvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Bottom Live Telemetry Overlay */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/[0.1] text-[11px] font-mono text-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="text-slate-400">FPS:</span>
                <b className="text-emerald-400">{fps}</b>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-400">TRACKING:</span>
                <b className={isFaceDetected ? "text-emerald-400" : "text-rose-400"}>
                  {isFaceDetected ? "LOCKED" : "SEARCHING"}
                </b>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-400">VAL:</span>
                <b className="text-sky-400">{valence >= 0 ? `+${valence.toFixed(2)}` : valence.toFixed(2)}</b>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
