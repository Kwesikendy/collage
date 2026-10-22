Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('attached_assets/Printess_1792679846627.zip')
$targets = @(
    'Printess/printflow/package.json',
    'Printess/printflow/tailwind.config.ts',
    'Printess/printflow/tailwind.config.js',
    'Printess/printflow/src/app/globals.css',
    'Printess/printflow/src/app/dashboard/layout.tsx',
    'Printess/printflow/src/app/dashboard/page.tsx',
    'Printess/printflow/src/app/dashboard/admin/page.tsx'
)

$outDir = 'scripts/extracted_ref'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

foreach ($entry in $zip.Entries) {
    if ($targets -contains $entry.FullName) {
        $dest = Join-Path $outDir (Split-Path $entry.FullName -Leaf)
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
        Write-Output "Extracted: $($entry.FullName) -> $dest"
    }
}
$zip.Dispose()
