/**
 * Format amount as Kenyan Shillings (KES)
 * currency.ts
 */
export const formatKES = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return 'KES 0.00';
    }
    return `KES ${Number(amount).toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

/**
 * Format amount as Kenyan Shillings with 2 decimal places and comma separation
 */
export const formatKESSimple = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return 'KES 0.00';
    }
    return `KES ${Number(amount).toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};