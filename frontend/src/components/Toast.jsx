import React, { useState, useEffect } from "react";
import { Toast as Notification, Row, Col } from "react-bootstrap";
import styles from "../styles/App.module.css";

const Toast = ({ txn, success }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (txn) {
            setShow(true);
        }
    }, [txn]);

    return (
        <>
            {success ? (
                <Row>
                    <Col xs={6}>
                        <Notification
                            className={styles.topNotification}
                            onClose={() => setShow(false)}
                            show={show}
                            delay={3000}
                            autohide
                        >
                            <Notification.Header>
                                <strong className="me-auto">
                                    {txn.toUpperCase()}
                                </strong>
                                <small>.. seconds ago</small>
                            </Notification.Header>
                            {success === "true" ? (
                                <Notification.Body>
                                    Transaction Successful
                                </Notification.Body>
                            ) : (
                                <Notification.Body>
                                    Transaction Failed
                                </Notification.Body>
                            )}
                        </Notification>
                    </Col>
                </Row>
            ) : null}
        </>
    );
};

export default Toast;
