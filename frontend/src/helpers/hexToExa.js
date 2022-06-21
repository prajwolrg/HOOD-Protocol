import { ethers } from "ethers";

export function hexToExa(hexValue) {
    if (hexValue === null){
        return 0;
    }
    return parseInt(hexValue.toString()) / 10 ** 18;
}

export function hexRates(hexValue) {
    if (hexValue === null){
        return 0;
    }
    return parseInt(hexValue.toString()) / 10 ** 27;
}

export function hexToNumber(hexValue) {
    if (hexValue === null){
        return 0;
    }
    if (hexValue) {
        return parseInt(hexValue.toString());
    } else return 0;
}

export function toBigNumber(hexValue) {
    if (hexValue === null){
        return 0;
    }
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
