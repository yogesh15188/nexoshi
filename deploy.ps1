param([int]$Port = 8080)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "[1/4] Building frontend..." -ForegroundColor Cyan
Push-Location "$root\frontend"
npm run build
Pop-Location

Write-Host "[2/4] Stopping dev servers..." -ForegroundColor Cyan
Get-Process -Name python, node -ErrorAction SilentlyContinue | Where-Object {
  $_.Id -ne $PID
} | ForEach-Object {
  $conn = Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 3000, 8001, $Port }
  if ($conn) { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 1

Write-Host "[3/4] Starting production server on :$Port ..." -ForegroundColor Cyan
Start-Process -FilePath python -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$Port" -WorkingDirectory "$root\backend" -WindowStyle Hidden
Start-Sleep -Seconds 6

Write-Host "[4/4] Health check..." -ForegroundColor Cyan
try {
  $api = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/v1/metrics" -TimeoutSec 10
  Write-Host "API OK   -> risk $($api.overall_risk_score)" -ForegroundColor Green
} catch { Write-Host "API FAILED: $($_.Exception.Message)" -ForegroundColor Red }
try {
  $page = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 10
  Write-Host "SPA  OK  -> HTTP $($page.StatusCode)" -ForegroundColor Green
} catch { Write-Host "SPA FAILED: $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`nNEXOSHI deployed: http://localhost:$Port" -ForegroundColor Cyan
Start-Process "http://localhost:$Port/"
