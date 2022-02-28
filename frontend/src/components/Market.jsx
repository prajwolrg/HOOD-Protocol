import React from "react";
import { useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";
import { ethers } from "ethers";
import { Contracts } from "../consts/Contracts";
import DataProviderArtifact from "../contracts/lending-pool/LendingPoolDataProvider.sol/LendingPoolDataProvider.json";
import { useState } from "react";
import { hexToExa, hexRates } from "../helpers/hexToExa";
import { formatDecimal } from "../utils/formatNumber";


const Market = ({ symbol, reserve }) => {
    
    const [liquidityRate, setLiquidityRate] = useState(null)
    const [borrowRate, setBorrowRate] = useState(null)
    const [totalLiquidity, setTotalLiquidity] = useState(null)
    const [totalBorrows, setTotalBorrows] = useState(null)

    useEffect(() => {
        async function fetchData() {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const dataProvider = new ethers.Contract(Contracts.dataProvider, DataProviderArtifact.abi, provider)
            const value = await dataProvider.getReserveData(reserve)
            setLiquidityRate(hexRates(value.liquidityRate))
            setTotalLiquidity(hexToExa(value.totalLiquidity))
            setBorrowRate(hexRates(value.borrowRate))
            setTotalBorrows(hexToExa(value.totalBorrows))
        }
        fetchData();
    },[reserve])
    
    return (
        <Row className={styles.box}>
            <Col sm={4}>{symbol.toUpperCase()}</Col>
            <Col sm={2}>{formatDecimal(totalLiquidity)}</Col>
            <Col sm={2}>{formatDecimal(liquidityRate)}%</Col>
            <Col sm={2}>{formatDecimal(totalBorrows)}</Col>
            <Col sm={2}>{formatDecimal(borrowRate)}%</Col>
        </Row>
    )
}

export default Market;