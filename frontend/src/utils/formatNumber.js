function formatDecimal(number) {
    if (number) {
        return number.toFixed(2)
    } 
    return number;
}

export { formatDecimal };