import React from "react";
import { useEffect } from "react";
import Slider, { Range } from 'rc-slider';
import { Row, Col, Modal, Button, Accordion } from "react-bootstrap";
import styles from "../styles/App.module.css";
import { ethers } from "ethers";
import { Contracts } from "../consts/Contracts";
import DataProviderArtifact from "../contracts/lending-pool/LendingPoolDataProvider.sol/LendingPoolDataProvider.json";
import { useState } from "react";
import { hexToExa, hexRates } from "../helpers/hexToExa";
import { loadFromLocalStorage } from "../helpers/localStorage";
import { formatDecimal } from "../utils/formatNumber";

const UserMarket = ({ user, symbol, reserve }) => {
    const [liquidityRate, setLiquidityRate] = useState(null);
    const [borrowRate, setBorrowRate] = useState(null);
    const [totalLiquidity, setTotalLiquidity] = useState(null);
    const [totalBorrows, setTotalBorrows] = useState(null);
    const [userActive, setUserActive] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (user) {
                setUserActive(true);
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                );
                const dataProvider = new ethers.Contract(
                    Contracts.dataProvider,
                    DataProviderArtifact.abi,
                    provider
                );
                const value = await dataProvider.getReserveData(reserve);

                setLiquidityRate(hexRates(value.liquidityRate));
                setBorrowRate(hexRates(value.borrowRate));

                const response = await dataProvider.getUserReserveData(
                    reserve,
                    user
                );
                setTotalLiquidity(hexToExa(response.totalLiquidity));
                setTotalBorrows(hexToExa(response.totalBorrows));
            }
        }

        fetchData();
    }, [reserve, user]);

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <Row className={styles.box} onClick={handleShow}>
                {userActive ? (
                    <>
                        <Col sm={4}>{symbol.toUpperCase()}</Col>
                        <Col sm={2}>{formatDecimal(totalLiquidity)}</Col>
                        <Col sm={2}>{formatDecimal(liquidityRate)}%</Col>
                        <Col sm={2}>{formatDecimal(totalBorrows)}</Col>
                        <Col sm={2}>{formatDecimal(borrowRate)}%</Col>
                    </>
                ) : (
                    <Col sm={4}>{symbol.toUpperCase()}</Col>
                )}
            </Row>
            <Modal
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{symbol.toUpperCase()}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Accordion>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Deposit/Redeem</Accordion.Header>
                            <Accordion.Body>
                                <div>
                                    <div className={styles.floatLeft}>Supplied<br /><div className={styles.fill} /></div><div className={styles.floatRight}>Available<br /><div className={styles.fill} /></div>
                                </div>
                                <br /><br /><br />
                                <Slider />
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                            <Accordion.Header>Borrow/Repay</Accordion.Header>
                            <Accordion.Body>
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit, sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua. Ut
                                enim ad minim veniam, quis nostrud exercitation
                                ullamco laboris nisi ut aliquip ex ea commodo
                                consequat. Duis aute irure dolor in
                                reprehenderit in voluptate velit esse cillum
                                dolore eu fugiat nulla pariatur. Excepteur sint
                                occaecat cupidatat non proident, sunt in culpa
                                qui officia deserunt mollit anim id est laborum.
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary">Understood</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default UserMarket;
