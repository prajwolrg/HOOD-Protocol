import React from "react";
import { useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";

const UserOverview = ({ keyx, user, supply, supplyRate, borrow, borrowRate }) => {
    return (
        <div className={styles.centerAlign} className={styles.box}>
        <Row>
            <Col>
                {keyx} Supply <br />
                ${supply}</Col>
            <Col>
                Supply APY %<br />
                {supplyRate}%</Col>
            <Col>
                {keyx} Borrows<br />
                ${borrow}</Col>
            <Col>
                Borrow APY %<br />
                {borrowRate}%</Col>
        </Row>
        </div>
    )
}

export default UserOverview;