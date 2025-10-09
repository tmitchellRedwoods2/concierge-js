# Alpha Vantage Setup Guide

## 🚀 Quick Setup (5 minutes)

### **1. Get Your Free API Key**

1. **Visit**: https://www.alphavantage.co/support/#api-key
2. **Fill out the form** (name, email, organization)
3. **Copy your API key** (looks like: `ABC123XYZ456`)

### **2. Add to Vercel**

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (`concierge-js`)
3. **Click "Settings" → "Environment Variables"**
4. **Add new variable**:
   - **Name**: `ALPHA_VANTAGE_API_KEY`
   - **Value**: [Your API key from step 1]
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
5. **Click "Save"**

### **3. Redeploy**

The code changes will automatically deploy via GitHub Actions.

Once deployed (~2 minutes), your portfolio will show **real-time stock prices**! 🎉

---

## 📊 What You Get (Free Tier)

- ✅ **25 API calls per day**
- ✅ **Real-time stock quotes**
- ✅ **Historical data** (20+ years)
- ✅ **Stock search**
- ✅ **No credit card required**

### **Rate Limits**:
- **5 API calls per minute**
- **25 API calls per day**

### **Caching**:
- Quotes are cached for **1 minute**
- This helps stay within rate limits
- Fallback prices kick in if limit exceeded

---

## 🔧 Features Now Working

### **1. Real-Time Quotes**
```
AAPL: $175.43 (+1.25%)
MSFT: $329.87 (-0.43%)
```

### **2. Stock Search**
```
Search: "apple"
Results:
- AAPL: Apple Inc.
- APLE: Apple Hospitality REIT Inc.
```

### **3. Historical Data**
```
Chart showing price trends over:
- 1 day, 5 days, 1 month, 3 months, 6 months
- 1 year, 2 years, 5 years, 10 years, max
```

### **4. Portfolio Tracking**
```
Total Value: $8,752.50
Total Gain/Loss: +$1,250.00 (+16.67%)
```

---

## 🎯 Fallback System

If Alpha Vantage is unavailable or rate limited:
1. **Uses cached prices** (if < 1 minute old)
2. **Uses fallback prices** for common stocks
3. **Shows last known price** with timestamp

---

## 💡 Upgrade Later (Optional)

If you need more API calls:

### **Premium Plans**:
- **$49.99/month**: 120 calls/min, 100k/day
- **$149.99/month**: 600 calls/min, 500k/day
- **$499.99/month**: 1200 calls/min, unlimited

**For now, the free tier is perfect for personal use!**

---

## ✅ Next Steps

1. **Get API key**: https://www.alphavantage.co/support/#api-key
2. **Add to Vercel** environment variables
3. **Wait for deployment** (~2 minutes)
4. **Refresh Investments page** - prices will load!

**Need help? Let me know!** 🚀

