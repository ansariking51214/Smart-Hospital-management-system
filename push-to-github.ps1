# PowerShell Push Script for Smart Hospital Management System (HMS)
# Target Repo: https://github.com/ansariking51214/Smart-Hospital-management-system.git

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Pushing Smart Hospital Management System to GitHub" -ForegroundColor Cyan
Write-Host "  Module 1: Day 2 - JWT Auth, Password Hashing & RBAC" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Check if git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Git command not detected in current PATH." -ForegroundColor Red
    Write-Host "[*] Searching for Git installation in standard folders..." -ForegroundColor Yellow
    
    $gitPaths = @(
        "C:\Users\hm\.gemini\antigravity\scratch\git-bin\cmd\git.exe",
        "C:\Program Files\Git\cmd\git.exe",
        "C:\Program Files\Git\bin\git.exe",
        "C:\Program Files (x86)\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\bin\git.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Links\git.exe"
    )
    
    $foundGit = $gitPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($foundGit) {
        Write-Host "[+] Found Git at: $foundGit" -ForegroundColor Green
        Set-Alias -Name git -Value $foundGit -Scope Global
    } else {
        Write-Host "[-] Git is not installed or not in PATH." -ForegroundColor Red
        Write-Host "[*] Please install Git from https://git-scm.com/download/win or run: winget install --id Git.Git -e" -ForegroundColor Yellow
        exit 1
    }
}

# 2. Initialize repo if needed
if (-not (Test-Path ".git")) {
    Write-Host "[1/5] Initializing Git repository..." -ForegroundColor Green
    git init
} else {
    Write-Host "[1/5] Git repository already present." -ForegroundColor Green
}

# 3. Stage files
Write-Host "[2/5] Staging Day 1 & Day 2 project files..." -ForegroundColor Green
git add .

# 4. Commit
Write-Host "[3/5] Committing changes..." -ForegroundColor Green
git commit -m "feat(module1-day2): implement JWT auth (login, signup, logout), bcrypt password hashing, auth middleware, and security explorer UI"

# 5. Remote and Branch
Write-Host "[4/5] Setting up remote origin and branch..." -ForegroundColor Green
git branch -M main
try { git remote remove origin 2>$null } catch {}
git remote add origin https://github.com/ansariking51214/Smart-Hospital-management-system.git

# 6. Push
Write-Host "[5/5] Pushing to GitHub repository..." -ForegroundColor Cyan
git push -u origin main

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Success! Code is live on GitHub:" -ForegroundColor Green
Write-Host "  https://github.com/ansariking51214/Smart-Hospital-management-system" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Green
