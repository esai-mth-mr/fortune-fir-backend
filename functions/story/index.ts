import ValidDates from "../../models/ValidDates";
import Payment from "../../models/Payment";

const isChrismas = async (): Promise<boolean> => {
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

const isPaymentVerified = async (userId: string, current_round: number, action: string): Promise<boolean> => {
    const payment = await Payment.findOne({ user_id: userId, round: current_round, action: action });
    if (!payment) {
        return false; // If no payment is found, return false
    }

    return true;
};

// Make the `available` function asynchronous
export const available = async (userId: string, current_round: number, action: string): Promise<boolean> => {
    if (await isChrismas() && await isPaymentVerified(userId, current_round, action)) return true;

    return false;
};

export const generateUniqueRandomIntArray = (length: number, min: number, max: number): number[] => {
    // Validate that the range can accommodate the required number of unique values
    const rangeSize = max - min + 1;
    if (rangeSize < length) {
        throw new Error("Range is too small to generate unique numbers");
    }

    // Step 1: Generate numbers in the range [min, max]
    const numbers = Array.from({ length: rangeSize }, (_, i) => i + min);

    // Step 2: Shuffle only as much as needed
    for (let i = 0; i < length; i++) {
        const j = Math.floor(Math.random() * (rangeSize - i)) + i; // Random index in the unshuffled portion
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]]; // Swap elements
    }

    // Step 3: Return the first `length` numbers (already shuffled)
    return numbers.slice(0, length);
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
