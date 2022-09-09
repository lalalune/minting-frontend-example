import ReactDOM from "react-dom";
import "./index.css";

import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import axios from "axios";
import { BigNumber, ethers } from "ethers";
import React, { useState } from "react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConnectOff from "./asset/image/ConnectOff.png";
import ConnectOn from "./asset/image/ConnectOn.png";
import DisconnectOff from "./asset/image/DisconnectOff.png";
import DisconnectOn from "./asset/image/DisconnectOn.png";
import EtherscanButtonOff from "./asset/image/EtherscanButtonOff.png";
import EtherscanButtonOn from "./asset/image/EtherscanButtonOn.png";
import MintButtonOff from "./asset/image/MintButtonOff.png";
import MintButtonOn from "./asset/image/MintButtonOn.png";
import QuanButtonOff from "./asset/image/QuantityOff.png";
import { API_URL, Contract } from "./config";
import "./index.css";

const Content = () => {

  const {
    activate,
    deactivate,
    library,
    account
  } = useWeb3React();

  const injected = new InjectedConnector({
    supportedChainIds: [1, 3, 4, 5, 42, 97],
  });

  const onConnectClicked = async () => {
    try {
      await activate(injected);
    } catch (ex) {
      console.log(ex);
    }
  };

  const onDisconnectClicked = () => {
    try {
      deactivate();
    } catch (ex) {
      console.log(ex);
    }
  };

  const mintMax = async () => {
    if (account) {
      const responseUser = await axios.get(
        `${API_URL}/get-whitelistenable?address=${account}`
      );
      if (responseUser.data.openwhitelist) {
        if (responseUser.data.accountEnable) {
          notifymessage("You are on Whitelist Mint flow.", "success");
          onMetamaskSignClicked()
        } else {
          notifymessage("You are not on Whitelist right now. You are on Public Mint flow.", "success");
          mintNFT();
        }
      } else {
        notifymessage("Whitelist closed right now. You are on Public Mint flow.", "success");
        mintNFT();
      }
      // console.log("resu", responseUser.data.openWhitelist)
      // mintNFT();         
    } else {
      notifymessage("Please connect the wallet", "warning");
    }
  };

  const onMetamaskSignClicked = async () => {
    const message = ethers.utils.solidityKeccak256(
      ["address", "address", "address"],
      [Contract.address, Contract.owner, account]
    );
    try {
      const arrayifyMessage = ethers.utils.arrayify(message);
      const flatSignature = await library
        .getSigner()
        .signMessage(arrayifyMessage);
      console.log("signature", flatSignature)
      mintNFT(flatSignature);
    } catch (error) {
      notifymessage("Signature request failed", "error")
    }
  };

  const mintNFT = async (flatSignature) => {
    const chainId = 4; // 1: ethereum mainnet, 4: rinkeby
    console.log("current", window.ethereum.networkVersion)
    if (window.ethereum.networkVersion !== chainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4' }] // 0x4 is rinkeby. Ox1 is ethereum mainnet.
        });
      } catch (err) {
        notifymessage("Please check the Ethereum mainnet", "error");
        return false;
      }
    }
    const signer = new ethers.providers.Web3Provider(
      window.ethereum
    ).getSigner();
    const contract = new ethers.Contract(
      Contract.address,
      Contract.abi,
      signer
    );
    const isOpen = await contract.mintIsOpen();
    if (isOpen) {
      if (flatSignature) {
        let whitelistPriceHex = await contract._whitelistPrice();
        try {
          const options = {
            value: BigNumber.from(whitelistPriceHex).mul(quantity),
            from: account,
          };
          const res = await contract.mintWhiteList(
            quantity,
            flatSignature,
            options
          );
          notifymessage("Whitelist mint success!", "success")
        } catch (error) {
          notifymessage("Whitelist mint failed! Please check your wallet.", "error")
        }
      } else {
        let mintPriceHex = await contract._basePrice();
        try {
          const options = {
            value: BigNumber.from(mintPriceHex).mul(quantity),
            from: account,
          };
          const res = await contract.mint(
            quantity,
            options
          );
          notifymessage("Public mint success!", "success")
        } catch (error) {
          notifymessage("Public mint failed! Please check your wallet.", "error")
        }
      }
    } else {
      notifymessage("Mint is currently closed", "warning");
    }
    return false;
  };

  const notifymessage = (msg, type) => {
    toast(msg, {
      position: "top-center",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      type,
      theme: "dark"
    });
  }

  const increaseCount = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1)
    }
  }

  const decreaseCount = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const openEtherscan = () => {
    const etherscanURL = 'https://etherscan.io/address/0x4a02b39ae1e3559232f0a47c4191e56335e038b4';
    window.open(etherscanURL, '_blank');
  }

  const [MintImg, setMintImg] = useState(MintButtonOff);
  const [QuanImg, setQuanImg] = useState(QuanButtonOff);
  const [EtherscanImg, setEtherscanImg] = useState(EtherscanButtonOff);
  const [ConnectImg, setConnectImg] = useState(ConnectOff);
  const [DisconnectImg, setDisconnectImg] = useState(DisconnectOff);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="MintContainer">
      <div className="MintDiv" >
        <div className="MintBtnDiv" style={{ backgroundImage: `url(${MintImg})` }} onMouseEnter={() => setMintImg(MintButtonOn)} onMouseLeave={() => setMintImg(MintButtonOff)} onClick={mintMax} ></div>
        <div className="MintQuanDiv" style={{ backgroundImage: `url(${QuanImg})` }}  >
          <div className="quantity">
            <span className="minus" onClick={() => decreaseCount()} > - </span>
            <span className="quantitynumber">QUANTITY: {`${quantity}`}</span>
            <span className="plus" onClick={() => increaseCount()}> + </span>
          </div>
        </div>
        <div className="MintEtherscanDiv" style={{ backgroundImage: `url(${EtherscanImg})` }} onMouseEnter={() => setEtherscanImg(EtherscanButtonOn)} onMouseLeave={() => setEtherscanImg(EtherscanButtonOff)} onClick={() => openEtherscan()}></div>
      </div>
      {
        account ? <React.Fragment>
          <div className="ConnectDiv" style={{ backgroundImage: `url(${DisconnectImg})` }} onClick={onDisconnectClicked} onMouseEnter={() => setDisconnectImg(DisconnectOn)} onMouseLeave={() => setDisconnectImg(DisconnectOff)}>
          </div>
          <div className="AddressDiv">
            {account ? account.slice(0, 14) + "..." : ""}
          </div>
        </React.Fragment>
          : <div className="ConnectDiv" style={{ backgroundImage: `url(${ConnectImg})` }} onClick={onConnectClicked} onMouseEnter={() => setConnectImg(ConnectOn)} onMouseLeave={() => setConnectImg(ConnectOff)}>
          </div>
      }
      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
      />
    </div>
  )
};

function MintPage() {
  const getLibrary = (provider) => {
    const library = new Web3Provider(provider, 'any')
    library.pollingInterval = 15000
    return library
  }

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Content />
    </Web3ReactProvider>
  )
}

ReactDOM.render(
  <MintPage />,
  document.getElementById("root")
);