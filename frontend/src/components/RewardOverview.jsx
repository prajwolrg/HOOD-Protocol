import React from "react";
import { Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";

const RewardOverview = () => {
	return (
		<>
			<div className={styles.boxCenter}>
				<Row>
					<Col>
						Daily Rewards <br />
						9000
					</Col>
					<Col>
						HUSD Rewards
						<br />
						3000
					</Col>
					<Col>
						HNRS Rewards
						<br />
						3000
					</Col>
					<Col>
						NEWT Rewards
						<br />
						3000
					</Col>
				</Row>
			</div>
			<br/>
			<div className={styles.topMargin} />
			<p className={styles.h1}>Further Details</p>{" "}
			<div className={styles.box}>
				<Row>
					<Col>
						Deposit <br />
						20%
					</Col>
					<Col>
						Borrow
						<br />
						10%
					</Col>
				</Row>
			</div>	
		</>
	);
};

export default RewardOverview;
