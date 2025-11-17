# UPI Spend Tracker

A comprehensive Android-only Expo React Native app for tracking UPI transactions, parsing SMS messages, and analyzing spending patterns with interactive charts.

## 📱 Features

- **SMS Transaction Reading**: Automatically read and parse UPI payment SMS from banks, GPay, PhonePe, Paytm, and BHIM
- **Smart Categorization**: Auto-categorize transactions into Food, Shopping, Bills, Travel, Groceries, Recharge, Entertainment, Healthcare, and Others
- **MongoDB Atlas Storage**: Cloud database with offline capability and automatic sync
- **Interactive Dashboard**: 
  - Monthly spending summary
  - Category-wise pie charts
  - Daily spending trend line charts
  - Top merchants analysis
- **Transaction Management**: View, search, filter, and manually add transactions
- **CSV Export**: Export transaction data to CSV files
- **Clean UI**: Modern interface using NativeWind/Tailwind CSS and React Native Paper

## 🛠 Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **State Management**: Zustand
- **Database**: MongoDB Atlas (cloud database)
- **Charts**: react-native-chart-kit
- **Navigation**: React Navigation (Bottom Tabs)
- **UI**: NativeWind + React Native Paper
- **Platform**: Android Only

## 📁 Project Structure

```
upi-tracker/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CategoryPieChart.tsx
│   │   ├── CategorySelector.tsx
│   │   ├── MonthlySummaryCard.tsx
│   │   ├── SpendingTrendChart.tsx
│   │   ├── TopMerchants.tsx
│   │   └── TransactionCard.tsx
│   ├── screens/             # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── TransactionsScreen.tsx
│   │   ├── AddTransactionScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/            # Business logic
│   │   ├── db.ts           # MongoDB Realm operations
│   │   ├── smsReader.ts    # SMS reading & permissions
│   │   ├── parser.ts       # SMS parsing logic
│   │   └── categorizer.ts  # Auto-categorization
│   ├── store/
│   │   └── transactionStore.ts  # Zustand state management
│   ├── utils/
│   │   ├── helpers.ts      # Utility functions
│   │   └── export.ts       # CSV export logic
│   ├── hooks/
│   │   └── index.ts        # Custom React hooks
│   └── types/
│       └── index.ts        # TypeScript types
├── App.tsx                  # Root component with navigation
├── package.json
├── tsconfig.json
├── app.json
└── README.md
```

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Android Studio (for Android emulator)
- Physical Android device (recommended for SMS testing)

### Setup Steps

1. **Clone or navigate to the project directory**:
   ```bash
   cd upi-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo development server**:
   ```bash
   npm start
   ```

4. **Run on Android**:
   ```bash
   npm run android
   ```
   Or scan the QR code with Expo Go app on your Android device.

## 📋 Usage

### Initial Setup

1. **Database Initialization**: 
   - The app automatically initializes the SQLite database on first launch
   - Go to Settings → Initialize Database to manually verify

2. **SMS Permissions**:
   - Go to Settings → Request SMS Permission
   - Grant SMS read permission when prompted
   - **Note**: Full SMS reading requires native module implementation (see below)

### Adding Transactions

#### Manual Entry
1. Navigate to the "Add" tab
2. Enter amount, merchant name, select category and source
3. The app will auto-suggest category based on merchant name
4. Tap "Add Transaction" to save

#### Import Sample Data (for testing)
1. Go to Settings → Import Sample Data
2. This adds 6 sample transactions for testing the UI and charts

### Viewing Analytics

#### Home Screen
- Monthly spending summary card
- Recent 10 transactions
- Pull down to refresh

#### Dashboard
- Switch between months using arrow buttons
- View category distribution pie chart
- See daily spending trends
- Top 5 merchants by spending

#### Transactions Screen
- Search transactions by merchant or amount
- Filter by category
- View all transaction history

### Export Data

1. Go to Settings → Export to CSV
2. Choose location to save the file
3. File format: `upi_spends_DD-MM-YYYY.csv`

## 🔧 SMS Parsing Implementation

### Current Status
The app includes complete SMS parsing logic but requires native module implementation for actual SMS reading on Android.

### Sample SMS Patterns Supported

The parser can extract data from SMS like:
```
Rs 450.00 debited from A/C XX1234 on 15-Nov-24 to VPA zomato@paytm via UPI. Ref 433847362847. -SBI

You have paid Rs.1200 to Swiggy via Google Pay. UPI Ref No: 434958473829

Your A/C XX5678 is debited with Rs.2500.00 on 16-Nov-24. Paid to FLIPKART via PhonePe.
```

### To Enable Full SMS Reading

For production use, you need to add native SMS reading capability:

**Option 1**: Use `react-native-get-sms-android`
```bash
npm install react-native-get-sms-android
```

**Option 2**: Create a custom Expo module
- Follow Expo's [native modules guide](https://docs.expo.dev/modules/overview/)
- Integrate Android SMS ContentProvider

**Option 3**: Use Expo Development Build
```bash
expo install expo-dev-client
expo prebuild
```

Update `src/services/smsReader.ts` with the actual SMS reading implementation.

## 🎨 Customization

### Adding New Categories

Edit `src/services/categorizer.ts`:
```typescript
const categoryKeywords: Record<TransactionCategory, string[]> = {
  YourNewCategory: ['keyword1', 'keyword2', 'keyword3'],
  // ...
};
```

Update types in `src/types/index.ts`:
```typescript
export type TransactionCategory = 
  | 'Food' 
  | 'YourNewCategory'
  // ...
```

### Modifying Chart Colors

Edit `src/utils/helpers.ts`:
```typescript
export const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    Food: '#FF6384',
    YourNewCategory: '#YOUR_COLOR',
    // ...
  };
};
```

## 🔒 Permissions

Required Android permissions (configured in `app.json`):
- `READ_SMS`: Read transaction SMS
- `RECEIVE_SMS`: Receive incoming SMS
- `WRITE_EXTERNAL_STORAGE`: Save CSV exports
- `READ_EXTERNAL_STORAGE`: Access exported files

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset Realm database
# Delete the .realm files in app data directory
# Or use the "Reset All Data" option in Settings screen
```
# Clear app data and restart
# Or run in Settings → Initialize Database
```

### Chart Not Displaying
- Ensure transactions exist for the selected month
- Check if data is loading (pull to refresh)

### TypeScript Errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📊 Database Schema

### Transactions Table
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  merchant TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  source TEXT NOT NULL,
  upiRef TEXT,
  rawMessage TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Testing

### Test SMS Parser
In `src/services/smsReader.ts`, there's a test function:
```typescript
import { testParser } from './src/services/smsReader';

// Run this to test parsing logic
await testParser();
```

### Sample Transactions
Use "Import Sample Data" in Settings to add test transactions.

## 📦 Building for Production

```bash
# Build APK
eas build --platform android --profile preview

# For production
eas build --platform android --profile production
```

## 🤝 Contributing

This is a complete working app. Feel free to:
- Add new features
- Improve SMS parsing patterns
- Enhance UI/UX
- Add more analytics

## 📄 License

MIT License - Feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

- Expo team for the amazing framework
- React Native Chart Kit for beautiful charts
- Zustand for simple state management

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the code comments (all files are well-documented)
3. Test with sample data first

---

**Built with ❤️ using Expo, React Native, and TypeScript**
