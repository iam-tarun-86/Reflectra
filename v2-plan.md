# Reflectra v2 — Implementation Plan (Phases 7–16)

Continues from `reflectra-implementation-plan.md` (Phases 0–6 complete).
Protocol: read `context.txt` first, append after every phase. Never overwrite.

## Locked Decisions
- **LLM (single-slot):** Qwen 3.5 4B primary (`enable_thinking:false` + `/no_think`), Gemma 4 E4B emergency fallback. Only ONE model loaded at a time (8GB VRAM). Swap via `swap_llm.ps1`. Backend talks OpenAI-style to whatever is on `:8085`; config profile only tunes max_tokens/thinking-strip.
- **TTS:** Pocket TTS (local, lightweight). Verify install + <500ms per 30 words at Phase 14 kickoff. Piper = documented drop-in fallback.
- **Scope:** Phases 7–13 CORE (mandatory). 14–15 STRETCH (if demo time remains). 16 closeout trimmed to quickstart docs if needed.
- **Dashboard:** same-screen split layout (videos shrink left, animated pipeline docked right/below). `/dashboard` fullscreen route kept as bonus.
- **Fallback chain:** active model down → canned pattern-referencing line + `model:"fallback"` in UI. No dual-model endpoint.

---

## Phase 7 — Critical Patch Pack 🔴 (CORE)
1. **WS disconnect fix** (`backend/app.py` receive loop): handle `{"type":"websocket.disconnect"}`, catch RuntimeError, log stats and exit cleanly.
2. **Reasoning-leak sanitizer** (`agents/llm.py::sanitize_llm_text`): extract `Final:/Response:` marker from reasoning dumps; reject lines with `**`, list artifacts, step numbers; single shared helper used by live path AND `/session/summary`.
3. **Stale-trigger coalescing** (`agents/llm.py::process_reactions`): drain queue keep-newest; drop triggers older than 10s.
4. **Debug tagging**: `source:str="real"|"debug"` field on EmotionEvent/MoodState/ReactionTriggered; Context dominant-mood counter skips debug; inject sets debug end-to-end.
5. **Security**: default HOST `127.0.0.1`; optional `REFLECTRA_TOKEN` env → token check on WS + `/session/summary`; rate-limit summary 1 req / 3s.
6. **Qwen swap & bench gate**: `swap_llm.ps1 qwen|gemma` restarts WSL2 llama-server; `bench_llm.py` 10-prompt p50/p95 — acceptance p95 < 2s for 30-word reflections.

## Phase 8 — Vision Engine Upgrade 🟠
- Singleton `VisionService`: one DeepFace loop, fan-out queues to N WS clients (multi-tab safe).
- `bench_detectors.py`: retinaface vs mtcnn vs ssd vs yunet ms/frame table → pick fastest accurate.
- Two-stage: fast detector → crop → emotion on crop (`detector_backend="skip"`).
- Optional ONNX Runtime DirectML flag if CPU <5Hz. Multi-face: emit list, primary = largest area.

## Phase 9 — State & Governor v2 🟠
- `config.py` (pydantic-settings): ports, thresholds, cooldowns, LLM profiles (`qwen-3.5-4b {max_tokens:120, thinking:false}`, `gemma-4-e4b {max_tokens:400, strip_reasoning:true}`).
- Hysteresis smoothing: EMA valence + enter 0.45 / exit 0.30 thresholds replace window voting.
- Repeat-guard: block same-emotion reaction unless changed OR 30s.
- Per-emotion cooldown map replaces global 4s. Debug inject via governor `force_shift()` tagged end-to-end.

## Phase 10 — Persistence 🟠
- SQLite (`sessions`, `moods`, `reactions`) + async writer task.
- `GET /sessions`, `/sessions/{id}/export` JSON, timeline PNG auto-save at session end.
- Past-sessions dropdown → view-only timeline replay.

## Phase 11 — Tests & Observability
- pytest suite: governor rules matrix, hysteresis, context streaks, sanitizer (mock httpx), WS integration w/ synthetic JPEG.
- `/metrics`: p50/p95 per-agent latency, trigger counts, fps, ws clients → card in gear panel.
- Structured logging everywhere (kill print()).

## Phase 12 — Pipeline Split View 📺 (CORE flagship)
- Main page CSS-grid restructure: videos left (shrunk), animated 5-node pipeline strip right/below, timeline bottom.
- `/ws/dashboard` compact event tap off existing queues (zero extra inference); node pulse + last output snippet.
- `/dashboard` fullscreen route as bonus for phones.

## Phase 13 — HUD + Timeline v2
- Overlay on echo canvas: face box (region from VisionService), top-2 emotions %, stability bar, trend arrow.
- Timeline v2: valence curve −1..+1, colored band, clickable trigger markers → historic LLM tooltip; full-session scrub; restore-on-refresh from P10 DB.

## Phase 14 — Voice Mode 🎙️ (STRETCH)
- Pocket TTS behind `ENABLE_VOICE=1`; verify offline + <500ms/30words else swap to Piper.
- Speak queue (drop overlaps), 🔊 toggle persisted, speaking indicator; skip if LLM >3s stale.

## Phase 15 — Share Card + Nudges (STRETCH)
- `/session/{id}/card` Pillow composite 1200×630 (timeline PNG + stats + closing line).
- Long-term Context nudges through Governor→LLM with `trigger_type="nudge"` (10min cooldown).
- Hotkeys: E=end, D=debug-happy, V=voice.

## Phase 16 — Closeout
- README quickstart (+optional docker-compose, both GGUFs as volumes).
- Morning-of-demo bench ritual; full rehearsal timing table; pitch v2; final `context.txt` entry.
