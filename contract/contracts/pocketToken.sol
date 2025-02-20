// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PocketToken is ERC20, ERC20Burnable, ERC20Permit, Ownable, Pausable {
    uint8 private immutable _decimals;
    uint256 public maxSupply;
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event MaxSupplyUpdated(uint256 newMaxSupply);

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalsValue,
        uint256 initialSupply,
        uint256 _maxSupply,
        address initialOwner
    ) ERC20(name, symbol) ERC20Permit(name) Ownable(initialOwner) {
        require(_maxSupply >= initialSupply, "Max supply must be >= initial supply");
        _decimals = decimalsValue;
        maxSupply = _maxSupply;
        _mint(initialOwner, initialSupply);
    }

    // Override decimals function
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // Mint new tokens (only owner)
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Would exceed max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    // Burn tokens
    function burn(uint256 amount) public virtual override {
        super.burn(amount);
        emit TokensBurned(_msgSender(), amount);
    }

    // Update max supply (only owner)
    function updateMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= totalSupply(), "New max supply below current supply");
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    // Pause token transfers (only owner)
    function pause() external onlyOwner {
        _pause();
    }

    // Unpause token transfers (only owner)
    function unpause() external onlyOwner {
        _unpause();
    }

    // Override transfer function to add pausable
    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, value);
    }
}