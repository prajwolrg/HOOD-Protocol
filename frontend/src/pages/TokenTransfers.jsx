import React, { useEffect, useState } from "react";
import styles from "../styles/App.module.css";
import { Form, Accordion, InputGroup, FormControl, Button } from "react-bootstrap";
import Toast from "../components/Toast";
import { ethers } from "ethers";
import { ReserveJson } from "../consts/Reservelist";
import { toBigNumber, by18 } from "../helpers/hexToExa";
import { formatDecimal } from "../utils/formatNumber";
import AssetArtifact from "../contracts/tokens/Asset.sol/Asset.json"


const TokenTransfers = ({ addr }) => {
    return (
        <>
            <p className={styles.title}> Token Transfers</p>
            {
                ReserveJson.map(i => <IndividualToken key={i.address} symbol={i.symbol} addr={addr} tokenAddr={i.address} />)
            }
        </>
    )
}


const IndividualToken = ({ symbol, tokenAddr, addr }) => {
    const [toAddr, setToAddr] = useState('0x');
    const [val, setVal] = useState(0);
    const [success, setSuccess] = useState(null);
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        async function fetchData() {
            if (addr) {
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                );
                const asset = new ethers.Contract(
                    tokenAddr,
                    AssetArtifact.abi,
                    provider
                );
                const value = await asset.balanceOf(addr);
                setBalance(by18(value));
            }
        }
        fetchData();
    }, [addr, tokenAddr]);

    async function fetchData() {
        if (addr) {
            const provider = new ethers.providers.Web3Provider(
                window.ethereum
            );
            const asset = new ethers.Contract(
                tokenAddr,
                AssetArtifact.abi,
                provider
            );
            const value = await asset.balanceOf(addr);
            setBalance(by18(value));
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        const value = toBigNumber(parseInt(val) * 10 ** 18)

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner();
        const asset = new ethers.Contract(
            tokenAddr,
            AssetArtifact.abi,
            signer
        );

        const tx = await asset.transfer(toAddr, value);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            setSuccess("true");
            fetchData();
        } else {
            setSuccess("false");
        }
    }

    return (
        <>
        {addr && <Toast txn={"Token transferred"} success={success} /> }
            {success ? (
                <Toast txn={"Token transferred"} success={success} />
            ) : null}
            {
                addr && addr ? <Accordion>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>{symbol.toUpperCase()}</Accordion.Header>
                        <Accordion.Body>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group>
                                    <>
                                        <p>Balance: {formatDecimal(balance)} {symbol.toUpperCase()}</p>
                                        <p>From: {addr}</p>
                                    </>
                                    <InputGroup className="mb-2">
                                        <InputGroup.Text>To &nbsp;&nbsp;&nbsp;&nbsp;</InputGroup.Text>
                                        <FormControl id="inlineFormInputGroup" placeholder="0x....." onChange={e => setToAddr(e.target.value)} />
                                    </InputGroup>
                                    <InputGroup className="mb-2">
                                        <InputGroup.Text>Amount</InputGroup.Text>
                                        <FormControl id="inlineFormInputGroup" placeholder="20" value={val} onChange={e => setVal(e.target.value)} />
                                    </InputGroup>
                                    <Button type="submit" variant="dark">
                                        Transfer
                                    </Button>
                                </Form.Group>
                            </Form>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion> : null
            }

        </>
    )


}

export default TokenTransfers;