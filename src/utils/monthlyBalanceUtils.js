// Utility function for monthly account balance calculations
// This filters transactions to only include current month for automatic monthly reset

import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * Get the current month's date range for filtering transactions
 * @param {Date} referenceDate - Optional reference date (defaults to current date)
 * @returns {Object} Object with startDate and endDate for the current month
 */
export const getCurrentMonthDateRange = (referenceDate = new Date()) => {
  const startDate = startOfMonth(referenceDate);
  const endDate = endOfMonth(referenceDate);
  
  return { startDate, endDate };
};

/**
 * Check if a transaction date falls within the current month
 * @param {Date|string|Object} transactionDate - Transaction date (Date object, string, or Firebase timestamp)
 * @param {Date} referenceDate - Optional reference date (defaults to current date)
 * @returns {boolean} True if transaction is in current month
 */
export const isCurrentMonthTransaction = (transactionDate, referenceDate = new Date()) => {
  if (!transactionDate) return false;
  
  try {
    let dateObj;
    
    // Handle different date formats
    if (transactionDate instanceof Date) {
      dateObj = transactionDate;
    } else if (transactionDate && typeof transactionDate === 'object' && transactionDate.seconds) {
      // Firebase Timestamp
      dateObj = new Date(transactionDate.seconds * 1000);
    } else if (typeof transactionDate === 'string') {
      dateObj = new Date(transactionDate);
    } else if (typeof transactionDate === 'number') {
      dateObj = new Date(transactionDate);
    } else {
      return false;
    }
    
    // Verify valid date
    if (isNaN(dateObj.getTime())) {
      return false;
    }
    
    const { startDate, endDate } = getCurrentMonthDateRange(referenceDate);
    return dateObj >= startDate && dateObj <= endDate;
  } catch (error) {
    return false;
  }
};

/**
 * Filter transactions to only include current month
 * @param {Array} transactions - Array of transactions with date property
 * @param {Date} referenceDate - Optional reference date (defaults to current date)
 * @returns {Array} Filtered transactions for current month only
 */
export const filterCurrentMonthTransactions = (transactions, referenceDate = new Date()) => {
  if (!Array.isArray(transactions)) return [];
  
  return transactions.filter(transaction => 
    isCurrentMonthTransaction(transaction.date, referenceDate)
  );
};

/**
 * Calculate account balance using only current month transactions (for monthly reset)
 * @param {string} accountNumber - Account number to filter by
 * @param {Array} incomes - Array of income transactions
 * @param {Array} payments - Array of payment transactions
 * @param {Date} referenceDate - Optional reference date (defaults to current date)
 * @returns {Object} Balance object with monthly filtered data
 */
export const calculateMonthlyAccountBalance = (accountNumber, incomes = [], payments = [], referenceDate = new Date()) => {
  // Filter incomes for current month and this account
  const monthlyAccountIncomes = filterCurrentMonthTransactions(incomes, referenceDate)
    .filter(income => income.account === accountNumber);
  
  // Filter payments for current month and this account
  const monthlyAccountPayments = filterCurrentMonthTransactions(payments, referenceDate)
    .filter(payment => payment.sourceAccount === accountNumber);
  
  // Calculate totals
  const totalIncomes = monthlyAccountIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
  const totalPayments = monthlyAccountPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  
  // Filter 4x1000 taxes (subset of payments)
  const monthly4x1000 = monthlyAccountPayments.filter(payment => 
    payment.concept?.toLowerCase().includes('4x1000') || 
    payment.concept?.toLowerCase().includes('gravamen')
  );
  const total4x1000 = monthly4x1000.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  
  return {
    incomes: totalIncomes,
    payments: totalPayments,
    tax4x1000: total4x1000,
    balance: totalIncomes - totalPayments,
    incomesCount: monthlyAccountIncomes.length,
    paymentsCount: monthlyAccountPayments.length,
    tax4x1000Count: monthly4x1000.length,
    // Additional data for debugging
    monthlyData: {
      incomes: monthlyAccountIncomes,
      payments: monthlyAccountPayments,
      tax4x1000: monthly4x1000
    }
  };
};

/**
 * Format currency for Colombian Pesos
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrencyBalance = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount || 0);
};
