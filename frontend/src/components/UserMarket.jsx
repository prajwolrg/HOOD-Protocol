import React from "react";
import { useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";
import { ethers } from "ethers";
import { Contracts } from "../consts/Contracts";
import DataProviderArtifact from "../contracts/lending-pool/LendingPoolDataProvider.sol/LendingPoolDataProvider.json";
import { useState } from "react";
import { hexToExa } from "../helpers/hexToExa";
import { loadFromLocalStorage } from "../helpers/localStorage";


const UserMarket = ({ user, symbol, reserve }) => {
    
    const [liquidityRate, setLiquidityRate] = useState(null)
    const [borrowRate, setBorrowRate] = useState(null)
    const [totalLiquidity, setTotalLiquidity] = useState(null)
    const [totalBorrows, setTotalBorrows] = useState(null)
    const [userActive, setUserActive] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (user) {
                setUserActive(true)
                const provider = new ethers.providers.Web3Provider(window.ethereum)
                const dataProvider = new ethers.Contract(Contracts.dataProvider, DataProviderArtifact.abi, provider)
                const value = await dataProvider.getReserveData(reserve)

                setLiquidityRate(hexToExa(value.liquidityRate))
                setBorrowRate(hexToExa(value.borrowRate))

                const response = await dataProvider.getUserReserveData(reserve, user);
                setTotalLiquidity(response.totalLiquidity)
                setTotalBorrows(response.totalBorrows)
            }            
        }
        fetchData();
    },[])
    
    return (
        <Row className={styles.box}>
        {
            userActive ? <>
            <Col sm={4}>{symbol.toUpperCase()}</Col>
            <Col sm={2}>{totalLiquidity}</Col>
            <Col sm={2}>{liquidityRate}</Col>
            <Col sm={2}>{totalBorrows}</Col>
            <Col sm={2}>{borrowRate}</Col></>
            : 
            <Col sm={4}>{symbol.toUpperCase()}</Col>
        }
        </Row>
    )
}

export default UserMarket;