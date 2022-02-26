import React, { useEffect } from "react";
import Topbar from "./components/Navbar";
import { ethers } from "ethers";
import styles from "./styles/App.module.css"
import Layout from "./components/Layout";


const App = () => {

	useEffect(() => {
		async function fetchData() {
			if (window.ethereum === undefined) {
				console.log("no wallet detected")
			}
		}
		fetchData();
	}, [])

	return (<div className={styles.App}>
		<Topbar />
		<Layout />
	</div>)
}

export default App;