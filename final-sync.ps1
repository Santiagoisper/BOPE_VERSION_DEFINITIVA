$repo = "C:\Users\Santiago\source\repos\Santiagoisper\BOPE_VERSION_DEFINITIVA"

# Stash cambios sin trackear
git -C $repo stash --include-untracked
Write-Host "STASH OK"

# Pull con rebase
git -C $repo pull --rebase origin main
Write-Host "PULL REBASE OK"

# Restaurar stash
git -C $repo stash pop
Write-Host "STASH POP OK"

# Push
git -C $repo push origin main
Write-Host "PUSH OK"

# Limpiar script
Remove-Item "$repo\sync.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$repo\cleanup.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$repo\push.ps1" -Force -ErrorAction SilentlyContinue
Write-Host "SCRIPTS TEMPORALES ELIMINADOS"
Write-Host "SINCRONIZACION COMPLETA"
