#!/bin/bash

# Email Setup Script for Concierge.js
# This script helps you configure real email integration

echo "📧 Email Setup for Concierge.js"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env.local
    else
        touch .env.local
    fi
fi

echo "Choose your email service:"
echo "1) Gmail (Recommended for development)"
echo "2) SendGrid (Recommended for production)"
echo "3) Outlook/Hotmail"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📧 Gmail Setup"
        echo "=============="
        echo ""
        echo "Step 1: Enable 2-Factor Authentication"
        echo "  - Go to: https://myaccount.google.com/"
        echo "  - Security → 2-Step Verification"
        echo "  - Enable 2FA if not already enabled"
        echo ""
        echo "Step 2: Generate App Password"
        echo "  - Go to: https://myaccount.google.com/apppasswords"
        echo "  - Or: Security → 2-Step Verification → App passwords"
        echo "  - Select 'Mail' and 'Other (Custom name)'"
        echo "  - Name it 'Concierge App'"
        echo "  - Copy the 16-character password"
        echo ""
        read -p "Enter your Gmail address: " email
        read -p "Enter your 16-character App Password (spaces will be removed automatically): " password
        
        # Remove spaces from password (Google App Passwords are shown with spaces but need to be stored without)
        password=$(echo "$password" | tr -d ' ')
        
        # Update .env.local
        sed -i '' "s|SMTP_HOST=.*|SMTP_HOST=smtp.gmail.com|" .env.local
        sed -i '' "s|SMTP_PORT=.*|SMTP_PORT=587|" .env.local
        sed -i '' "s|SMTP_SECURE=.*|SMTP_SECURE=false|" .env.local
        sed -i '' "s|SMTP_USER=.*|SMTP_USER=$email|" .env.local
        sed -i '' "s|SMTP_PASS=.*|SMTP_PASS=$password|" .env.local
        
        echo ""
        echo "✅ Gmail configuration updated in .env.local"
        ;;
    2)
        echo ""
        echo "📧 SendGrid Setup"
        echo "================="
        echo ""
        echo "Step 1: Sign up at https://sendgrid.com/"
        echo "Step 2: Create API Key"
        echo "  - Settings → API Keys → Create API Key"
        echo "  - Name it 'Concierge Production'"
        echo "  - Copy the API key"
        echo ""
        read -p "Enter your SendGrid API Key: " api_key
        
        # Update .env.local
        sed -i '' "s|SMTP_HOST=.*|SMTP_HOST=smtp.sendgrid.net|" .env.local
        sed -i '' "s|SMTP_PORT=.*|SMTP_PORT=587|" .env.local
        sed -i '' "s|SMTP_SECURE=.*|SMTP_SECURE=false|" .env.local
        sed -i '' "s|SMTP_USER=.*|SMTP_USER=apikey|" .env.local
        sed -i '' "s|SMTP_PASS=.*|SMTP_PASS=$api_key|" .env.local
        
        echo ""
        echo "✅ SendGrid configuration updated in .env.local"
        ;;
    3)
        echo ""
        echo "📧 Outlook/Hotmail Setup"
        echo "========================"
        echo ""
        echo "Step 1: Enable 2-Factor Authentication"
        echo "  - Go to: https://account.microsoft.com/security"
        echo "  - Enable 2FA if not already enabled"
        echo ""
        echo "Step 2: Generate App Password"
        echo "  - Security → Advanced security options"
        echo "  - App passwords → Create new app password"
        echo "  - Copy the password"
        echo ""
        read -p "Enter your Outlook email: " email
        read -p "Enter your App Password: " password
        
        # Update .env.local
        sed -i '' "s|SMTP_HOST=.*|SMTP_HOST=smtp-mail.outlook.com|" .env.local
        sed -i '' "s|SMTP_PORT=.*|SMTP_PORT=587|" .env.local
        sed -i '' "s|SMTP_SECURE=.*|SMTP_SECURE=false|" .env.local
        sed -i '' "s|SMTP_USER=.*|SMTP_USER=$email|" .env.local
        sed -i '' "s|SMTP_PASS=.*|SMTP_PASS=$password|" .env.local
        
        echo ""
        echo "✅ Outlook configuration updated in .env.local"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📝 Configuration Summary:"
echo "=========================="
grep "SMTP_" .env.local | sed 's/PASS=.*/PASS=***/'
echo ""
echo "🧪 Next Steps:"
echo "1. Test email connection: npm run dev"
echo "2. Visit: http://localhost:3000/api/test-email"
echo "3. Or use: curl http://localhost:3000/api/test-email"
echo ""
echo "📚 For Vercel deployment:"
echo "  - Add these same variables in Vercel Dashboard"
echo "  - Settings → Environment Variables"
echo ""

