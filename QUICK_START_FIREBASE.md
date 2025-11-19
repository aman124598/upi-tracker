# 🚀 Quick Start - Firebase Sync

## What Just Happened?

I've added **complete cloud sync** to your UPI Tracker! Your transactions will now automatically sync across all your devices through Firebase Firestore.

## ⚡ Quick Setup (10 minutes)

### Step 1: Create Firebase Project
1. Visit: https://console.firebase.google.com
2. Click "Create a project"
3. Name it: `upi-tracker`
4. Disable Analytics (optional)
5. Click "Create"

### Step 2: Add Android App
1. Click the Android icon (</>) 
2. Enter package name: **`com.upispendtracker`** (exact match required!)
3. Click "Register app"
4. Download `google-services.json`

### Step 3: Replace Config File
1. Find the downloaded `google-services.json`
2. Replace this file: `android/app/google-services.json`
3. Make sure to replace the **entire file** (current one is just a placeholder)

### Step 4: Enable Firestore
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose **"Start in test mode"**
4. Pick location: `asia-south1` (Mumbai) or closest to you
5. Click "Enable"

### Step 5: Rebuild App
```bash
eas build --platform android --profile production-apk
```

Wait 15-20 minutes for build to complete.

### Step 6: Install & Test
1. Download APK from EAS
2. Install on your phone
3. Open app
4. Look for green dot ✅ at top of Home screen
5. Add a transaction
6. Check Firebase Console → Firestore to see your data!

## 🎯 What You Get

- ✅ **Automatic cloud backup** - Never lose your data
- ✅ **Multi-device sync** - Access from any device
- ✅ **Real-time updates** - Changes appear instantly
- ✅ **Offline mode** - Works without internet
- ✅ **Free forever** - Firebase free tier is generous

## 📖 Need More Details?

See **`FIREBASE_SETUP.md`** for:
- Detailed step-by-step instructions with screenshots
- Troubleshooting guide
- Security configuration
- Advanced features

## ❓ Common Questions

**Q: Do I need a credit card?**  
A: No! Firebase free tier works without payment.

**Q: Will my data be secure?**  
A: Yes! Only you have access to your Firebase project.

**Q: What if I skip this setup?**  
A: App works fine offline-only. You can set up Firebase later anytime.

**Q: Can I use the same data on multiple phones?**  
A: Yes! That's the whole point of cloud sync! 🎉

## 🔥 Ready to Sync!

Just follow the 6 steps above and you're done!

Questions? Check `FIREBASE_SETUP.md` or `FIREBASE_SYNC_IMPLEMENTATION.md`
