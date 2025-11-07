#!/bin/bash

# Quick script to update just the SMTP password in .env.local

if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

echo "📧 Update Gmail App Password"
echo "============================"
echo ""
read -p "Enter your 16-character App Password (spaces will be removed automatically): " password

# Remove spaces from password (Google App Passwords are shown with spaces but need to be stored without)
password=$(echo "$password" | tr -d ' ')

# Update SMTP_PASS in .env.local
sed -i '' "s|SMTP_PASS=.*|SMTP_PASS=$password|" .env.local

echo ""
echo "✅ App Password updated in .env.local"
echo ""
echo "📝 Current SMTP configuration:"
grep "SMTP_" .env.local | sed 's/PASS=.*/PASS=***/'
echo ""
echo "🔄 Restart your dev server for changes to take effect:"
echo "   npm run dev"

