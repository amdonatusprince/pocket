// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PocketFiTokenSwap is Ownable, ReentrancyGuard {
    struct TokenInfo {
        IERC20 token;
        uint256 swapRate;
    }
    
    mapping(address => TokenInfo) public supportedTokens;
    address[] public tokenAddresses;
    
    event SwapNativeForToken(
        address indexed user,
        address indexed token,
        uint256 nativeAmount,
        uint256 tokenAmount
    );
    
    event SwapTokenForNative(
        address indexed user,
        address indexed token,
        uint256 tokenAmount,
        uint256 nativeAmount
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    // Add or update supported token
    function addToken(address _token, uint256 _swapRate) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_swapRate > 0, "Invalid swap rate");
        
        if (supportedTokens[_token].swapRate == 0) {
            tokenAddresses.push(_token);
        }
        
        supportedTokens[_token] = TokenInfo({
            token: IERC20(_token),
            swapRate: _swapRate
        });
    }

    // Swap native token for specific ERC20 token
    function swapNativeForToken(address tokenAddress) external payable nonReentrant {
        require(supportedTokens[tokenAddress].swapRate > 0, "Token not supported");
        require(msg.value > 0, "Must send native token");
        
        TokenInfo storage tokenInfo = supportedTokens[tokenAddress];
        uint256 tokenAmount = (msg.value * tokenInfo.swapRate) / 1e18;
        
        require(tokenAmount > 0, "Calculated amount too small");
        require(
            tokenInfo.token.balanceOf(address(this)) >= tokenAmount,
            "Insufficient token balance in contract"
        );
        
        require(
            tokenInfo.token.transfer(msg.sender, tokenAmount),
            "Token transfer failed"
        );
        
        emit SwapNativeForToken(msg.sender, tokenAddress, msg.value, tokenAmount);
    }
    
    // Swap specific ERC20 token for native token
    function swapTokenForNative(address tokenAddress, uint256 tokenAmount) external nonReentrant {
        require(supportedTokens[tokenAddress].swapRate > 0, "Token not supported");
        require(tokenAmount > 0, "Amount must be greater than 0");
        
        TokenInfo storage tokenInfo = supportedTokens[tokenAddress];
        uint256 nativeAmount = (tokenAmount * 1e18) / tokenInfo.swapRate;
        
        require(nativeAmount > 0, "Calculated amount too small");
        require(
            address(this).balance >= nativeAmount,
            "Insufficient native token balance in contract"
        );
        
        require(
            tokenInfo.token.transferFrom(msg.sender, address(this), tokenAmount),
            "Token transfer failed"
        );
        
        (bool sent, ) = payable(msg.sender).call{value: nativeAmount}("");
        require(sent, "Native token transfer failed");
        
        emit SwapTokenForNative(msg.sender, tokenAddress, tokenAmount, nativeAmount);
    }

    // Update swap rate for a specific token
    function setSwapRate(address tokenAddress, uint256 _newRate) external onlyOwner {
        require(supportedTokens[tokenAddress].swapRate > 0, "Token not supported");
        require(_newRate > 0, "Invalid swap rate");
        supportedTokens[tokenAddress].swapRate = _newRate;
    }

    // Withdraw specific ERC20 tokens
    function withdrawToken(address tokenAddress, uint256 amount) external onlyOwner {
        require(supportedTokens[tokenAddress].swapRate > 0, "Token not supported");
        require(
            supportedTokens[tokenAddress].token.transfer(msg.sender, amount),
            "Token transfer failed"
        );
    }

    // Withdraw native tokens
    function withdrawNative(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Native token transfer failed");
    }

    // Emergency withdraw all
    function emergencyWithdraw() external onlyOwner {
        // Withdraw all native tokens
        uint256 nativeBalance = address(this).balance;
        if (nativeBalance > 0) {
            (bool sent, ) = payable(msg.sender).call{value: nativeBalance}("");
            require(sent, "Native token transfer failed");
        }
        
        // Withdraw all tokens
        for (uint i = 0; i < tokenAddresses.length; i++) {
            address tokenAddress = tokenAddresses[i];
            uint256 tokenBalance = supportedTokens[tokenAddress].token.balanceOf(address(this));
            if (tokenBalance > 0) {
                require(supportedTokens[tokenAddress].token.transfer(msg.sender, tokenBalance), "Token transfer failed");
            }
        }
    }

    // To receive native tokens
    receive() external payable {}
    fallback() external payable {}
}