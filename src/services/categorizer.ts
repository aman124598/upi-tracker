/**
 * Category Auto-Assignment Service
 * Assigns categories to transactions based on merchant name keywords
 */

import { TransactionCategory } from '../types';

// Keyword mapping for each category
const categoryKeywords: Record<TransactionCategory, string[]> = {
  Food: [
    'zomato', 'swiggy', 'uber eats', 'food', 'restaurant', 'cafe', 'dominos',
    'pizza', 'burger', 'mcdonalds', 'kfc', 'subway', 'starbucks', 'dunkin',
    'biryani', 'dhaba', 'kitchen', 'mcdonald', 'barbeque', 'bbq', 'dining',
    'eatery', 'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'bakery'
  ],
  Shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'snapdeal', 'shopping', 'shop',
    'store', 'mall', 'retail', 'meesho', 'fashion', 'clothing', 'apparel',
    'electronics', 'mobile', 'laptop', 'gadget', 'footwear', 'shoes', 'bag',
    'watch', 'jewellery', 'accessories', 'nykaa', 'beauty', 'cosmetics'
  ],
  Bills: [
    'electricity', 'water', 'gas', 'bill', 'utility', 'broadband', 'internet',
    'wifi', 'postpaid', 'landline', 'dth', 'cable', 'tata sky', 'airtel',
    'rent', 'emi', 'insurance', 'premium', 'loan', 'credit card', 'payment'
  ],
  Travel: [
    'uber', 'ola', 'rapido', 'taxi', 'cab', 'metro', 'bus', 'train', 'irctc',
    'flight', 'airline', 'indigo', 'spicejet', 'hotel', 'booking', 'makemytrip',
    'goibibo', 'yatra', 'cleartrip', 'redbus', 'fuel', 'petrol', 'diesel',
    'parking', 'toll', 'fastag', 'travel'
  ],
  Groceries: [
    'bigbasket', 'grofers', 'blinkit', 'zepto', 'dunzo', 'grocery', 'vegetables',
    'fruits', 'supermarket', 'dmart', 'reliance fresh', 'more', 'kirana',
    'provisions', 'dairy', 'milk', 'bread', 'egg'
  ],
  Recharge: [
    'recharge', 'prepaid', 'mobile recharge', 'airtel', 'jio', 'vodafone',
    'vi', 'bsnl', 'topup', 'top-up', 'top up', 'paytm', 'phonepe', 'gpay'
  ],
  Entertainment: [
    'netflix', 'prime', 'hotstar', 'disney', 'spotify', 'youtube', 'movie',
    'theatre', 'cinema', 'pvr', 'inox', 'game', 'gaming', 'steam', 'entertainment',
    'subscription', 'music', 'concert', 'show', 'event', 'ticket', 'bookmyshow'
  ],
  Healthcare: [
    'hospital', 'clinic', 'doctor', 'pharmacy', 'medicine', 'medical', 'health',
    'apollo', 'medplus', 'netmeds', '1mg', 'practo', 'lab', 'diagnostic',
    'test', 'checkup', 'consultation', 'treatment'
  ],
  Others: []
};

/**
 * Categorize a transaction based on merchant name
 * @param merchant - Merchant/payee name
 * @returns TransactionCategory
 */
export const categorizeTransaction = (merchant: string): TransactionCategory => {
  const merchantLower = merchant.toLowerCase().trim();

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'Others') continue;

    for (const keyword of keywords) {
      if (merchantLower.includes(keyword.toLowerCase())) {
        return category as TransactionCategory;
      }
    }
  }

  // Default to 'Others' if no match found
  return 'Others';
};

/**
 * Get suggested categories for a merchant (returns top 3 matches)
 * Useful for manual categorization UI
 */
export const getSuggestedCategories = (merchant: string): TransactionCategory[] => {
  const merchantLower = merchant.toLowerCase().trim();
  const scores: Record<TransactionCategory, number> = {
    Food: 0,
    Shopping: 0,
    Bills: 0,
    Travel: 0,
    Groceries: 0,
    Recharge: 0,
    Entertainment: 0,
    Healthcare: 0,
    Others: 0,
  };

  // Count keyword matches for each category
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'Others') continue;

    for (const keyword of keywords) {
      if (merchantLower.includes(keyword.toLowerCase())) {
        scores[category as TransactionCategory]++;
      }
    }
  }

  // Sort categories by score and return top 3
  const sortedCategories = (Object.entries(scores) as [TransactionCategory, number][])
    .filter(([_, score]) => score > 0)
    .sort(([_, scoreA], [__, scoreB]) => scoreB - scoreA)
    .map(([category, _]) => category);

  // Return top 3 suggestions, or all categories if none match
  if (sortedCategories.length === 0) {
    return ['Others', 'Shopping', 'Food'];
  }

  return sortedCategories.slice(0, 3);
};

/**
 * Get all available categories
 */
export const getAllCategories = (): TransactionCategory[] => {
  return Object.keys(categoryKeywords) as TransactionCategory[];
};

/**
 * Add custom keywords to a category (for user customization in future)
 */
export const addCategoryKeyword = (
  category: TransactionCategory,
  keyword: string
): void => {
  if (categoryKeywords[category]) {
    const keywordLower = keyword.toLowerCase().trim();
    if (!categoryKeywords[category].includes(keywordLower)) {
      categoryKeywords[category].push(keywordLower);
    }
  }
};
