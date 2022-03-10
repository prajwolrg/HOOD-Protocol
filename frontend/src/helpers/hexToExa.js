import { ethers } from "ethers";

export function hexToExa(hexValue) {
    return parseInt(hexValue.toString()) / 10 ** 18;
}

export function hexRates(hexValue) {
    return parseInt(hexValue.toString()) / 10 ** 27;
}

export function hexToNumber(hexValue) {
    if (hexValue) {
        return parseInt(hexValue.toString());
    } else return 0;
}

export function toBigNumber(hexValue) {
    if (hexValue) {
       return ethers.BigNumber.from(hexValue.toString())
    } else return 0;
}

export function by18(number) {
    return number / 10 ** 18;
}

export function by9(number) {
    return number / 10 ** 9;
}
