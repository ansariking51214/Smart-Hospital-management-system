@echo off
set "PATH=C:\Users\hm\.gemini\antigravity\scratch\git-bin\cmd;%PATH%"
echo ========================================================
echo   Pushing Smart Hospital Management System to GitHub
echo   Module 3: Day 5 (Diagnostic Test Orders & Prescription PDF Export)
echo   Target: https://github.com/ansariking51214/Smart-Hospital-management-system.git
echo ========================================================

REM 1. Initialize git repository if not already initialized
if not exist ".git" (
    echo [1/5] Initializing Git repository...
    git init
) else (
    echo [1/5] Git repository detected.
)

REM 2. Stage all project files
echo [2/5] Staging Module 3 Day 5 project files...
git add .

REM 3. Create commit
echo [3/5] Committing changes for Module 3 Day 5...
git commit -m "feat(module3-day5): implement diagnostic test orders (lab/radiology), results tracking, prescription pdf export & 360 ehr summary"

REM 4. Set main branch & remote origin
echo [4/5] Setting default branch and remote origin...
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/ansariking51214/Smart-Hospital-management-system.git

REM 5. Push to GitHub
echo [5/5] Pushing to GitHub main and master branches...
git push -u origin main
git push origin main:master --force

echo ========================================================
echo   Push completed successfully!
echo   Repo: https://github.com/ansariking51214/Smart-Hospital-management-system
echo ========================================================
pause
