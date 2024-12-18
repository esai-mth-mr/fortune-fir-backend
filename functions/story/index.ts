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
