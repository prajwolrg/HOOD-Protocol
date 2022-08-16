import React from 'react';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import LeftBar from './LeftBar'
import Home from "../pages/Home";
import TokenTransfers from "../pages/TokenTransfers";
import { Route, Routes } from 'react-router-dom';
import styles from "../styles/App.module.css";

const Layout = ({addr}) => {
    return (
        <Container>
            <Row className={styles.topMargin}>
                <Col sm={3}><LeftBar /></Col>
                <Col sm={9}>
                    <Routes>
                        <Route path="/" element={<Home addr={addr}/>} />
                        <Route path="/transfers" element={<TokenTransfers addr={addr} />} />
                        <Route path="/mint" element={<TokenTransfers addr={addr} />} />
                    </Routes></Col>
            </Row>
        </Container>
    )
}

export default Layout