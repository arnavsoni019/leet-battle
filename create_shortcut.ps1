$ws = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "LeetCode Battle.lnk"
$sc = $ws.CreateShortcut($shortcutPath)
$sc.TargetPath = "a:\Python\leetcode-compare\start.bat"
$sc.WorkingDirectory = "a:\Python\leetcode-compare"
$sc.Description = "Launch LeetCode Battle Dashboard"
$sc.Save()
Write-Host "Shortcut created at: $shortcutPath"
