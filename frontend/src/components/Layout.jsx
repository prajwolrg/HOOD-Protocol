import React from 'react';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import LeftBar from './LeftBar'
import Home from "../pages/Home";
import Reward from "../pages/Reward";
import { Route, Routes } from 'react-router-dom';
import styles from "../styles/App.module.css";

const Layout = () => {
    return (
        <Container>
            <Row className={styles.topMargin}>
                <Col sm={3}><LeftBar /></Col>
                <Col sm={9}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/reward" element={<Reward />} />
                    </Routes></Col>
            </Row>
        </Container>
    )
}

export default Layout