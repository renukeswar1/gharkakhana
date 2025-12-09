@echo off
REM GharKaKhana AWS Deployment Script
REM Prerequisites: AWS CLI, SAM CLI, Node.js

echo ========================================
echo   GharKaKhana AWS Deployment
echo ========================================
echo.

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: AWS CLI is not installed. Please install it from:
    echo https://aws.amazon.com/cli/
    exit /b 1
)

REM Check if SAM CLI is installed
where sam >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: SAM CLI is not installed. Please install it from:
    echo https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
    exit /b 1
)

REM Check AWS credentials
aws sts get-caller-identity >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: AWS credentials not configured. Run: aws configure
    exit /b 1
)

echo [1/4] Building TypeScript...
cd packages\api
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: TypeScript build failed
    exit /b 1
)
cd ..\..

echo.
echo [2/4] Building SAM application...
call sam build
if %ERRORLEVEL% neq 0 (
    echo ERROR: SAM build failed
    exit /b 1
)

echo.
echo [3/4] Deploying to AWS...
call sam deploy --guided
if %ERRORLEVEL% neq 0 (
    echo ERROR: SAM deploy failed
    exit /b 1
)

echo.
echo [4/4] Getting API URL...
call sam list stack-outputs --stack-name gharkakhana-dev

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy the ApiUrl from the output above
echo 2. Update NEXT_PUBLIC_API_URL in apps/web/.env.local
echo 3. Rebuild and deploy the frontend
echo.
