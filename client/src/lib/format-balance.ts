/**
 * Format token balance for display
 * - Shows "0.0" for zero balances
 * - Shows up to 6 decimal places maximum for all balances
 * - Removes unnecessary trailing zeros
 */
export function formatBalance(balance: string | number): string {
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  // Handle zero or invalid values
  if (!numBalance || numBalance === 0 || isNaN(numBalance)) {
    return "0.0";
  }
  
  // For very small balances, use up to 6 decimal places
  if (numBalance < 0.000001) {
    return numBalance.toFixed(6);
  }
  
  // For balances less than 1, show up to 6 decimal places but remove trailing zeros
  if (numBalance < 1) {
    const formatted = numBalance.toFixed(6);
    // Remove trailing zeros but keep at least one decimal place
    return formatted.replace(/\.?0+$/, '').replace(/\.$/, '.0');
  }
  
  // For balances >= 1, show up to 6 decimal places
  if (numBalance < 1000) {
    const formatted = numBalance.toFixed(6);
    // Remove trailing zeros
    return formatted.replace(/\.?0+$/, '');
  }
  
  // For larger balances, show with thousand separators and up to 6 decimal places
  return numBalance.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 6 
  });
}
