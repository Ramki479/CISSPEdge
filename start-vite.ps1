$ErrorActionPreference = "Continue"
$logFile = Join-Path "C:\Users\Admin-LFI\freebuff" "vite-start.log"
$errFile = Join-Path "C:\Users\Admin-LFI\freebuff" "vite-start.err"

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "C:\Program Files\nodejs\npx.cmd"
$psi.Arguments = "vite --host"
$psi.WorkingDirectory = "C:\Users\Admin-LFI\freebuff"
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$p = [System.Diagnostics.Process]::Start($psi)
Start-Sleep -Seconds 12

$out = $p.StandardOutput.ReadToEnd()
$err = $p.StandardError.ReadToEnd()
$out > $logFile
$err > $errFile

if ($out -match "http://localhost") {
    $matches[0]
} elseif ($err -match "http://localhost") {
    $matches[0]
} else {
    "OUT: " + ($out -replace "`n"," | ")
    "ERR: " + ($err -replace "`n"," | ")
}
