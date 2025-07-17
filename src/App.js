import './App.css';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Wallet from './artifacts/contracts/Wallet.sol/Wallet.json';

const WalletAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

function App() {

  const [balance, setBalance] = useState(0);
  const [amountSend, setAmountSend] = useState('');
  const [amountWithdraw, setAmountWithdraw] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [account, setAccount] = useState('');

  useEffect(() => {
    // on charge les infos dès que le composant est monté
    getBalance();
    getAccount();
  }, []);

  async function getAccount() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (err) {
        setError('Erreur de récupération du compte: ' + err.message);
      }
    } else {
      setError('MetaMask non détecté');
    }
  }

  async function getBalance() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const contract = await getContract();
        const data = await contract.getBalance();
        setBalance(ethers.formatEther(data));
        setError('');
      } catch (err) {
        setError('Une erreur est survenue : ' + err.message);
      }
    } else {
      setError('MetaMask non détecté');
    }
  }

  async function getContract(signer = false) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const instance = signer
      ? new ethers.Contract(WalletAddress, Wallet.abi, await provider.getSigner())
      : new ethers.Contract(WalletAddress, Wallet.abi, provider);
    return instance;
  }

  async function transfer() {
    if (!amountSend) {
      setError('Veuillez saisir un montant');
      return;
    }
    setError('');
    setSuccess('');
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        // ✅ On récupère le nonce ici
        const nonce = await provider.getTransactionCount(address, "latest");
        console.log("Nonce:", nonce);

        const tx = await signer.sendTransaction({
          to: WalletAddress,
          value: ethers.parseEther(amountSend),
          nonce: nonce, // ← tu peux aussi l’omettre, mais ici on le fixe pour tester
        });

        await tx.wait();
        setAmountSend('');
        getBalance();
        setSuccess('Votre argent a bien été transféré sur le portefeuille');
      } catch (err) {
        console.error(err);
        setError('Une erreur est survenue lors du transfert : ' + (err?.message || err));
      }
    } else {
      setError('MetaMask non détecté');
    }
  }


  async function withdraw() {
    if (!amountWithdraw) {
      setError('Veuillez saisir un montant');
      return;
    }
    setError('');
    setSuccess('');

    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = await getContract(true);

        const tx = await contract.withdrawMoney(account, ethers.parseEther(amountWithdraw));
        await tx.wait();

        setAmountWithdraw('');
        getBalance();
        setSuccess('Votre argent a bien été retiré sur votre compte.');
      } catch (err) {
        if (err.message.includes("Pas assez de fonds")) {
          setError("Le contrat ne contient pas assez d'Ethers pour ce retrait.");
        } else {
          setError('Une erreur est survenue lors du retrait : ' + err.message);
        }
      }
    } else {
      setError('MetaMask non détecté');
    }
  }


  function changeAmountSend(e) {
    setAmountSend(e.target.value);
  }

  function changeAmountWithdraw(e) {
    setAmountWithdraw(e.target.value);
  }

  return (
    <div className="App">
      <div className='container'>
        <div className='logo'>
          <i className="fa-brands fa-ethereum"></i>
        </div>
        {error && <p className='error'>{error}</p>}
        {success && <p className='success'>{success}</p>}
        <h2>{balance} <span className='eth'>ETH</span></h2>
        <div className='wallet__flex'>
          <div className="walletG">
            <h3>Envoyer de l'Ether</h3>
            <input
              type="text"
              placeholder='Montant en Ethers'
              value={amountSend}
              onChange={changeAmountSend}
            />
            <button onClick={transfer}>Envoyer</button>
          </div>

          <div className="walletD">
            <h3>Retirer de l'Ether</h3>
            <input
              type="text"
              placeholder='Montant en Ethers'
              value={amountWithdraw}
              onChange={changeAmountWithdraw}
            />
            <button onClick={withdraw}>Retirer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
