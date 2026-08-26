"""
Reflectra — Startup & Shutdown Script
Starts the backend server, opens browser, and cleanly kills everything on Ctrl+C.
"""
import subprocess
import sys
import time
import webbrowser
import signal
import os

HOST = "127.0.0.1"  # P7.5: localhost-only by default; override here if LAN demo needed
PORT = 8000
BROWSER_URL = f"http://localhost:{PORT}"

# Track child processes for cleanup
processes: list[subprocess.Popen] = []


def shutdown(signum=None, frame=None):
    """Kill all child processes and exit."""
    print("\n[STOP] Shutting down all servers...")
    for p in processes:
        if p.poll() is None:  # still running
            print(f"   Killing PID {p.pid}")
            try:
                p.terminate()
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
            except Exception:
                pass
    print("[OK] All servers stopped.")
    sys.exit(0)


# Handle Ctrl+C and Ctrl+Break
signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)


def start_backend():
    """Start the FastAPI/uvicorn backend server."""
    print("[START] Starting backend server...")
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


def wait_for_server(host: str, port: int, timeout: float = 30.0):
    """Poll until the server is accepting connections."""
    import socket
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except (ConnectionRefusedError, OSError):
            time.sleep(0.3)
    return False


def main():
    print("=" * 50)
    print("  Reflectra — An Adaptive AI Mirror")
    print("=" * 50)

    # Start backend
    backend = start_backend()

    # Wait for it to be ready
    print(f"[WAIT] Waiting for server on port {PORT}...")
    if wait_for_server("localhost", PORT):
        print(f"[OK] Backend running at {BROWSER_URL}")
        webbrowser.open(BROWSER_URL)
        print("   Browser opened. Press Ctrl+C to stop.\n")
    else:
        print("[FAIL] Server failed to start within timeout")
        shutdown()
        return

    # Keep running until Ctrl+C
    try:
        while True:
            # Check if backend crashed
            if backend.poll() is not None:
                print(f"[FAIL] Backend process exited with code {backend.returncode}")
                shutdown()
                return
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        shutdown()


if __name__ == "__main__":
    main()
