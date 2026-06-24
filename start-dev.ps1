$ErrorActionPreference = "SilentlyContinue"
$proc = Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "vite --host" -RedirectStandardOutput "vite-out.log" -RedirectStandardError "vite-err.log" -PassThru
Start-Sleep -Seconds 8
Write-Host "Started vite with PID: $($proc.Id)"
$url = "http://localhost:5173"
try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
    Write-Host "Vite is running at $url - Status: $($r.StatusCode)"
} catch {
    Write-Host "Checking vite-out.log..."
    Get-Content "vite-out.log" -Tail 10
    Write-Host "Checking vite-err.log..."
    Get-Content "vite-err.log" -Tail 10
}
