import React from "react";
import { useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";
import { ethers } from "ethers";
import { Contracts } from "../consts/Contracts";
import DataProviderArtifact from "../contracts/lending-pool/LendingPoolDataProvider.sol/LendingPoolDataProvider.json";
import { useState } from "react";
import { hexToExa } from "../helpers/hexToExa";


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
            setLiquidityRate(hexToExa(value.liquidityRate))
            setTotalLiquidity(hexToExa(value.totalLiquidity))
            setBorrowRate(hexToExa(value.borrowRate))
            setTotalBorrows(hexToExa(value.totalBorrows))
        }
        fetchData();
    },[])
    
    return (
        <Row className={styles.box}>
            <Col sm={4}>{symbol.toUpperCase()}</Col>
            <Col sm={2}>{totalLiquidity}</Col>
            <Col sm={2}>{liquidityRate}</Col>
            <Col sm={2}>{totalBorrows}</Col>
            <Col sm={2}>{borrowRate}</Col>
        </Row>
    )
}

export default Market;