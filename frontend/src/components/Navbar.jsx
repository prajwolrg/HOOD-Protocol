import React, { useState } from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap'
import { saveToLocalStorage } from '../helpers/localStorage';
import { formatAddress } from '../utils/formatting';
import styles from "../styles/Navbar.module.css"

const Topbar = () => {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const addr = window.ethereum.selectedAddress
    setAccount(addr)
    saveToLocalStorage("wallet", addr)
  }

  return (
    <Navbar className={styles.Navbar} collapseOnSelect expand="lg" >
      <Container>
        <Nav></Nav>
        <Nav>
          {account ? <Nav.Link eventKey={2} href="#memes">{formatAddress(account)}
          </Nav.Link> : <Nav.Link onClick={connectWallet}> Connect Wallet</Nav.Link>}
        </Nav>
      </Container>
    </Navbar>
  )
}

export default Topbar;