import "./HomePage.css";

export default function HomePage({ connectWallet }) {
    return (
        <main className="landing">
            <div className="landing__content">
                <h1 className="landing__title">Bienvenue sur Ma dApp Ethereum</h1>
                <p className="landing__text">
                    Déposez et retirez des ETH de manière sécurisée grâce à un smart contract.
                </p>
                <p className="landing__text">
                    Connectez votre portefeuille pour commencer à interagir avec la blockchain.
                </p>
                <button className="landing__button" onClick={connectWallet}>
                    <i className="fa-brands fa-ethereum"></i> Commencer
                </button>
                <footer className="landing__footer">
                    © {new Date().getFullYear()} Mon Projet dApp
                </footer>
            </div>
            <div className="landing__image">
                <div className="logo">
                    <i className="fa-brands fa-ethereum" style={{ fontSize: "80px", color: "#3c3cce" }}></i>
                </div>
            </div>
        </main>
    );
}

