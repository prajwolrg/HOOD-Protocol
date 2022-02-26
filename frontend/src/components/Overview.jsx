import React from "react";
import { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";
import { hexToExa } from "../helpers/hexToExa";
import { ethers } from "hardhat";
import { Contracts } from "../consts/Contracts";
import DataProviderArtifact from "../contracts/lending-pool/LendingPoolDataProvider.sol/LendingPoolDataProvider.json";

const Overview = () => {

    const [liquidityRate, setLiquidityRate] = useState(null)
    const [borrowRate, setBorrowRate] = useState(null)
    const [totalLiquidity, setTotalLiquidity] = useState(null)
    const [totalBorrows, setTotalBorrows] = useState(null)

    useEffect(() => {
        async function fetchData() {
            console.log('huhu')
            // const provider = new ethers.providers.Web3Provider(window.ethereum)
            // const dataProvider = new ethers.Contract(Contracts.dataProvider, DataProviderArtifact.abi, provider)
            // const value = await dataProvider.getSystemLevelInfo()
            // setLiquidityRate(hexToExa(value.liquidityRate))
            // setTotalLiquidity(hexToExa(value.totalLiquidity))
            // setBorrowRate(hexToExa(value.borrowRate))
            // setTotalBorrows(hexToExa(value.totalBorrows))
        }
        fetchData();
    },[])
    return (
        <div className={styles.centerAlign} className={styles.box}>
            yank
        {/* <Row>
            <Col>
                Total Supply <br />
                $</Col>
            <Col>
                Supply APY %<br />
                %</Col>
            <Col>
                Total Borrows<br />
                $</Col>
            <Col>
                Borrow APY %<br />
                %</Col>
        </Row> */}
        </div>
    )
}

export default Overview;