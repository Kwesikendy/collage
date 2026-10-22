Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('attached_assets/Printess_1792679846627.zip')
$targets = @(
    'Printess/printflow/src/components/layout/Sidebar.tsx',
    'Printess/printflow/src/components/ui/StatCard.tsx',
    'Printess/printflow/src/components/ui/Card.tsx'
)

$outDir = 'scripts/extracted_ref'
foreach ($entry in $zip.Entries) {
    if ($entry.FullName -like 'Printess/printflow/src/components/layout/*' -or $entry.FullName -like 'Printess/printflow/src/components/ui/*') {
        $dest = Join-Path $outDir (Split-Path $entry.FullName -Leaf)
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
        Write-Output "Extracted: $($entry.FullName)"
    }
}
$zip.Dispose()
