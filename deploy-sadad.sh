#!/bin/bash

# Sadad Payment Gateway Deployment Script
# This script deploys the Sadad edge functions and sets up environment variables

set -e

echo "========================================="
echo "Sadad Payment Gateway Deployment"
echo "========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if user is logged in
echo "Checking Supabase authentication..."
supabase projects list &> /dev/null || {
    echo "Please login to Supabase first:"
    echo "  supabase login"
    exit 1
}

echo ""
echo "Deploying Sadad Edge Functions..."
echo "-----------------------------------"

# Deploy initiate payment function
echo "Deploying sadad-initiate-product-payment..."
supabase functions deploy sadad-initiate-product-payment

# Deploy callback function
echo "Deploying sadad-product-callback..."
supabase functions deploy sadad-product-callback

echo ""
echo "-----------------------------------"
echo "Edge functions deployed successfully!"
echo ""

# Check environment variables
echo ""
echo "Checking environment variables..."
echo "-----------------------------------"

# Function to check if env var exists
check_env_var() {
    local var_name=$1
    local var_value=${!var_name}

    if [ -z "$var_value" ]; then
        echo "⚠️  $var_name is not set"
        return 1
    else
        # Show masked value for sensitive data
        if [[ $var_name == *"SECRET"* ]] || [[ $var_name == *"KEY"* ]]; then
            echo "✓ $var_name: *** (set)"
        else
            echo "✓ $var_name: $var_value"
        fi
        return 0
    fi
}

# Check required environment variables
echo ""
echo "Required Environment Variables:"
echo ""

# From .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)

    check_env_var "VITE_SADAD_MERCHANT_ID" || true
    check_env_var "VITE_SADAD_SECRET_KEY" || true
    check_env_var "VITE_SADAD_TEST_MODE" || true
    check_env_var "VITE_SADAD_WEBSITE_DOMAIN" || true

    echo ""
    echo "⚠️  IMPORTANT: Make sure these environment variables are also set in your Supabase dashboard:"
    echo ""
    echo "   Go to: https://supabase.com/dashboard"
    echo "   Navigate to: Edge Functions → Settings"
    echo ""
    echo "   Required variables:"
    echo "   - SADAD_MERCHANT_ID=8432581"
    echo "   - SADAD_SECRET_KEY=/kGgsUIY4HOavH6w"
    echo "   - SADAD_TEST_MODE=false"
    echo "   - SADAD_WEBSITE_DOMAIN=radiant-matches-app.vercel.app"
    echo "   - SADAD_SKIP_IP_VERIFICATION=true"
    echo ""
else
    echo "⚠️  .env.local file not found"
    echo "Please create .env.local with the required variables"
fi

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Set environment variables in Supabase dashboard (if not already set)"
echo "2. Configure callback URL in Sadad portal:"
echo "   https://besjfzlgtssriqpluzgn.supabase.co/functions/v1/sadad-product-callback"
echo "3. Test the payment flow:"
echo "   - Add a product to cart"
echo "   - Go to checkout"
echo "   - Select 'Pay with Sadad'"
echo "   - Complete payment"
echo "4. Check logs: supabase functions logs sadad-product-callback"
echo ""
echo "Documentation: See SADAD_INTEGRATION_GUIDE.md for details"
echo ""
