// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract SPocketToken is ERC20 {
    address public stakingContract;

    constructor() ERC20("Staked POCKET", "sPOCKET") {
        stakingContract = msg.sender;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can mint");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can burn");
        _burn(from, amount);
    }
}

contract PocketFiStaking is Ownable, ReentrancyGuard, Pausable {
    SPocketToken public sPocket;
    
    uint256 public constant YEAR_IN_SECONDS = 365 days;
    uint256 public totalStaked;
    uint256 public rewardRate = 2100; // 21% APR = 2100 basis points
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public minStakeAmount = 0.1 ether;
    uint256 public maxStakeAmount = 1000 ether;
    uint256 public totalRewardsDistributed;
    
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public userStakeTime;
    mapping(address => uint256) public lastRewardCalculationTime;
    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);
    event StakeLimitsUpdated(uint256 newMin, uint256 newMax);

    constructor() Ownable(msg.sender) {
        sPocket = new SPocketToken();
        lastUpdateTime = block.timestamp;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
            lastRewardCalculationTime[account] = block.timestamp;
        }
        _;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        
        uint256 timeDiff = block.timestamp - lastUpdateTime;
        uint256 annualReward = (totalStaked * rewardRate) / 10000; // Annual reward based on APR
        uint256 rewardForPeriod = (annualReward * timeDiff) / YEAR_IN_SECONDS;
        return rewardPerTokenStored + ((rewardForPeriod * 1e18) / totalStaked);
    }

    function earned(address account) public view returns (uint256) {
        uint256 currentBalance = sPocket.balanceOf(account);
        if (currentBalance == 0) return 0;
        
        uint256 timeSinceLastCalculation = block.timestamp - lastRewardCalculationTime[account];
        uint256 annualReward = (currentBalance * rewardRate) / 10000;
        uint256 pendingRewards = (annualReward * timeSinceLastCalculation) / YEAR_IN_SECONDS;
        
        return rewards[account] + pendingRewards;
    }

    function getAPR() external view returns (uint256) {
        return rewardRate;
    }

    function getSPocketBalance(address user) external view returns (uint256) {
        return sPocket.balanceOf(user);
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        require(_rewardRate <= 10000, "Rate too high"); // Max 100%
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    function setStakeLimits(uint256 _minAmount, uint256 _maxAmount) external onlyOwner {
        require(_minAmount < _maxAmount, "Invalid limits");
        minStakeAmount = _minAmount;
        maxStakeAmount = _maxAmount;
        emit StakeLimitsUpdated(_minAmount, _maxAmount);
    }

    function stake(uint256 amount) external payable nonReentrant whenNotPaused updateReward(msg.sender) {
        require(msg.value == amount, "Amount mismatch");
        require(amount >= minStakeAmount, "Below minimum stake amount");
        require(amount <= maxStakeAmount, "Exceeds maximum stake amount");
        require(amount > 0, "Cannot stake 0");
        
        totalStaked += amount;
        userStakeTime[msg.sender] = block.timestamp;
        lastRewardCalculationTime[msg.sender] = block.timestamp;
        
        // Mint sPOCKET tokens 1:1 with staked amount
        sPocket.mint(msg.sender, amount);
        
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(amount >= minStakeAmount, "Below minimum withdraw amount");
        require(sPocket.balanceOf(msg.sender) >= amount, "Not enough staked tokens");
        
        // Claim any pending rewards before withdrawal
        _claimReward();
        
        totalStaked -= amount;
        
        // Burn sPOCKET tokens
        sPocket.burn(msg.sender, amount);
        
        // Transfer S tokens back to user
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        _claimReward();
    }

    function _claimReward() internal {
        uint256 reward = earned(msg.sender);
        require(reward > 0, "No rewards to claim");
        
        rewards[msg.sender] = 0;
        lastRewardCalculationTime[msg.sender] = block.timestamp;
        totalRewardsDistributed += reward;
        
        // Mint reward in sPOCKET tokens
        sPocket.mint(msg.sender, reward);
        
        emit RewardPaid(msg.sender, reward);
    }

    function getUserStakeInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 stakeTimestamp,
        uint256 lastRewardTime
    ) {
        stakedAmount = sPocket.balanceOf(user);
        pendingRewards = earned(user);
        stakeTimestamp = userStakeTime[user];
        lastRewardTime = lastRewardCalculationTime[user];
    }

    function getRewardDebugInfo(address user) external view returns (
        uint256 currentBalance,
        uint256 timeSinceLastReward,
        uint256 annualRewardRate,
        uint256 pendingRewards,
        uint256 totalUserRewards
    ) {
        currentBalance = sPocket.balanceOf(user);
        timeSinceLastReward = block.timestamp - lastRewardCalculationTime[user];
        annualRewardRate = (currentBalance * rewardRate) / 10000;
        pendingRewards = earned(user);
        totalUserRewards = rewards[user];
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}