// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
//import "hardhat/console.sol";

contract Wallet {
    mapping(address => uint) Wallets;

    event Deposit(address indexed from, uint amount);
    event Withdraw(address indexed to, uint amount);

    receive() external payable {
        Wallets[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    fallback() external payable {}

    function withdrawMoney(address payable _to, uint _amount) external {
        require(
            _to == msg.sender,
            "Retrait autorise uniquement vers votre propre adresse"
        );
        require(
            _amount <= Wallets[msg.sender],
            "Pas assez de fonds dans le compte"
        );
        unchecked {
            Wallets[msg.sender] -= _amount;
        }
        _to.transfer(_amount);
        emit Withdraw(_to, _amount);
    }

    function getBalance() external view returns (uint) {
        return Wallets[msg.sender];
    }

    function getBalanceOf(address user) external view returns (uint) {
        return Wallets[user];
    }
}
