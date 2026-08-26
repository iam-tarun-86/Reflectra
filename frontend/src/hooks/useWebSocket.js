import { useState, useEffect, useRef, useCallback } from "react";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [statusText, setStatusText] = useState("Connecting...");
  const [fps, setFps] = useState("0.0");
  const [metadata, setMetadata] = useState(null);
  const [lastEchoBlob, setLastEchoBlob] = useState(null);

  const wsRef = useRef(null);
  const echoSeqRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef(0);
  const isMountedRef = useRef(true);
  const connectRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.port === "5173" ? "127.0.0.1:8000" : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/video`;

    setStatusText("Connecting to Neural Engine...");
    const socket = new WebSocket(wsUrl);
    socket.binaryType = "arraybuffer";
    wsRef.current = socket;

    socket.onopen = () => {
      if (!isMountedRef.current) return;
      setIsConnected(true);
      setStatusText("Neural Stream Online");
    };

    socket.onmessage = (event) => {
      if (!isMountedRef.current) return;
      const buf = event.data;
      if (typeof buf === "string" || buf.byteLength < 4) return;

      const view = new DataView(buf);
      const first4 = view.getUint32(0, false);

      // Metadata JSON packet detection (length prefix header)
      if (first4 < 2048 && (first4 + 4 === buf.byteLength || first4 + 5 === buf.byteLength)) {
        try {
          const metaStr = new TextDecoder().decode(buf.slice(4, 4 + first4));
          const parsed = JSON.parse(metaStr);
          setMetadata(parsed);
        } catch (e) {
          console.error("Metadata parse error:", e);
        }
        return;
      }

      // JPEG Echo Frame
      const mySeq = ++echoSeqRef.current;
      const blob = new Blob([buf], { type: "image/jpeg" });
      setLastEchoBlob({ blob, seq: mySeq });

      frameCountRef.current++;
      if (!fpsTimerRef.current) {
        fpsTimerRef.current = performance.now();
      }
      const elapsed = (performance.now() - fpsTimerRef.current) / 1000;
      if (elapsed >= 1.0) {
        setFps((frameCountRef.current / elapsed).toFixed(1));
        frameCountRef.current = 0;
        fpsTimerRef.current = performance.now();
      }
    };

    socket.onclose = () => {
      if (!isMountedRef.current) return;
      setIsConnected(false);
      setStatusText("Disconnected — Reconnecting...");
      setTimeout(() => {
        if (isMountedRef.current && connectRef.current) {
          connectRef.current();
        }
      }, 2000);
    };

    socket.onerror = () => {
      if (!isMountedRef.current) return;
      setIsConnected(false);
      setStatusText("Connection Error");
    };
  }, []);

  useEffect(() => {
    connectRef.current = connect;
    isMountedRef.current = true;
    fpsTimerRef.current = performance.now();
    connect();
    return () => {
      isMountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendFrame = useCallback((arrayBuffer) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (wsRef.current.bufferedAmount < 256 * 1024) {
        wsRef.current.send(arrayBuffer);
        return true;
      }
    }
    return false;
  }, []);

  const sendDebugEmotion = useCallback((emotion) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ debug: emotion }));
    }
  }, []);

  return {
    isConnected,
    statusText,
    fps,
    metadata,
    lastEchoBlob,
    sendFrame,
    sendDebugEmotion,
    reconnect: connect,
  };
}
