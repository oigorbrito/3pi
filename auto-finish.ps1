$sourceDirs = @(
    'C:\Users\igorb\.gemini\antigravity-cli\brain\c926dd99-4a75-4c2e-a770-d21014125a4a\scratch\',
    'C:\Users\igorb\.gemini\antigravity-cli\brain\ea7b77c1-1151-483f-9f9a-d51e6577f938\scratch\',
    'C:\Users\igorb\.gemini\antigravity-cli\brain\95ccf217-3009-493b-8f6d-c3d5836a30fc\scratch\',
    'C:\Users\igorb\.gemini\antigravity-cli\brain\ad176201-d435-4ba9-843e-7e863fde9362\scratch\',
    'C:\Users\igorb\.gemini\antigravity-cli\brain\98fbea87-dd17-4cf2-8b4d-2d7acc1dbb4e\scratch\'
)

foreach ($dir in $sourceDirs) {
    if (Test-Path $dir) {
        $files = Get-ChildItem -Path $dir -File
        foreach ($file in $files) {
            $destPath = $file.Name.Replace('_3pi', '.3pi').Replace('_', '\')
            $fullDest = Join-Path 'D:\projetos\3pi\pi-main' $destPath
            
            Write-Host "Copying $($file.Name) to $fullDest"
            Copy-Item -Path $file.FullName -Destination $fullDest -Force
        }
    }
}

cd D:\projetos\3pi\pi-main
git add .
git commit -m "docs: translate remaining READMEs, examples, and prompts to pt-BR"
git push origin main-v2
