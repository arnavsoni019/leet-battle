$ws = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "LeetBattle.lnk"
$sc = $ws.CreateShortcut($shortcutPath)
$sc.TargetPath = "a:\Python\leetbattle\start.bat"
$sc.WorkingDirectory = "a:\Python\leetbattle"
$sc.Description = "Launch LeetBattle Dashboard"
$sc.Save()
Write-Host "Shortcut created at: $shortcutPath"
