@echo off
REM Sadad Payment Gateway Deployment Script for Windows
REM This script deploys the Sadad edge functions

echo =========================================
echo Sadad Payment Gateway Deployment
echo =========================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Supabase CLI is not installed
    echo Install it with: npm install -g supabase
    pause
    exit /b 1
)

echo Deploying Sadad Edge Functions...
echo -----------------------------------
echo.

REM Deploy initiate payment function
echo Deploying sadad-initiate-product-payment...
call supabase functions deploy sadad-initiate-product-payment
if %errorlevel% neq 0 (
    echo Failed to deploy sadad-initiate-product-payment
    pause
    exit /b 1
)

echo.
echo Deploying sadad-product-callback...
call supabase functions deploy sadad-product-callback
if %errorlevel% neq 0 (
    echo Failed to deploy sadad-product-callback
    pause
    exit /b 1
)

echo.
echo -----------------------------------
echo Edge functions deployed successfully!
echo.

echo =========================================
echo Deployment Complete!
echo =========================================
echo.
echo Next Steps:
echo.
echo 1. Set environment variables in Supabase dashboard:
echo    Go to: https://supabase.com/dashboard
echo    Navigate to: Edge Functions -^> Settings
echo.
echo    Required variables:
echo    - SADAD_MERCHANT_ID=8432581
echo    - SADAD_SECRET_KEY=/kGgsUIY4HOavH6w
echo    - SADAD_TEST_MODE=false
echo    - SADAD_WEBSITE_DOMAIN=radiant-matches-app.vercel.app
echo    - SADAD_SKIP_IP_VERIFICATION=true
echo.
echo 2. Configure callback URL in Sadad portal:
echo    https://besjfzlgtssriqpluzgn.supabase.co/functions/v1/sadad-product-callback
echo.
echo 3. Test the payment flow
echo.
echo Documentation: See SADAD_INTEGRATION_GUIDE.md for details
echo.
pause
