import ValidDates from "../../models/ValidDates";

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

// Make the `available` function asynchronous
export const available = async (): Promise<boolean> => {
    return await isChrismas();
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
