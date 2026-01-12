@echo off
echo ===============================
echo GIT RESET + PUSH SCRIPT
echo ===============================

REM Proje dizinine gir
cd /d "%~dp0"

echo [1/6] Mevcut remote siliniyor...
git remote remove origin 2>nul

echo [2/6] Remote ekleniyor...
git remote add origin https://github.com/ordusevgidentdis-sudo/sevgidentdis.git

echo [3/6] Branch main yapiliyor...
git branch -M main

echo [4/6] Dosyalar ekleniyor...
git add .

echo [5/6] Commit atiliyor...
git commit -m "auto commit" 2>nul

echo [6/6] Push deneniyor...
git push -u origin main

echo.
echo ===============================
echo ISLEM BITTI
echo ===============================
pause
