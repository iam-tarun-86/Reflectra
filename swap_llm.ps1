# Reflectra — Single-slot LLM swap (P7.6)
# Usage:  .\swap_llm.ps1 qwen   |   .\swap_llm.ps1 gemma
# EDIT these two paths to match your WSL2 filesystem:
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('qwen','gemma')]
    [string]$Model
)

$WSLDistroname = "Ubuntu"   # change if your distro differs
$GGUF = @{
    qwen  = "/home/YOURUSER/models/Qwen3.5-4B-Q4_K_M.gguf"      # EDIT ME
    gemma = "/home/YOURUSER/models/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q5_K_P.gguf"  # EDIT ME
}
$PORT = 8085
$CTX = 4096

if (-not $GGUF.ContainsKey($Model)) { Write-Error "unknown model"; exit 1 }

Write-Host "[SWAP] Stopping existing llama-server in WSL2..."
wsl -d $WSLDistroname -- bash -lc "pkill -f 'llama.*server' || true; sleep 1"

Write-Host "[SWAP] Launching $($Model) on port $PORT ..."
# nohup so it survives this PowerShell session; log to ~/llama-server.log
wsl -d $WSLDistroname -- bash -lc "nohup llama-server -m $($GGUF[$Model]) --host 0.0.0.0 --port $PORT --ctx-size $CTX -ngl 99 > ~/llama-server.log 2>&1 & sleep 2; echo launched"

Write-Host "[SWAP] Waiting for endpoint http://localhost:$PORT ..."
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$PORT/v1/models" -TimeoutSec 2 -UseBasicParsing
        if ($r.StatusCode -eq 200) {
            Write-Host "[OK] $($Model) is up: $($r.Content.Substring(0, [Math]::Min(120, $r.Content.Length)))"
            Write-Host "[NEXT] Run:  .venv\Scripts\python.exe backend\bench_llm.py"
            exit 0
        }
    } catch { Start-Sleep -Milliseconds 800 }
}
Write-Host "[FAIL] Endpoint did not come up within 60s. Check WSL2: tail ~/llama-server.log"
exit 1
