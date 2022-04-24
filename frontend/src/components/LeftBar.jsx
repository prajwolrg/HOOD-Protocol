import React from 'react';
import styles from '../styles/App.module.css'
import { Link } from 'react-router-dom';
import logo from "../assets/logo_transparent.png";

const LeftBar = () => {
  return (
    <>
    <Link to="/"><img  alt="hood protocol logo" src={logo} className={styles.smallerLogo} /></Link>
    <p className={styles.extraTopMargin}>
        <Link to="/" className={styles.hoverOver}> <span className={styles.head} >Home</span></Link>
        <br/><br/>
        <Link to="/reward" className={styles.hoverOver}> <span className={styles.head} >Rewards</span></Link>
        <br/><br/>
        <Link to="/transfers" className={styles.hoverOver}> <span className={styles.head} >Transfers</span></Link>
      </p>
    </>
  )
}

export default LeftBar;
