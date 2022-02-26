import React from "react";
import { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";
import { hexToExa } from "../helpers/hexToExa";
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
                setLiquidityRate(hexToExa(response.liquidityRate))
                setBorrowRate(hexToExa(response.borrowRate))
                setTotalLiquidity(hexToExa(value.totalLiquidity))
                setTotalBorrows(hexToExa(value.totalBorrows))
            }
        }
        fetchData();
    }, [user])
    
    return (
        <div className={styles.centerAlign} className={styles.box}>
            <Row>
                <Col>
                    Your Supply <br />
                    ${totalLiquidity}</Col>
                <Col>
                    Supply APY %<br />
                    {liquidityRate}%</Col>
                <Col>
                    Your Borrows<br />
                    ${totalBorrows}</Col>
                <Col>
                    Borrow APY %<br />
                    %{borrowRate}</Col>
            </Row>
        </div>
    )
}

export default UserOverview;