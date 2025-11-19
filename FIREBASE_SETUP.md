# 🔥 Firebase Setup Guide - UPI Tracker

Follow these steps to enable cloud sync for your UPI Tracker app.

## 📋 Prerequisites
- A Google account
- Your app built and ready to test

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `upi-tracker` (or any name you prefer)
4. Click **Continue**
5. Disable Google Analytics (optional, not needed for this app)
6. Click **Create project**
7. Wait for project creation (takes ~30 seconds)
8. Click **Continue** when ready

---

## Step 2: Add Android App to Firebase

1. In your Firebase project, click the **Android icon** (</>) to add Android app
2. Fill in the form:
   - **Android package name**: `com.upispendtracker` (IMPORTANT: Must match exactly!)
   - **App nickname**: `UPI Tracker` (optional)
   - **Debug signing certificate SHA-1**: Leave blank for now
3. Click **Register app**

---

## Step 3: Download google-services.json

1. Download the `google-services.json` file
2. **IMPORTANT**: Place it in your project at:
   ```
   android/app/google-services.json
   ```
3. Click **Next** (skip SDK setup steps, already done via npm)
4. Click **Continue to console**

---

## Step 4: Update Android Build Files

### 4.1 Update `android/build.gradle`

Add Google Services to the **project-level** build.gradle:

```gradle
buildscript {
    dependencies {
        // Add this line
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### 4.2 Update `android/app/build.gradle`

Add at the **bottom** of the file (after all other code):

```gradle
apply plugin: 'com.google.gms.google-services'
```

---

## Step 5: Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
   - Test mode allows read/write without authentication
   - You can add security rules later
4. Choose a Cloud Firestore location (pick closest to you):
   - `asia-south1` (Mumbai) for India users
   - `us-central1` for USA users
5. Click **Enable**

---

## Step 6: Configure Firestore Security Rules (Optional but Recommended)

For production, update Firestore rules:

1. Go to **Firestore Database** → **Rules**
2. Replace with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write to all users for now
    // TODO: Add authentication and user-specific rules later
    match /users/{userId}/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **Publish**

> **Note**: For production apps, implement Firebase Authentication and restrict access to authenticated users only.

---

## Step 7: Build and Test

### Rebuild Your App

Since you've added native Firebase code, rebuild with EAS:

```bash
eas build --platform android --profile production-apk
```

### Test Cloud Sync

1. Install the APK on your device
2. Open the app - you should see **"Firebase sync enabled"** in logs
3. Add a transaction manually
4. You should see:
   - ✅ Green dot in sync status indicator
   - "Synced just now" message
5. Check Firebase Console → Firestore Database to see your data!

---

## Step 8: Test Multi-Device Sync

1. Install app on **two devices** (or reinstall on same device)
2. Add transaction on **Device 1**
3. Open app on **Device 2** - transaction should appear automatically!
4. Add transaction on **Device 2**
5. Check **Device 1** - new transaction syncs in real-time! 🎉

---

## 🔍 Troubleshooting

### "Firebase sync not configured yet"
- ✅ Check `google-services.json` is in `android/app/` folder
- ✅ Check package name matches: `com.upispendtracker`
- ✅ Rebuild app with `eas build`

### "Permission denied" errors in Firestore
- ✅ Check Firestore rules allow read/write
- ✅ Ensure you're in **test mode** or have proper authentication

### Sync not working
- ✅ Check device has internet connection
- ✅ Check Firebase Console for any errors
- ✅ Look at app logs: `npx react-native log-android`

### Build fails with Google Services error
- ✅ Check `google-services.json` is valid JSON
- ✅ Ensure package name matches in all places
- ✅ Clean build: `cd android && ./gradlew clean`

---

## 🎯 Next Steps (Optional)

### Add Authentication
Secure your data with Firebase Auth:
```bash
npm install @react-native-firebase/auth
```

### Add User Accounts
Update security rules to restrict access:
```javascript
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Add Offline Persistence
Already enabled by default! Firestore caches data locally.

### Monitor Usage
- Firebase Console → **Usage** tab
- Free tier: 50K reads/day, 20K writes/day (plenty for personal use!)

---

## 📊 Database Structure

Your Firestore database will look like this:

```
/users/{userId}/
  /transactions/{transactionId}
    - id: string
    - amount: number
    - merchant: string
    - category: string
    - date: string
    - source: string
    - upiRef: string
    - rawMessage: string
    - createdAt: string
    - syncedAt: number
```

---

## ✅ You're Done!

Your UPI Tracker now has:
- ✅ **Local-first storage** (works offline)
- ✅ **Cloud backup** (never lose data)
- ✅ **Multi-device sync** (access from any device)
- ✅ **Real-time updates** (see changes instantly)
- ✅ **Automatic conflict resolution** (latest wins)

Happy tracking! 💰📱
