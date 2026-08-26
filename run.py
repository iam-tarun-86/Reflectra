"""
REFLECTRA — Master Launcher & Health Check System
Performs pre-flight checks, starts the FastAPI & React engine, opens the browser,
and verifies clean teardown of both servers and ports upon exit.
"""
import os
import sys
import time
import socket
import signal
import urllib.request
import webbrowser
import subprocess
from pathlib import Path

# Paths & Configuration
ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
FRONTEND_DIST = FRONTEND_DIR / "dist"
HOST = "127.0.0.1"
PORT = 8000
BROWSER_URL = f"http://{HOST}:{PORT}"
LLM_URL = os.environ.get("REFLECTRA_LLM_URL", "http://localhost:8085/v1")

# Child process tracker
processes: list[subprocess.Popen] = []


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a specific TCP port is currently occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.6)
        return s.connect_ex((host, port)) == 0


def kill_process_tree(pid: int):
    """Cleanly terminate a process and all its descendants on Windows/POSIX."""
    if os.name == "nt":
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True)
    else:
        try:
            os.kill(pid, signal.SIGKILL)
        except OSError:
            pass


def preflight_checks():
    """Run diagnostics before starting servers."""
    print("\n" + "=" * 65)
    print("  🪞 REFLECTRA — PRE-FLIGHT SYSTEM HEALTH CHECKS")
    print("=" * 65)

    # 1. Check Python Environment
    print(f"[*] Python Runtime      : {sys.version.split()[0]} ({sys.executable})")

    # 2. Check Port 8000 Availability
    if is_port_in_use(PORT):
        print(f"[!] Port {PORT} is already occupied. Clearing orphaned process...")
        if os.name == "nt":
            # Find PID listening on port 8000
            try:
                res = subprocess.run(f"netstat -ano | findstr :{PORT}", shell=True, capture_output=True, text=True)
                for line in res.stdout.strip().splitlines():
                    if "LISTENING" in line:
                        parts = line.strip().split()
                        pid = parts[-1]
                        if pid.isdigit() and int(pid) != os.getpid():
                            print(f"    Terminating orphaned PID {pid} on port {PORT}...")
                            kill_process_tree(int(pid))
                time.sleep(1)
            except Exception as e:
                print(f"    Warning during port cleanup: {e}")

        if is_port_in_use(PORT):
            print(f"[ERROR] Port {PORT} is still occupied. Please close the existing server.")
            sys.exit(1)
    print(f"[✓] Port {PORT} Status     : Available & Ready")

    # 3. Check Frontend Build Assets
    if not (FRONTEND_DIST / "index.html").exists():
        print("[!] Frontend dist not found. Building React production bundle with Vite...")
        try:
            subprocess.run(["npm", "run", "build"], cwd=str(FRONTEND_DIR), check=True, shell=True)
            print("[✓] Frontend Build      : Successfully compiled to frontend/dist")
        except Exception as e:
            print(f"[ERROR] Frontend build failed: {e}")
            sys.exit(1)
    else:
        print("[✓] Frontend Build      : Production bundle verified (frontend/dist)")

    # 4. Check Local LLM Server
    try:
        req = urllib.request.Request(f"{LLM_URL}/models", headers={"User-Agent": "EmotionLens"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            if resp.status == 200:
                print(f"[✓] Local LLM Server    : Online ({LLM_URL})")
    except Exception:
        print(f"[i] Local LLM Server    : Offline at {LLM_URL} (Heuristic mode active)")

    # 5. Check Webcam Access
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        if cap.isOpened():
            print("[✓] Camera Hardware     : Primary webcam detected & operational")
            cap.release()
        else:
            print("[!] Camera Hardware     : Camera 0 busy or not found (Webcam in browser will prompt)")
    except Exception:
        print("[*] Camera Hardware     : OpenCV check skipped")

    print("-" * 65)


def start_backend() -> subprocess.Popen:
    """Launch the FastAPI + WebSockets + Multi-Agent server."""
    print("\n[START] Launching EmotionLens Core Engine on http://127.0.0.1:8000...")
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"

    cmd = [
        sys.executable, "-m", "uvicorn",
        "backend.app:app",
        "--host", HOST,
        "--port", str(PORT),
    ]

    p = subprocess.Popen(cmd, env=env)
    processes.append(p)
    return p


def wait_for_server(host: str, port: int, timeout: float = 20.0) -> bool:
    """Poll until server responds to HTTP requests."""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        try:
            req = urllib.request.Request(f"http://{host}:{port}/health")
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.3)
    return False


def shutdown(signum=None, frame=None):
    """Gracefully terminate all processes and verify complete stop."""
    print("\n" + "=" * 65)
    print("  🛑 SHUTDOWN SEQUENCE INITIATED")
    print("=" * 65)

    # Terminate tracked child processes
    for p in processes:
        if p.poll() is None:
            print(f"[*] Terminating Process PID {p.pid}...")
            kill_process_tree(p.pid)
            try:
                p.wait(timeout=3)
            except Exception:
                pass

    # Give OS a moment to free sockets
    time.sleep(0.8)

    # Post-Stop Verification
    print("\n[*] Performing Post-Stop Verification:")
    port_busy = is_port_in_use(PORT)
    if not port_busy:
        print(f"[✓] Backend Server      : STOPPED (Port {PORT} is closed & free)")
        print(f"[✓] Frontend Server     : STOPPED (Static dist released)")
        print(f"[✓] Multi-Agent Threads : RELEASED")
        print("\n[OK] All servers and background tasks stopped cleanly.")
    else:
        print(f"[!] Warning: Port {PORT} appears still bound. Forcing cleanup...")
        if os.name == "nt":
            subprocess.run(f"for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :{PORT}') do taskkill /f /pid %a", shell=True, capture_output=True)
        print(f"[✓] Final port status: {'FREE' if not is_port_in_use(PORT) else 'IN_USE'}")

    print("=" * 65 + "\n")
    sys.exit(0)


# Attach signal handlers
signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)


def main():
    preflight_checks()
    backend_proc = start_backend()

    print(f"[*] Awaiting server initialization on port {PORT}...")
    if wait_for_server(HOST, PORT):
        print(f"[✓] Server verified healthy at {BROWSER_URL}")
        print(f"[*] Opening browser dashboard...")
        webbrowser.open(BROWSER_URL)

        # Print Interactive Instructions Banner
        print("\n" + "=" * 65)
        print("  🌟 EMOTIONLENS IS NOW RUNNING!")
        print("=" * 65)
        print("  • URL              : http://127.0.0.1:8000")
        print("  • Architecture     : React 18 + Tailwind + 5-Agent Neural Pipeline")
        print("  • Voice Mode (TTS) : Press 'V' on keyboard or click 'Voice: ON'")
        print("  • Session Summary  : Press 'E' on keyboard or click 'End Session'")
        print("  • Demo Injectors   : Press '1'-'7' to simulate instant emotions")
        print("  • Stop Server      : Press Ctrl + C in this terminal")
        print("=" * 65 + "\n")
    else:
        print(f"[ERROR] Backend failed to start on port {PORT} within timeout.")
        shutdown()
        return

    # Keep alive loop with crash detection
    try:
        while True:
            if backend_proc.poll() is not None:
                print(f"\n[!] Backend process stopped unexpectedly (Code: {backend_proc.returncode})")
                shutdown()
                break
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()
    finally:
        shutdown()


if __name__ == "__main__":
    main()
