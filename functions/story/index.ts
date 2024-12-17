
const isChrismas = (): boolean => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    return year == 2024 && month === 12 && day === 25;
}

export const available = (): boolean => {
    if (isChrismas()) return true;
    else return false
}

