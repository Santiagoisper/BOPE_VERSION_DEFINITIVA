# BOPE - Equipamiento Ronda 2
# Ejecutar desde PowerShell:
#   cd C:\Users\Santiago\source\repos\Santiagoisper\BOPE_VERSION_DEFINITIVA
#   .\scripts\equipar-ronda2.ps1

$ErrorActionPreference = "Continue"
$CLAUDE_SKILLS = "C:\Users\Santiago\.claude\skills"
$CLAUDE_RULES  = "C:\Users\Santiago\.claude\rules"
$TMP = "$env:TEMP\bope-ronda2"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  BOPE - EQUIPAMIENTO RONDA 2" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

New-Item -ItemType Directory -Force -Path $TMP           | Out-Null
New-Item -ItemType Directory -Force -Path $CLAUDE_SKILLS | Out-Null
New-Item -ItemType Directory -Force -Path $CLAUDE_RULES  | Out-Null

# --- 1. ECC ---
Write-Host "[1/5] ECC (202k stars) - clonando..." -ForegroundColor Yellow
$ECC_DIR = "$TMP\ECC"
if (Test-Path $ECC_DIR) { Remove-Item -Recurse -Force $ECC_DIR }
git clone --depth 1 https://github.com/affaan-m/ECC.git $ECC_DIR

if (Test-Path $ECC_DIR) {
    $rulesTarget = "$CLAUDE_RULES\ecc"
    New-Item -ItemType Directory -Force -Path $rulesTarget | Out-Null
    if (Test-Path "$ECC_DIR\rules\common")     { Copy-Item -Recurse -Force "$ECC_DIR\rules\common"     $rulesTarget }
    if (Test-Path "$ECC_DIR\rules\typescript") { Copy-Item -Recurse -Force "$ECC_DIR\rules\typescript" $rulesTarget }
    $eccSkillsTarget = "$CLAUDE_SKILLS\ecc"
    New-Item -ItemType Directory -Force -Path $eccSkillsTarget | Out-Null
    if (Test-Path "$ECC_DIR\skills") { Copy-Item -Recurse -Force "$ECC_DIR\skills\*" $eccSkillsTarget }
    Write-Host "  [OK] ECC instalado" -ForegroundColor Green
} else {
    Write-Host "  [FALLO] ECC - clon fallido" -ForegroundColor Red
}

Write-Host ""

# --- 2. Understand-Anything ---
Write-Host "[2/5] Understand-Anything (48k stars) - clonando..." -ForegroundColor Yellow
$UA_DIR = "$TMP\understand-anything"
if (Test-Path $UA_DIR) { Remove-Item -Recurse -Force $UA_DIR }
git clone --depth 1 https://github.com/Lum1104/Understand-Anything.git $UA_DIR

if (Test-Path $UA_DIR) {
    $uaTarget = "$CLAUDE_SKILLS\understand-anything"
    New-Item -ItemType Directory -Force -Path $uaTarget | Out-Null
    if (Test-Path "$UA_DIR\understand-anything-plugin") {
        Copy-Item -Recurse -Force "$UA_DIR\understand-anything-plugin\*" $uaTarget
    }
    Write-Host "  [OK] Understand-Anything instalado" -ForegroundColor Green
} else {
    Write-Host "  [FALLO] Understand-Anything - clon fallido" -ForegroundColor Red
}

Write-Host ""

# --- 3. taste-skill ---
Write-Host "[3/5] taste-skill (31k stars) - clonando..." -ForegroundColor Yellow
$TASTE_DIR = "$TMP\taste-skill"
if (Test-Path $TASTE_DIR) { Remove-Item -Recurse -Force $TASTE_DIR }
git clone --depth 1 https://github.com/Leonxlnx/taste-skill.git $TASTE_DIR

if (Test-Path $TASTE_DIR) {
    $skillsToInstall = @("taste-skill", "redesign-skill", "soft-skill", "minimalist-skill", "brutalist-skill", "output-skill")
    foreach ($skill in $skillsToInstall) {
        $src = "$TASTE_DIR\skills\$skill"
        if (Test-Path $src) {
            Copy-Item -Recurse -Force $src "$CLAUDE_SKILLS\$skill"
            Write-Host "    Copiado: $skill" -ForegroundColor Gray
        }
    }
    Write-Host "  [OK] taste-skill instalado" -ForegroundColor Green
} else {
    Write-Host "  [FALLO] taste-skill - clon fallido" -ForegroundColor Red
}

Write-Host ""

# --- 4. Cybersecurity Skills (CERBERUS) ---
Write-Host "[4/5] Cybersecurity Skills (754 skills) - clonando..." -ForegroundColor Yellow
$CYBERSEC_DIR = "$TMP\cybersec-skills"
if (Test-Path $CYBERSEC_DIR) { Remove-Item -Recurse -Force $CYBERSEC_DIR }
git clone --depth 1 https://github.com/mukul975/Anthropic-Cybersecurity-Skills.git $CYBERSEC_DIR

if (Test-Path $CYBERSEC_DIR) {
    $secTarget = "$CLAUDE_SKILLS\cerberus-security"
    New-Item -ItemType Directory -Force -Path $secTarget | Out-Null
    $domains = @("web-application-security", "api-security", "devsecops", "cloud-security", "incident-response", "vulnerability-management")
    if (Test-Path "$CYBERSEC_DIR\skills") {
        Get-ChildItem "$CYBERSEC_DIR\skills" -Directory | ForEach-Object {
            $skillDir = $_
            foreach ($domain in $domains) {
                if ($skillDir.Name -like "*$domain*") {
                    Copy-Item -Recurse -Force $skillDir.FullName $secTarget
                    Write-Host "    Copiado: $($skillDir.Name)" -ForegroundColor Gray
                    break
                }
            }
        }
    }
    Write-Host "  [OK] Cybersecurity Skills instalado" -ForegroundColor Green
} else {
    Write-Host "  [FALLO] Cybersecurity Skills - clon fallido" -ForegroundColor Red
}

Write-Host ""

# --- 5. knowledge-work-plugins (Anthropic) ---
Write-Host "[5/5] knowledge-work-plugins - clonando..." -ForegroundColor Yellow
$KWP_DIR = "$TMP\kwp"
if (Test-Path $KWP_DIR) { Remove-Item -Recurse -Force $KWP_DIR }
git clone --depth 1 https://github.com/anthropics/knowledge-work-plugins.git $KWP_DIR

if (Test-Path $KWP_DIR) {
    $kwpTarget = "$CLAUDE_SKILLS\kwp"
    New-Item -ItemType Directory -Force -Path $kwpTarget | Out-Null
    $relevantPlugins = @("engineering", "data", "productivity", "product-management")
    foreach ($plugin in $relevantPlugins) {
        $src = "$KWP_DIR\$plugin"
        if (Test-Path $src) {
            Copy-Item -Recurse -Force $src "$kwpTarget\$plugin"
            Write-Host "    Plugin: $plugin" -ForegroundColor Gray
        }
    }
    Write-Host "  [OK] knowledge-work-plugins instalado" -ForegroundColor Green
} else {
    Write-Host "  [FALLO] knowledge-work-plugins - clon fallido" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  DONE. Avisale a JOHN en Claude Code." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Skills disponibles:" -ForegroundColor White
Get-ChildItem $CLAUDE_SKILLS -Directory | ForEach-Object { Write-Host "  $($_.Name)" }
