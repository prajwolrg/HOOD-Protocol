import React from "react";
import { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";
import { hexToExa } from "../helpers/hexToExa";
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
            setLiquidityRate(hexToExa(value.liquidityRate))
            setTotalLiquidity(hexToExa(value.totalLiquidity))
            setBorrowRate(hexToExa(value.borrowRate))
            setTotalBorrows(hexToExa(value.totalBorrows))
        }
        fetchData();
    }, [])
    return (
        <div className={styles.centerAlign} className={styles.box}>
            <Row>
                <Col>
                    Total Supply <br />
                    ${totalLiquidity}</Col>
                <Col>
                    Supply APY %<br />
                    {liquidityRate}%</Col>
                <Col>
                    Total Borrows<br />
                    ${totalBorrows}</Col>
                <Col>
                    Borrow APY %<br />
                    %{borrowRate}</Col>
            </Row>
        </div>
    )
}

export default Overview;