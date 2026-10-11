@echo off
setlocal
cd /d "%~dp0"
set "REPO=LonzilFox/lonzilfox.github.io"
where git >nul 2>&1 || (echo ERROR: Git is not installed.& pause & exit /b 1)
where gh >nul 2>&1 || (echo ERROR: GitHub CLI [gh] is not installed.& pause & exit /b 1)
gh auth status >nul 2>&1 || (echo ERROR: Run gh auth login before publishing.& pause & exit /b 1)
if not exist .git (git init || exit /b 1)
git branch -M main || exit /b 1
git add . || exit /b 1
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Update LonzilFox Pages website" || (echo ERROR: Git commit failed. Configure git user.name / user.email.& pause & exit /b 1)
)
gh repo view "%REPO%" >nul 2>&1
if errorlevel 1 (
  gh repo create "%REPO%" --public --source "." --remote origin || (echo ERROR: Could not create repository.& pause & exit /b 1)
)
git remote get-url origin >nul 2>&1
if errorlevel 1 git remote add origin "https://github.com/%REPO%.git"
echo Publishing to %REPO% ...
git push -u origin main
if errorlevel 1 (echo ERROR: Push rejected. Existing remote content was not overwritten. Resolve Git history / authentication manually.& pause & exit /b 1)
echo.
echo NEXT: Open GitHub repository Settings ^> Pages ^> Deploy from a branch ^> main ^> / (root)
echo Website: https://lonzilfox.github.io/
pause
