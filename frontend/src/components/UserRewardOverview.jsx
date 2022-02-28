import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { ethers } from "ethers";
import { Contracts } from "../consts/Contracts";
import RewardDistributionArtifact from "../contracts/rewards/RewardDistribution.sol/RewardDistribution.json";
import { hexToExa } from "../helpers/hexToExa";
import { formatDecimal } from "../utils/formatNumber";
import styles from "../styles/App.module.css";

const UserRewardOverview = ({ addr }) => {
    const [rewards, setRewards] = useState(null);

    useEffect(() => {
        async function fetchData() {
            if (addr) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const dataProvider = new ethers.Contract(
                    Contracts.reward,
                    RewardDistributionArtifact.abi,
                    provider
                );
                const value = await dataProvider.getRewards(addr);
                setRewards(hexToExa(value));
            }
        }
        fetchData();
    }, [addr]);

    return (
        <>
            <div className={styles.boxCenter}>
                Accrued Rewards <br />
                {formatDecimal(rewards)}
            </div>

            <div className={styles.button}>Claim Rewards</div>
        </>
    );
};

export default UserRewardOverview;
