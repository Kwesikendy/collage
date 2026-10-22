Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('attached_assets/Printess_1792679846627.zip')
$entries = $zip.Entries | Where-Object { $_.FullName -like 'Printess/printflow/src/*' -and -not $_.FullName.EndsWith('/') }
$entries | Select-Object -First 50 | ForEach-Object { $_.FullName }
$zip.Dispose()
