@echo off
echo ========================================================
echo   Pushing Smart Hospital Management System to GitHub
echo   Target: https://github.com/ansariking51214/Smart-Hospital-management-system.git
echo ========================================================

REM 1. Initialize git repository if not already initialized
if not exist ".git" (
    echo [1/5] Initializing Git repository...
    git init
) else (
    echo [1/5] Git repository already initialized.
)

REM 2. Stage all project files
echo [2/5] Staging Day 1 project files...
git add .

REM 3. Create commit
echo [3/5] Committing changes for Day 1...
git commit -m "feat(module1-day1): complete database schema design, RBAC models, MRN generation, seed data fixtures, and full stack HMS dashboard"

REM 4. Set main branch & remote origin
    echo [4/5] Setting default branch and remote origin...
    git branch -M main
    git remote remove origin 2>nul
    git remote add origin https://github.com/ansariking51214/Smart-Hospital-management-system.git
    
    REM 5. Push to GitHub
    echo [5/5] Pushing to GitHub main branch...
    git push -u origin main

echo ========================================================
echo   Push completed successfully!
echo ========================================================
pause
