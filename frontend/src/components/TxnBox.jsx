import React from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";
import { formatDecimal } from "../utils/formatNumber";

const TxnBox = ({ txns, supplied, newAmount, userBalance, newBalance }) => {
    return (
        <div className={styles.boxCenter}>
            <Row>
                <Col>
                    User{" "}
                    {txns === "depositRedeem" ? (
                        <span>Supplied</span>
                    ) : (
                        <span>Borrowed</span>
                    )}{" "}
                    <br />
                    {formatDecimal(supplied)}
                </Col>
                <Col>
                    User Balance
                    <br />
                    {formatDecimal(userBalance)}
                </Col>
                <Col>
                    New{" "}
                    {txns === "depositRedeem" ? (
                        <span>Supplied</span>
                    ) : (
                        <span>Borrowed</span>
                    )}
                    <br />
                    {formatDecimal(newAmount)}
                </Col>
                <Col>
                    New User Balance
                    <br />
                    {formatDecimal(newBalance)}
                </Col>
            </Row>
        </div>
    );
};

export default TxnBox;
