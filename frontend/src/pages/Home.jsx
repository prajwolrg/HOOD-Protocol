import React from "react";
import styles from "../styles/App.module.css";
import { Tabs, Tab, Row, Col } from "react-bootstrap";
import Overview from "../components/Overview";
import UserOverview from "../components/UserOverview";
import Market from "../components/Market";
import UserMarket from "../components/UserMarket";
import { ReserveJson } from "../consts/Reservelist";
import { useState } from "react";
import "../styles/overwrite-bootstrap.css";

const Home = ({ addr }) => {
  const [reserves] = useState(ReserveJson);

  return (
    <>
      <p className={styles.title}> HomePage</p>
      <p className={styles.h1}> Overview </p>
      <Tabs bg="dark">
        {addr ? (
          <Tab eventKey="home" title="User">
            <UserOverview user={addr} />
          </Tab>
        ) : null}
        <Tab eventKey="profile" title="Market">
          <Overview />
        </Tab>
      </Tabs>
      <br />
      <br />
      <p className={styles.h1}> Markets </p>

      <Tabs>
        {addr ? (
          <Tab eventKey="profile" title="Your Markets">
            <br />
            <Row>
              <Col sm={4}>Asset</Col>
              <Col sm={2}>You Supplied</Col>
              <Col sm={2}>Supply APY</Col>
              <Col sm={2}>You Borrowed</Col>
              <Col sm={2}>Borrow APY</Col>
            </Row>
            <hr />

            {reserves.map((i) => (
              <UserMarket
                key={i.address}
                user={addr}
                symbol={i.symbol}
                reserve={i.address}
              />
            ))}
          </Tab>
        ) : null}
        <Tab eventKey="" title="All Markets">
          <br />
          <Row>
            <Col sm={4}>Asset</Col>
            <Col sm={2}>Total Supplied</Col>
            <Col sm={2}>Supply APY</Col>
            <Col sm={2}>Total Borrows</Col>
            <Col sm={2}>Borrow APY</Col>
          </Row>
          <hr />
          {reserves.map((i) => (
            <Market key={i.address} symbol={i.symbol} reserve={i.address} />
          ))}
        </Tab>
      </Tabs>
    </>
  );
};

export default Home;
