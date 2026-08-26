"""
Reflectra — LLM latency benchmark (P7.6 gate)
Run AFTER the model you intend to demo with is loaded on :8085.

Acceptance: p95 < 2000ms for 30-word reflections.
Usage: .venv\\Scripts\\python.exe backend\\bench_llm.py [N]
"""
import asyncio
import statistics
import sys
import time

import httpx

URL = "http://localhost:8085/v1/chat/completions"
MODEL = "gemma-4-e4b"  # llama.cpp serves whatever is loaded; name mostly informational

PROMPTS = [
    "Pattern shifted neutral to happy, sustained 2.0s.",
    "Pattern shifted happy to sad, sustained 1.8s.",
    "Strong surprise burst detected, stability 0.9.",
    "Sustained angry pattern for 3.5 seconds.",
    "Shift from sad back to neutral over 2.2 seconds.",
    "Fear spike observed then settled to neutral.",
    "Disgust flash followed by steady neutral 4s.",
    "Happy rising trend across last 10 seconds.",
    "Falling trend from surprise to neutral in 3s.",
    "Neutral baseline held for the entire session.",
]


async def one(client: httpx.AsyncClient, prompt: str) -> tuple[float, str]:
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": (
                "/no_think You are Reflectra, an adaptive AI mirror. You observe "
                "facial-expression patterns, not internal feelings. Output only final "
                "response, no reasoning. 1-2 short sentences, warm, under 30 words."
            )},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 120,
        "temperature": 0.7,
        "chat_template_kwargs": {"enable_thinking": False},
    }
    start = time.monotonic()
    resp = await client.post(URL, json=payload)
    if resp.status_code == 400:
        payload.pop("chat_template_kwargs")
        resp = await client.post(URL, json=payload)
    resp.raise_for_status()
    msg = resp.json()["choices"][0]["message"]
    text = (msg.get("content") or "").strip()
    return (time.monotonic() - start) * 1000, text[:70]


async def main(n: int):
    prompts = (PROMPTS * ((n // len(PROMPTS)) + 1))[:n]
    async with httpx.AsyncClient(timeout=25) as client:
        latencies = []
        for i, p in enumerate(prompts, 1):
            try:
                ms, text = await one(client, p)
                latencies.append(ms)
                print(f"{i:02d}  {ms:7.0f}ms  {text}")
            except Exception as e:
                print(f"{i:02d}  FAILED: {type(e).__name__}: {e}")
    if not latencies:
        print("ALL FAILED")
        sys.exit(1)
    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[max(0, int(len(latencies) * 0.95) - 1)]
    print(f"\nn={len(latencies)}  p50={p50:.0f}ms  p95={p95:.0f}ms")
    print("GATE:", "PASS (<2000ms)" if p95 < 2000 else "FAIL — check GPU offload / swap model")


if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    asyncio.run(main(count))
