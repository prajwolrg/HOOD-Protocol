import React from "react";
import { useEffect } from "react";
import { Form, Row, Col, Modal, Button, Accordion } from "react-bootstrap";
import Toast from "./Toast";
import styles from "../styles/App.module.css";
import { ethers } from "ethers";

import { Contracts } from "../consts/Contracts";
import DataProviderArtifact from "../contracts/lending-pool/LendingPoolDataProvider.sol/LendingPoolDataProvider.json";
import ERC20Artifact from "../contracts/tokens/Asset.sol/Asset.json";
import LendingPoolArtifact from "../contracts/lending-pool/LendingPool.sol/LendingPool.json";
import LendingPoolCore from "../contracts/lending-pool/LendingPoolCore.sol/LendingPoolCore.json";
import HERC20Artifact from "../contracts/tokens/HToken.sol/HToken.json";

import { useState } from "react";
import { hexRates, hexToNumber, by18, toBigNumber } from "../helpers/hexToExa";
import { camelCaseWord } from "../helpers/camelCase";
import { formatDecimal } from "../utils/formatNumber";
import TxnBox from "./TxnBox";

const UserMarket = ({ user, symbol, reserve }) => {
    const [liquidityRate, setLiquidityRate] = useState(null);
    const [borrowRate, setBorrowRate] = useState(null);
    const [totalLiquidity, setTotalLiquidity] = useState(null);
    const [totalBorrows, setTotalBorrows] = useState(null);
    const [userActive, setUserActive] = useState(false);
    const [userBalance, setUserBalance] = useState(null);
    const [depAmount, setDepAmount] = useState(null);
    const [borrowAmount, setBorrowAmount] = useState(null);
    const [maxBorrows, setMaxBorrows] = useState(null);

    useEffect(() => {
        async function fetchData() {
            if (user) {
                setUserActive(true);
                await stateChange();
            }
        }
        fetchData();
    }, [reserve, user]);

    const stateChange = async () => {
        const provider = new ethers.providers.Web3Provider(
            window.ethereum
        );
        const dataProvider = new ethers.Contract(
            Contracts.dataProvider,
            DataProviderArtifact.abi,
            provider
        );
        const asset = new ethers.Contract(
            reserve,
            ERC20Artifact.abi,
            provider
        );
        const value = await dataProvider.getReserveData(reserve);

        setLiquidityRate(hexRates(value.liquidityRate));
        setBorrowRate(hexRates(value.borrowRate));
        const availableLiquidity = value.availableLiquidity;

        const response = await dataProvider.getUserReserveData(
            reserve,
            user
        );
        setTotalLiquidity(response.totalLiquidity);
        setTotalBorrows(response.totalBorrows);

        const userBalance = await asset.balanceOf(user);
        setUserBalance(userBalance);

        const availableBorrows =
            await dataProvider.reserveAvailableBorrows(reserve, user);
        if (availableLiquidity.gt(availableBorrows)) {
            setMaxBorrows(availableBorrows);
        } else {
            setMaxBorrows(availableLiquidity);
        }
    }

    const [show, setShow] = useState(false);
    const [newAmount, setnewAmount] = useState(null);
    const [txn, setTxn] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const BigN = (n) => {
        if (n === null) {
            return 0;
        }
        return ethers.BigNumber.from(n.toString());
    };

    const handleDepositChange = (e) => {
        const maxAmount = userBalance.add(totalLiquidity);
        const percent = parseInt(e.target.value);
        const newAmount = maxAmount.mul(percent).div(100);
        setnewAmount(newAmount.toString());

        if (newAmount.gt(totalLiquidity)) {
            const amountToDeposit = newAmount.sub(totalLiquidity);
            setDepAmount(amountToDeposit.toString());
            setTxn("deposit");
        } else if (newAmount.lt(totalLiquidity)) {
            const amountToRedeem = totalLiquidity.sub(newAmount);
            setDepAmount(amountToRedeem.toString());
            setTxn("redeem");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (txn === "deposit") {
            depositTxn(depAmount);
        }
        if (txn === "redeem") {
            redeemTxn(depAmount);
        }
        setShow(false);
    };

    const handleBorrowSubmit = (e) => {
        e.preventDefault();
        if (txn === "borrow") {
            borrowTxn(borrowAmount);
        }
        if (txn === "repay") {
            repayTxn(borrowAmount);
        }
    };

    const handleBorrowChange = (e) => {
        const percent = parseInt(e.target.value);
        const newBorrows = maxBorrows.mul(percent).div(100);
        setnewAmount(newBorrows);

        if (newBorrows.gt(BigN(totalBorrows))) {
            const amountToBorrow = newBorrows.sub(toBigNumber(totalBorrows));
            setBorrowAmount(amountToBorrow.toString());
            setTxn("borrow");
        } else if (newBorrows.lt(BigN(totalBorrows))) {
            const amountToRepay = toBigNumber(totalBorrows).sub(newBorrows);
            setBorrowAmount(amountToRepay.toString());
            setTxn("repay");
        } else {
        }
    };

    const repayTxn = async (amount) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner();
        const lendingPool = new ethers.Contract(
            Contracts.lendingPool,
            LendingPoolArtifact.abi,
            signer
        );
        const asset = new ethers.Contract(reserve, ERC20Artifact.abi, signer);
        const tx = await asset.approve(Contracts.lendingPoolCore, BigN(amount));
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            const nextTx = await lendingPool.repay(reserve, BigN(amount));
            const nextReceipt = await nextTx.wait();
            if (nextReceipt.status === 1) {
                setSuccess("true");
                stateChange()
            } else {
                setSuccess("false");
            }
        }
    };

    const borrowTxn = async (amount) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner();
        const lendingPool = new ethers.Contract(
            Contracts.lendingPool,
            LendingPoolArtifact.abi,
            signer
        );
        const tx = await lendingPool.borrow(reserve, BigN(amount));
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            setSuccess("true");
            stateChange()
        }
    };

    const depositTxn = async (amount) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner();
        const lendingPool = new ethers.Contract(
            Contracts.lendingPool,
            LendingPoolArtifact.abi,
            signer
        );
        const asset = new ethers.Contract(reserve, ERC20Artifact.abi, signer);
        const tx = await asset.approve(Contracts.lendingPoolCore, BigN(amount));
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            const nextTx = await lendingPool.deposit(reserve, BigN(amount));
            const nextReceipt = await nextTx.wait();
            if (nextReceipt.status === 1) {
                setSuccess("true");
                stateChange()
            } else {
                setSuccess("false");
            }
        }
    };

    const redeemTxn = async (amount) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const core = new ethers.Contract(
            Contracts.lendingPoolCore,
            LendingPoolCore.abi,
            provider
        );
        const hTokenAddr = await core.getReserveHTokenAddress(reserve);

        const signer = await provider.getSigner();

        const hToken = new ethers.Contract(
            hTokenAddr,
            HERC20Artifact.abi,
            signer
        );
        const tx = await hToken.redeem(BigN(amount));
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            setSuccess("true");
            stateChange()
        } else {
            setSuccess("false");
        }
    };

    return (
        <>
            {success ? <Toast txn={txn} success={success} /> : null}
            <Row className={styles.box} onClick={handleShow}>
                {userActive ? (
                    <>
                        <Col sm={4}>{symbol.toUpperCase()}</Col>
                        <Col sm={2}>{formatDecimal(by18(totalLiquidity))}</Col>
                        <Col sm={2}>{formatDecimal(liquidityRate)}%</Col>
                        <Col sm={2}>{formatDecimal(by18(totalBorrows))}</Col>
                        <Col sm={2}>{formatDecimal(borrowRate)}%</Col>
                    </>
                ) : (
                    <Col sm={4}>{symbol.toUpperCase()}</Col>
                )}
            </Row>
            <Modal
                className={styles.modalResize}
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
                                <Form onSubmit={handleSubmit}>
                                    <Form.Range
                                        onChange={handleDepositChange}
                                    />
                                    <TxnBox
                                        txns={"depositRedeem"}
                                        newAmount={by18(newAmount)}
                                        userBalance={by18(userBalance)}
                                        supplied={by18(totalLiquidity)}
                                        newBalance={
                                            userBalance && newAmount
                                                ? by18(
                                                      hexToNumber(
                                                          toBigNumber(
                                                              userBalance
                                                          )
                                                              .sub(newAmount)
                                                              .add(
                                                                  toBigNumber(
                                                                      totalLiquidity
                                                                  )
                                                              )
                                                      )
                                                  )
                                                : 0
                                        }
                                    />
                                    {txn && (
                                        <>
                                            <br />
                                            <br />
                                            <Button
                                                variant="dark"
                                                type="submit"
                                            >
                                                {camelCaseWord(txn)}
                                            </Button>
                                        </>
                                    )}
                                    <br />
                                </Form>
                                <br />
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                            <Accordion.Header>Borrow/Repay</Accordion.Header>
                            <Accordion.Body>
                                <Form onSubmit={handleBorrowSubmit}>
                                    <Form.Range onChange={handleBorrowChange} />
                                    <TxnBox
                                        txns={"borrowRepay"}
                                        newAmount={by18(newAmount)}
                                        userBalance={by18(userBalance)}
                                        supplied={by18(totalBorrows)}
                                        newBalance={
                                            userBalance && newAmount
                                                ? by18(
                                                      hexToNumber(
                                                          toBigNumber(
                                                              userBalance
                                                          )
                                                              .add(newAmount)
                                                              .sub(
                                                                  toBigNumber(
                                                                      totalBorrows
                                                                  )
                                                              )
                                                      )
                                                  )
                                                : 0
                                        }
                                    />
                                    {txn && (
                                        <>
                                            <br />
                                            <br />
                                            <Button
                                                variant="dark"
                                                type="submit"
                                            >
                                                {camelCaseWord(txn)}
                                            </Button>
                                        </>
                                    )}
                                    <br />
                                </Form>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default UserMarket;
