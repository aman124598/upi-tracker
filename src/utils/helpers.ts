/**
 * Utility Functions
 * Common helper functions used throughout the app
 */

/**
 * Format currency amount to INR
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Format currency without decimals
 */
export const formatCurrencyShort = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${Math.round(amount)}`;
};

/**
 * Format date to readable string (e.g., "15 Nov 2024")
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateString;
  }
};

/**
 * Format date to short format (e.g., "15 Nov")
 */
export const formatDateShort = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month}`;
  } catch (e) {
    return dateString;
  }
};

/**
 * Format date to time (e.g., "2:30 PM")
 */
export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return '';
  }
};

/**
 * Get month name from YYYY-MM format
 */
export const getMonthName = (monthString: string): string => {
  try {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  } catch (e) {
    return monthString;
  }
};

/**
 * Get current month in YYYY-MM format
 */
export const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get previous month in YYYY-MM format
 */
export const getPreviousMonth = (currentMonth: string): string => {
  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month - 1);
  date.setMonth(date.getMonth() - 1);
  const newYear = date.getFullYear();
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${newYear}-${newMonth}`;
};

/**
 * Get next month in YYYY-MM format
 */
export const getNextMonth = (currentMonth: string): string => {
  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month - 1);
  date.setMonth(date.getMonth() + 1);
  const newYear = date.getFullYear();
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${newYear}-${newMonth}`;
};

/**
 * Get current date-time in ISO format for database
 */
export const getCurrentDateTime = (): string => {
  return new Date().toISOString();
};

/**
 * Convert date to YYYY-MM-DD format
 */
export const formatDateForDB = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Get list of last N months in YYYY-MM format
 */
export const getLastNMonths = (count: number): string[] => {
  const months: string[] = [];
  let current = getCurrentMonth();
  
  for (let i = 0; i < count; i++) {
    months.push(current);
    current = getPreviousMonth(current);
  }
  
  return months;
};

/**
 * Check if date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if date is within current month
 */
export const isCurrentMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate random color (for charts)
 */
export const getRandomColor = (): string => {
  const colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#C9CBCF',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Get category color
 */
export const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    Food: '#FF6384',
    Shopping: '#36A2EB',
    Bills: '#FFCE56',
    Travel: '#4BC0C0',
    Groceries: '#9966FF',
    Recharge: '#FF9F40',
    Entertainment: '#E7E9ED',
    Healthcare: '#FF6B9D',
    Others: '#C9CBCF',
  };
  return colorMap[category] || '#C9CBCF';
};

/**
 * Get category icon
 */
export const getCategoryIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    Food: 'food',
    Shopping: 'shopping',
    Bills: 'file-document',
    Travel: 'airplane',
    Groceries: 'cart',
    Recharge: 'cellphone',
    Entertainment: 'movie',
    Healthcare: 'hospital-box',
    Others: 'circle-outline',
  };
  return iconMap[category] || 'circle-outline';
};

/**
 * Validate amount input
 */
export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

/**
 * Sanitize merchant name
 */
export const sanitizeMerchantName = (name: string): string => {
  return name.trim().replace(/[^\w\s@._-]/g, '').substring(0, 100);
};
