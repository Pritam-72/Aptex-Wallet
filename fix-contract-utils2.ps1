$filePath = "d:\Web 3\Web3_projects\Aptos RiseIn\frontend\src\utils\contractUtils.ts"
$content = Get-Content $filePath -Raw

# Replace option.vec checks with proper type narrowing
$content = $content -replace 'if \(option\.vec && option\.vec\.length', 'if (option.vec && Array.isArray(option.vec) && option.vec.length'

Set-Content $filePath -Value $content -NoNewline
Write-Host "File fixed successfully!"
