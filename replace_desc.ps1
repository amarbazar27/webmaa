$sourceFile = 'd:\webmaa\src\app\shop\[shopSlug]\ShopClient.jsx'
$newContentFile = 'd:\webmaa\_new_desc_box.jsx'

$lines = [System.IO.File]::ReadAllLines($sourceFile, [System.Text.Encoding]::UTF8)
$newContent = [System.IO.File]::ReadAllLines($newContentFile, [System.Text.Encoding]::UTF8)

# Lines 1457-1489 are 0-indexed 1456-1488
$before = $lines[0..1455]
$after = $lines[1489..($lines.Count - 1)]

$result = $before + $newContent + $after

[System.IO.File]::WriteAllLines($sourceFile, $result, (New-Object System.Text.UTF8Encoding $true))
Write-Host "Done! Replaced lines 1457-1489. New total: $($result.Count) lines"
