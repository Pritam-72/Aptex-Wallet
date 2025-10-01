$filePath = "d:\Web 3\Web3_projects\Aptos RiseIn\frontend\src\utils\contractUtils.ts"
$content = Get-Content $filePath -Raw

# Replace error: any with error
$content = $content -replace '} catch \(error: any\) {', '} catch (error) {'

# Replace error.message || with instanceof check - register functions
$content = $content -replace 'error\.message \|\| "Failed to pay request"', 'error instanceof Error ? error.message : "Failed to pay request"'
$content = $content -replace 'error\.message \|\| "Failed to reject request"', 'error instanceof Error ? error.message : "Failed to reject request"'
$content = $content -replace 'error\.message \|\| "Failed to create split bill"', 'error instanceof Error ? error.message : "Failed to create split bill"'
$content = $content -replace 'error\.message \|\| "Failed to create EMI agreement"', 'error instanceof Error ? error.message : "Failed to create EMI agreement"'
$content = $content -replace 'error\.message \|\| "Failed to approve EMI auto-pay"', 'error instanceof Error ? error.message : "Failed to approve EMI auto-pay"'
$content = $content -replace 'error\.message \|\| "Failed to add EMI funds"', 'error instanceof Error ? error.message : "Failed to add EMI funds"'
$content = $content -replace 'error\.message \|\| "Failed to collect EMI payment"', 'error instanceof Error ? error.message : "Failed to collect EMI payment"'
$content = $content -replace 'error\.message \|\| "Failed to create coupon template"', 'error instanceof Error ? error.message : "Failed to create coupon template"'
$content = $content -replace 'error\.message \|\| "Failed to deactivate coupon template"', 'error instanceof Error ? error.message : "Failed to deactivate coupon template"'
$content = $content -replace 'error\.message \|\| "Failed to mint coupon NFT"', 'error instanceof Error ? error.message : "Failed to mint coupon NFT"'

# Replace as any with Record<string, unknown>
$content = $content -replace 'const option = result\[0\] as any;', 'const option = result[0] as Record<string, unknown>;'

Set-Content $filePath -Value $content -NoNewline
Write-Host "File fixed successfully!"
