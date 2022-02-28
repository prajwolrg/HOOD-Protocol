export function hexToExa(hexValue) {
    return parseInt(hexValue.toString())/10**18
}

export function hexRates(hexValue) {
    return parseInt(hexValue.toString())/10**27
}