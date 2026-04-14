@echo off
setlocal EnableDelayedExpansion

:: Switch to script directory (project root)
cd /d "%~dp0"

title Lab System Vue Start Script

:menu
cls
echo ========================================
echo    Lab System Vue Start Script
echo ========================================
echo.
echo [1] npm install   (all sub-projects)
echo [2] npm run build (packages -^> apps)
echo [3] npm run dev   (start apps dev server)
echo [4] One-click     (install -^> build -^> dev)
echo [0] Exit
echo.
set /p choice="Enter option: "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto build
if "%choice%"=="3" goto dev
if "%choice%"=="4" goto onekey
if "%choice%"=="0" exit /b 0

echo Invalid option, please try again.
timeout /t 2 >nul
goto menu

:install
echo.
echo [INFO] Starting npm install for all projects...
echo.

call :install_dir "apps"
if errorlevel 1 goto menu
call :install_dir "packages\control-kit"
if errorlevel 1 goto menu
call :install_dir "packages\device-kit"
if errorlevel 1 goto menu
call :install_dir "packages\quartz-kit"
if errorlevel 1 goto menu

echo.
echo [SUCCESS] All dependencies installed.
echo.
pause
goto menu

:build
echo.
echo [INFO] Starting build...
echo.

call :build_dir "packages\control-kit"
if errorlevel 1 goto menu
call :build_dir "packages\device-kit"
if errorlevel 1 goto menu
call :build_dir "packages\quartz-kit"
if errorlevel 1 goto menu
call :build_dir "apps"
if errorlevel 1 goto menu

echo.
echo [SUCCESS] All projects built.
echo.
pause
goto menu

:dev
echo.
echo [INFO] Starting dev server...
cd /d "%~dp0\apps"
call npm run dev
cd /d "%~dp0"
echo.
echo [INFO] Dev server stopped.
echo.
pause
goto menu

:onekey
echo.
echo ========================================
echo    One-click Start
echo ========================================
echo.
echo [INFO] Installing dependencies...
call :install_dir_quiet "apps"
if errorlevel 1 goto menu
call :install_dir_quiet "packages\control-kit"
if errorlevel 1 goto menu
call :install_dir_quiet "packages\device-kit"
if errorlevel 1 goto menu
call :install_dir_quiet "packages\quartz-kit"
if errorlevel 1 goto menu
echo [SUCCESS] Dependencies installed.

echo.
echo [INFO] Building projects...
call :build_dir_quiet "packages\control-kit"
if errorlevel 1 goto menu
call :build_dir_quiet "packages\device-kit"
if errorlevel 1 goto menu
call :build_dir_quiet "packages\quartz-kit"
if errorlevel 1 goto menu
call :build_dir_quiet "apps"
if errorlevel 1 goto menu
echo [SUCCESS] Projects built.

echo.
echo [INFO] Starting dev server...
cd /d "%~dp0\apps"
call npm run dev
cd /d "%~dp0"
echo.
echo [INFO] One-click process finished.
echo.
pause
goto menu

:: ------------------------------------------------------------------
:: Subroutines
:: ------------------------------------------------------------------
:install_dir
echo [INFO] Installing %~1 ...
cd /d "%~dp0\%~1"
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install %~1 !
    cd /d "%~dp0"
    pause
    exit /b 1
)
echo [OK] %~1 installed.
exit /b 0

:install_dir_quiet
cd /d "%~dp0\%~1"
call npm install >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to install %~1 !
    cd /d "%~dp0"
    pause
    exit /b 1
)
echo [OK] %~1
exit /b 0

:build_dir
echo [INFO] Building %~1 ...
cd /d "%~dp0\%~1"
call npm run build
if errorlevel 1 (
    echo [ERROR] Failed to build %~1 !
    cd /d "%~dp0"
    pause
    exit /b 1
)
echo [OK] %~1 built.
exit /b 0

:build_dir_quiet
cd /d "%~dp0\%~1"
call npm run build >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to build %~1 !
    cd /d "%~dp0"
    pause
    exit /b 1
)
echo [OK] %~1
exit /b 0
