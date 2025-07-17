import './App.css';
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Wallet from '../artifacts/contracts/Wallet.sol/Wallet.json';
import HomePage from './HomePage';

const WalletAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

function App() {

  const [showHome, setShowHome] = useState(true);
  const [balance, setBalance] = useState(null);
  const [amountSend, setAmountSend] = useState('');
  const [amountWithdraw, setAmountWithdraw] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [account, setAccount] = useState('');

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const isMetaMaskAvailable = () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask non détecté');
      return false;
    }
    return true;
  };

  const getProvider = () => new ethers.BrowserProvider(window.ethereum);

  const getContract = useCallback(
    async (withSigner = false) => {
      const provider = getProvider();
      return withSigner
        ? new ethers.Contract(WalletAddress, Wallet.abi, await provider.getSigner())
        : new ethers.Contract(WalletAddress, Wallet.abi, provider);
    }, []
  );

  const getAccount = useCallback(async () => {
    if (!isMetaMaskAvailable()) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (err) {
      setError('Erreur de récupération du compte: ' + err.message);
    }
  }, []);

  const getBalance = useCallback(async () => {
    if (!isMetaMaskAvailable()) return;
    try {
      const contract = await getContract();
      const data = await contract.getBalance();
      setBalance(ethers.formatEther(data));
    } catch (err) {
      setError('Une erreur est survenue : ' + err.message);
    }
  }, [getContract]);

  // Forcer l’affichage de la homepage si pas de compte
  useEffect(() => {
    if (!account) {
      setShowHome(true);
    }
  }, [account]);

  useEffect(() => {
    getAccount();
    getBalance();
  }, [getAccount, getBalance]);

  useEffect(() => {
    let contract;

    const listenToEvents = async () => {
      try {
        contract = await getContract();

        contract.on("Deposit", (from, amount) => {
          if (from.toLowerCase() === account.toLowerCase()) {
            setSuccess(`Dépôt détecté : ${ethers.formatEther(amount)} ETH`);
            getBalance();
          }
        });

        contract.on("Withdraw", (to, amount) => {
          if (to.toLowerCase() === account.toLowerCase()) {
            setSuccess(`Retrait détecté : ${ethers.formatEther(amount)} ETH`);
            getBalance();
          }
        });
      } catch (err) {
        console.error("Erreur écoute des events :", err.message);
      }
    };

    listenToEvents();

    resetMessages();

    return () => {
      if (contract) {
        contract.removeAllListeners("Deposit");
        contract.removeAllListeners("Withdraw");
      }
    };
  }, [account, getContract, getBalance]);

  const transfer = async () => {
    if (!amountSend) return setError('Veuillez saisir un montant');
    if (!isMetaMaskAvailable()) return;

    resetMessages();
    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const nonce = await provider.getTransactionCount(await signer.getAddress(), "latest");

      const tx = await signer.sendTransaction({
        to: WalletAddress,
        value: ethers.parseEther(amountSend),
        nonce
      });

      await tx.wait();
      setAmountSend('');
      await getBalance();
      setSuccess('Votre argent a bien été transféré sur le portefeuille');
    } catch (err) {
      setError('Erreur lors du transfert : ' + (err?.message || err));
    }
  };

  const withdraw = async () => {
    if (!amountWithdraw) return setError('Veuillez saisir un montant');
    if (!isMetaMaskAvailable()) return;

    resetMessages();
    try {
      const contract = await getContract(true);
      const tx = await contract.withdrawMoney(account, ethers.parseEther(amountWithdraw));
      await tx.wait();
      setAmountWithdraw('');
      await getBalance();
      setSuccess('Votre argent a bien été retiré sur votre compte.');
    } catch (err) {
      if (err.message.includes("Pas assez de fonds")) {
        setError("Le contrat ne contient pas assez d'Ethers pour ce retrait.");
      } else {
        setError('Erreur lors du retrait : ' + err.message);
      }
    }
  };

  const connectWallet = async () => {
    resetMessages();
    if (!isMetaMaskAvailable()) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setShowHome(false);
        await getBalance();
      }
    } catch (err) {
      setError('Erreur de connexion MetaMask : ' + err.message);
    }
  };

  return (
    <div className="App">
      {/* Barre de navigation uniquement si showHome === false */}
      {!showHome && (
        <div className="nav">
          <button onClick={() => {
            if (account) {
              setShowHome(true); // Retour à l'accueil
            } else {
              connectWallet();
            }
          }}>
            Retour à l'Accueil
          </button>
        </div>
      )}

      {showHome ? (
        <HomePage
          connectWallet={connectWallet}
          error={error}
          success={success}
        />
      ) : (
        <div className='container'>
          <div className='logo'>
            <i className="fa-brands fa-ethereum"></i>
          </div>
          {account && <p className="account">Connecté : {account}</p>}

          {error && <p className='error'>{error}</p>}
          {success && <p className='success'>{success}</p>}

          <h2>
            {balance === null ? 'Chargement...' : parseFloat(balance).toFixed(4)}{' '}
            <span className="eth">ETH</span>
          </h2>

          <div className='wallet__flex'>
            <div className="walletG">
              <h3>Envoyer de l'Ether</h3>
              <input
                type="number"
                step="0.0001"
                min="0"
                placeholder='Montant en Ethers'
                value={amountSend}
                onChange={(e) => setAmountSend(e.target.value)}
              />
              <button onClick={transfer}>Envoyer</button>
            </div>

            <div className="walletD">
              <h3>Retirer de l'Ether</h3>
              <input
                type="number"
                step="0.0001"
                min="0"
                placeholder='Montant en Ethers'
                value={amountWithdraw}
                onChange={(e) => setAmountWithdraw(e.target.value)}
              />
              <button onClick={withdraw}>Retirer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
