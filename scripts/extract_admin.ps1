Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('attached_assets/Printess_1792679846627.zip')
$adminPage = $zip.Entries | Where-Object { $_.FullName -eq 'Printess/printflow/src/app/dashboard/admin/page.tsx' }
if ($adminPage) {
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($adminPage, 'scripts/extracted_ref/admin_dashboard.tsx', $true)
    Write-Output "Extracted admin page"
}
$zip.Dispose()
