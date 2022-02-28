import React from "react";
import { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";
import { hexToExa, hexRates } from "../helpers/hexToExa";
import { formatDecimal } from "../utils/formatNumber";
import { ethers } from "ethers";
import { Contracts } from "../consts/Contracts";
import DataProviderArtifact from "../contracts/lending-pool/LendingPoolDataProvider.sol/LendingPoolDataProvider.json";

const UserOverview = ({ user }) => {
    const [liquidityRate, setLiquidityRate] = useState(0)
    const [borrowRate, setBorrowRate] = useState(0)
    const [totalLiquidity, setTotalLiquidity] = useState(0)
    const [totalBorrows, setTotalBorrows] = useState(0)

    useEffect(() => {
        async function fetchData() {
            if (user) {
                const provider = new ethers.providers.Web3Provider(window.ethereum)
                const dataProvider = new ethers.Contract(Contracts.dataProvider, DataProviderArtifact.abi, provider)
                const value = await dataProvider.getUserAccountData(user)
                const response= await dataProvider.getSystemLevelInfo()
                setLiquidityRate(hexRates(response.liquidityRate))
                setBorrowRate(hexRates(response.borrowRate))
                setTotalLiquidity(hexToExa(value.totalLiquidity))
                setTotalBorrows(hexToExa(value.totalBorrows))
            }
        }
        fetchData();
    }, [user])
    
    return (
        <div className={styles.boxCenter}>
            <Row>
                <Col>
                    Your Supply <br />
                    ${formatDecimal(totalLiquidity)}</Col>
                <Col>
                    Supply APY %<br />
                    {formatDecimal(liquidityRate)}%</Col>
                <Col>
                    Your Borrows<br />
                    ${formatDecimal(totalBorrows)}</Col>
                <Col>
                    Borrow APY %<br />
                    {formatDecimal(borrowRate)}%</Col>
            </Row>
        </div>
    )
}

export default UserOverview;