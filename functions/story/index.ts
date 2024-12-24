import ValidDates from "../../models/ValidDates";
import Payment from "../../models/Payment";

export const isChrismas = async (): Promise<boolean> => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // Months are 0-based in JavaScript
    const day = today.getDate();

    const validDates = await ValidDates.findOne();

    if (!validDates || !validDates.available_dates) {
        return false; // If no valid dates are found, return false
    }

    // Check if today's date matches any of the available dates
    return validDates.available_dates.some((date) => {
        const validDate = new Date(date);
        return (
            validDate.getFullYear() === year &&
            validDate.getMonth() + 1 === month &&
            validDate.getDate() === day
        );
    });
};

export const isPaymentVerified = async (userId: string, current_round: number, action: string): Promise<boolean> => {
    const payment = await Payment.findOne({ user_id: userId, round: current_round, action: action });
    if (!payment) {
        return false; // If no payment is found, return false
    }

    return true;
};

// Make the `available` function asynchronous
export const available = async (userId: string, current_round: number, action: string): Promise<boolean> => {
    if (await isPaymentVerified(userId, current_round, action)) return true;

    return false;
};

export const generateUniqueRandomIntArray = (length: number, min: number, max: number): number[] => {
    const rangeSize = max - min + 1;
    if (rangeSize < length) {
        throw new Error("Range is too small to generate unique numbers");
    }

    const result: Set<number> = new Set();

    while (result.size < length) {
        // Generate a random number in the range [min, max]
        const randomNum = Math.floor(Math.random() * rangeSize) + min;
        result.add(randomNum); // Set ensures uniqueness
    }

    // Convert the Set to an array and return it
    return Array.from(result);
};


export const getAssetRange = (point: number): { start: number; end: number } => {
    if (point > 1400 && point <= 2100) return { start: 0, end: 55 };
    if (point > 700 && point <= 1400) return { start: 0, end: 100 };
    if (point > 0 && point <= 700) return { start: 25, end: 145 };
    if (point > -700 && point <= 0) return { start: 56, end: 185 };
    if (point > -1400 && point <= -700) return { start: 101, end: 200 };
    if (point <= -1400 && point >= -2100) return { start: 146, end: 200 };
    throw new Error('Invalid point value'); // Handle unexpected point ranges
};
