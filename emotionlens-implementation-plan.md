# Reflectra — An Adaptive AI Mirror
## Multi-Agent Implementation Plan (for AI coding agent execution)

---

## ⚠️ MANDATORY: context.txt Protocol

Before starting ANY phase, create/update a file called `context.txt` in the project root. This file is the single source of truth across sessions — treat it as persistent memory.

**Every session must:**
1. Read `context.txt` first, before writing any code.
2. After completing each phase (or any meaningful subtask), append to `context.txt`:
   - What was built
   - What decisions were made and why
   - What's tested and passing
   - What's NOT done yet
   - Any blockers or gotchas hit
3. Never overwrite `context.txt` — only append, so history is preserved.

**Initial `context.txt` template to create in Phase 0:**
```
# Reflectra — Project Context

## Project Summary
Multi-agent real-time webcam emotion-reading app ("An Adaptive AI Mirror"). 5 agents:
Vision Agent -> Emotional State Agent -> Context/Memory Agent -> Reaction Governor -> LLM Response Agent (Ollama)
Frontend shows: live video, emotion timeline, agent activity panel, session summary.

## Architecture Decisions (locked in, do not change without reason)
- Orchestration: custom FastAPI + WebSockets + asyncio (NOT CrewAI/AutoGen/LangGraph)
- Vision: DeepFace or FER, sampled at 5-10 FPS (NOT every frame)
- LLM: llama.cpp (running in WSL2) serving Gemma 4 E4B, called ONLY when Reaction Governor triggers it
- LLM access is via an OpenAI-compatible endpoint (llama.cpp's `server` mode exposes `/v1/chat/completions`) — call it with a standard OpenAI-client-style request pointed at the local base URL, so the backend code isn't locked to one runtime
- Backend (FastAPI) can run on Windows host while llama.cpp server runs in WSL2 — they talk over the OpenAI-compatible HTTP endpoint (e.g. `http://localhost:<port>/v1`), so this sidesteps needing webcam passthrough into WSL2 at all
- Governor and State agents are pure Python/rule-based, NOT LLM calls
- Run webcam capture + FastAPI natively on Windows host if WSL2 webcam passthrough causes issues (known past issue: `/dev/nvidia*` devices not appearing in WSL2 — GPU inference for llama.cpp in WSL2 needs compute-only NVIDIA libraries, not full kernel drivers)
- DeepFace/blocking calls MUST run via asyncio.to_thread() — never block the event loop
- LLM choice note: Gemma 4 E4B is small/fast enough for quick turnaround on an 8GB card, which matters since this is only called on Governor-triggered events (not continuous) — good fit for this project's latency needs. If response quality feels thin, a swap to a 7-9B dense model is the fallback (see local-llm-setup notes), but start with Gemma 4 E4B for speed

## Session Log
(append entries below, newest at bottom)

### Session 1 - [date]
- Status: not started
```

---

## Phase 0 — Environment Setup & Skeleton
**Goal:** Confirm the stack works before any agent logic is written.

**Tasks:**
- Set up project folder structure (`/backend`, `/frontend`, `/agents`)
- Install: `fastapi`, `uvicorn`, `websockets`, `opencv-python`, `deepface`, `openai` (python client, used only for its OpenAI-compatible HTTP client — not calling actual OpenAI)
- Start llama.cpp server in WSL2 in OpenAI-compatible server mode, loaded with Gemma 4 E4B, confirm it exposes `/v1/chat/completions`
- Confirm the Windows-side backend can reach that endpoint over `http://localhost:<port>/v1` and get a completion back
- Confirm webcam access works — test on native Windows if WSL2 gives trouble (this is also why the LLM is isolated behind an HTTP endpoint — webcam stays on Windows, LLM stays in WSL2, no passthrough needed)
- Create `context.txt` with the template above

**Test before moving on:**
- [ ] `curl`/script confirms llama.cpp's OpenAI-compatible endpoint responds to a basic chat completion request
- [ ] Confirm response latency for a short prompt is acceptable (note actual seconds in context.txt — this sets expectations for Phase 4)
- [ ] A standalone OpenCV script can open the webcam and show a live window (on Windows host)
- [ ] `uvicorn` runs a bare FastAPI app and serves a test route
- [ ] `context.txt` created and committed, including the llama.cpp server launch command used (so it's reproducible next session)

---

## Phase 1 — Webcam → Backend → Browser Round-trip
**Goal:** Prove the real-time video pipe works end-to-end before adding any ML.

**Tasks:**
- Build minimal HTML/JS page that captures webcam frames and sends them to FastAPI over WebSocket
- Backend receives frame, does nothing but echo it back (or just logs frame size/rate)
- Browser displays the returned frame

**Test before moving on:**
- [ ] Live video visibly streams browser → backend → browser with no crash
- [ ] Frame rate logged in console (confirm it's reasonably close to real-time, no major lag build-up)
- [ ] Works over `localhost` (confirms no HTTPS/webcam permission issues)
- [ ] Append results to `context.txt`

---

## Phase 2 — Vision Agent + Emotional State Agent
**Goal:** Real emotion detection running at a controlled sample rate, smoothed into a stable state.

**Tasks:**
- Integrate DeepFace/FER into the backend loop
- Sample at 5–10 FPS (not every frame) — implement frame-skipping logic
- Run inference via `asyncio.to_thread()` so it never blocks the WebSocket loop
- Vision Agent outputs an `EmotionEvent`: `{emotion, confidence, timestamp, face_detected}`
- Emotional State Agent consumes a rolling window of `EmotionEvent`s and outputs a `MoodState`: `{current, previous, trend, duration, stability}`
- Log both outputs to terminal (no UI yet)

**Test before moving on:**
- [ ] Raw `EmotionEvent`s print correctly and match what you'd expect making faces at the camera
- [ ] Video feed does NOT stutter/freeze while inference runs
- [ ] `MoodState` correctly smooths noisy flickers (e.g. one stray "sad" frame among "happy" frames doesn't flip the stable state)
- [ ] Trend detection correctly identifies a deliberate mood shift (neutral → happy sustained)
- [ ] Append results + any tuning notes (sample rate, smoothing window size) to `context.txt`

---

## Phase 3 — Context/Memory Agent + Reaction Governor
**Goal:** Decide *when* to react — with no LLM involved yet (use dummy text output).

**Tasks:**
- Context/Memory Agent maintains session state: session start time, mood history log, time since last reaction
- Reaction Governor implements rule-based triggers, e.g.:
  - Mood changed AND sustained for X seconds
  - Strong emotion (confidence above threshold)
  - Minimum cooldown since last reaction (prevent spam)
- On trigger, Governor emits a `ReactionTriggered` event with reason — for now, just print a dummy string like `"[DUMMY] Reacting to: neutral->happy"`

**Test before moving on:**
- [ ] Governor stays silent during stable/unchanged mood (no spam)
- [ ] Governor fires on a genuine sustained mood shift
- [ ] Cooldown logic prevents rapid-fire re-triggering
- [ ] Test edge case: no face detected for a while — confirm it doesn't crash or trigger nonsense
- [ ] Append trigger thresholds chosen + reasoning to `context.txt`

---

## Phase 4 — LLM Response Agent (Ollama)
**Goal:** Replace dummy text with real contextual responses, only on Governor trigger.

**Tasks:**
- Build prompt template for the LLM Response Agent using: current emotion, previous emotion, trend, duration, session context
- Call the llama.cpp OpenAI-compatible endpoint asynchronously (`await`, using an async HTTP client — never blocking) only when `ReactionTriggered` fires
- Response should reference the *pattern*, not just label the current frame (avoid the "you look happy... still happy" trap)
- Phrase everything as "facial-expression patterns," never as claims about psychological/internal state
- Keep prompts short — Gemma 4 E4B is fast but a bloated system prompt eats into that speed advantage

**Test before moving on:**
- [ ] LLM only fires on Governor trigger, not continuously
- [ ] Response text is contextual (references trend/change, not just current label)
- [ ] Confirm video feed stays smooth while LLM is generating (no blocking)
- [ ] Test response latency — confirm it's acceptable for a live demo (note actual seconds in context.txt)
- [ ] Append sample prompts + outputs to `context.txt` for future tuning reference

---

## Phase 5 — Frontend: Timeline, Agent Activity Panel, Session Summary
**Goal:** Make the multi-agent architecture visible — this is the demo's actual wow factor.

**Tasks:**
- Live emotion timeline: scrolling chart/log of mood over session time
- Agent Activity Panel: real-time sidebar showing each agent firing (Vision → State → Context → Governor → LLM) with their outputs, as events happen
- Session Summary screen: dominant mood, major shifts with timestamps, one AI-generated closing observation, triggered on session end (e.g. face leaves frame for N seconds, or a manual "end session" button)

**Test before moving on:**
- [ ] Timeline updates live and accurately reflects mood history
- [ ] Activity Panel shows each agent's step in real time, matching backend logs
- [ ] Session Summary generates correctly and matches the actual session that occurred
- [ ] Full end-to-end test: start session → make several deliberate expressions → confirm Governor/LLM react appropriately → end session → confirm summary is accurate
- [ ] Append final notes + known limitations to `context.txt`

---

## Phase 6 — Demo Polish & Rehearsal
**Goal:** De-risk the live demo itself.

**Tasks:**
- Test in actual demo lighting conditions (DeepFace is lighting-sensitive)
- Prepare a fallback script of expressions to make on demand (don't rely on judges to spontaneously emote well)
- Time a full demo run start to finish
- Write a short one-paragraph pitch: "Reflectra — not just detecting emotion, but a multi-agent system that tracks patterns over time and decides when/how to respond"

**Test before moving on:**
- [ ] Full run-through completed without crashes
- [ ] Confirmed working on the actual demo machine/network (not just dev machine)
- [ ] `context.txt` has a final summary entry covering the whole build

---

## Notes for the AI coding agent
- Do not skip the testing checklist in any phase — each unchecked box blocks moving to the next phase.
- Do not add agents beyond the 5 defined (Vision, Emotional State, Context/Memory, Reaction Governor, LLM Response) unless explicitly instructed.
- Always update `context.txt` at the end of a phase, even if the session is being cut short mid-phase — log partial progress.
- If blocked (e.g. WSL webcam issues), log the blocker in `context.txt` with what was tried, so the next session doesn't repeat failed attempts.
