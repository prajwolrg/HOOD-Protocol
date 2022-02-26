import React from 'react';
import ListGroup from 'react-bootstrap/ListGroup'
import styles from '../styles/App.module.css'
import { Link } from 'react-router-dom';
import logo from "../assets/logo_transparent.png";

const LeftBar = () => {
  return (
    <>
    <Link to="/"><img  alt="hood protocol logo" src={logo} className={styles.smallerLogo} /></Link>
    <p className={styles.extraTopMargin}>
        <Link to="/"> <p className={styles.hoverOver}>Home</p></Link>
        <Link to="/reward"> <p className={styles.hoverOver}>Rewards</p></Link>
      </p>
    </>
  )
}

export default LeftBar;
