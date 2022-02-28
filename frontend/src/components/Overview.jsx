import React from "react";
import { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";
import { formatDecimal } from "../utils/formatNumber";
import { hexToExa, hexRates } from "../helpers/hexToExa";
import { ethers } from "ethers";
import { Contracts } from "../consts/Contracts";
import DataProviderArtifact from "../contracts/lending-pool/LendingPoolDataProvider.sol/LendingPoolDataProvider.json";

const Overview = () => {
    const [liquidityRate, setLiquidityRate] = useState(null)
    const [borrowRate, setBorrowRate] = useState(null)
    const [totalLiquidity, setTotalLiquidity] = useState(null)
    const [totalBorrows, setTotalBorrows] = useState(null)

    useEffect(() => {
        async function fetchData() {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const dataProvider = new ethers.Contract(Contracts.dataProvider, DataProviderArtifact.abi, provider)
            const value = await dataProvider.getSystemLevelInfo()
            setLiquidityRate(hexRates(value.liquidityRate))
            setTotalLiquidity(hexToExa(value.totalLiquidity))
            setBorrowRate(hexRates(value.borrowRate))
            setTotalBorrows(hexToExa(value.totalBorrows))
        }
        fetchData();
    }, [])
    return (
        <div className={styles.boxCenter}>
            <Row>
                <Col>
                    Total Supply <br />
                    ${formatDecimal(totalLiquidity)}</Col>
                <Col>
                    Supply APY %<br />
                    {formatDecimal(liquidityRate)}%</Col>
                <Col>
                    Total Borrows<br />
                    ${formatDecimal(totalBorrows)}</Col>
                <Col>
                    Borrow APY %<br />
                    {formatDecimal(borrowRate)}%</Col>
            </Row>
        </div>
    )
}

export default Overview;