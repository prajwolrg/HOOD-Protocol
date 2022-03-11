import React from "react";
import { Tabs, Tab } from "react-bootstrap";

import styles from "../styles/App.module.css";
import RewardOverview from "../components/RewardOverview";
import UserRewardOverview from "../components/UserRewardOverview";

const Reward = ({ addr }) => {
  return (
    <>
      <p className={styles.title}> Rewards</p>
      <p className={styles.h1}> Overview </p>
      <Tabs bg="dark">
        {addr ? (
          <Tab eventKey="profile" title="User">
            <UserRewardOverview addr={addr} />
          </Tab>
        ) : null}
        <Tab eventKey="home" title="Market">
          <RewardOverview />
        </Tab>
      </Tabs>
      <br />
      <div className={styles.topMargin} />
      <p className={styles.h1}>Staking</p>{" "}
      <div className={styles.box}>Staking coming soon!</div> <br />
      <div className={styles.topMargin} />
      <p className={styles.h1}>Liquidity Pools</p>{" "}
      <div className={styles.box}>Liquidity Pools coming soon!</div>
    </>
  );
};

export default Reward;
