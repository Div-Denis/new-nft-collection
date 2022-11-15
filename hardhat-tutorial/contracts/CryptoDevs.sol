//SPDX-License-Identifier:MIT
pragma solidity ^0.8.4;

import "./IWhitelist.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//Crypto Devs Contract Address 0xbDfE8fe61E7776545fb337A5A662c228A86d3177

contract CryptoDevs is ERC721Enumerable, Ownable {
    //baseURI和tokenId的串联
    string _baseTokenURI;
    
    //mint一个NFT的价格
    uint256 public _price = 0.01 ether;
    
    //用于在紧急情况下暂停合约
    bool public _paused;
    
    //NFT最大发行量
    uint256 public maxTokenIds = 20;
    
    //铸造的tokenID 总数
    uint256 public tokenIds;
    
    //白名单合约的实例
    IWhitelist whitelist;
    
    //跟踪预售是否开始
    bool public presaleStarted;
    
    //预售何时结束的时间戳
    uint256 public presaleEnded;
    
    //合约不紧急暂停的修饰符
    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paysed");
        _;
    }
    
    /**
     * 构造函数，初始化Token的名称和符号
     * 设置集合的baseURI ,还实例化白名单的接口
     */
    constructor(string memory baseURI, address whitelistContract) ERC721 ("Crypto Devs", "CD"){
        _baseTokenURI = baseURI;
         whitelist = IWhitelist(whitelistContract);
    }
    
    /**
     * 开始预售，开始对被白名单列入的地址开始预售
     */
    function startPresale() public onlyOwner {
        //将是否开始预售设置为true
        presaleStarted = true;
        //将预售结束时间设置为当前时间戳的5分钟后
        //solidity对时间戳(seconds, mimutes, hours, days, yaers)
        presaleEnded = block.timestamp + 5 minutes;
    }
    
    /**
     * 预售mint, 允许白名单用户在预售期间铸造一个NFT
     */
    function presaleMint() public payable onlyWhenNotPaused {
        //检查预售时间是否开始并且是否还没结束
        require(presaleStarted && block.timestamp < presaleEnded, "presale is not running");
        //检查用户地址是否在白名单上
        require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelist");
        //检查发行量是否已经达到了最大值
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        //检查铸造的金额是否足够
        require(msg.value >= _price, "Ether sent is not correct");
        //NFT的总数+1
        tokenIds += 1;
        //开始铸造
        //_faseMint是mint的更安全版本，因为它确保如果铸造的低画质是合约，那么它知道如何处理ERC721代币。
        //如果不是合约，它的工作方式与_mint一样
        _safeMint(msg.sender, tokenIds);
    }
    
    /**
     * 公开mint 在预售结束后允许用户铸造一个NFT
     */
    function mint() public payable onlyWhenNotPaused {
        //检查预售是否开始并且是否已经结束
        require(presaleStarted && block.timestamp >= presaleEnded, "Presale is not running");
        //检查发行量是否已经达到最大值
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        //检查用户铸造的金额是否足够
        require(msg.value >= _price, "Ether sent is not correct");
        //NFT总数加1
        tokenIds += 1;
        //开始铸造
        _safeMint(msg.sender, tokenIds);
    }
    
    /**
     * 覆盖Openzppelin的ERC721的实现，
     * 默认情况下baseURI返回一个空字符串
     */
    function _baseURI() internal view virtual override returns(string memory) {
        return _baseTokenURI;
    }
    
    /**
     * 设置暂停 使合约暂停或许取消暂停
     */
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }
    
    /**
     * 提款，合约拥有者将合约内的所有以太坊提取出来
     */
    function withdraw() public onlyOwner {
        //实例合约拥有者
        address _owner = owner();
        //设置金额为该合约的余额
        uint256 amount = address(this).balance;
        //将金额发送给合约拥有者
        (bool sent, ) = _owner.call{value:amount}("");
        //如果失败，发送信息
        require(sent, "Failed to send Ether");
    }
    
    //接收以太币的功能，mas.data为空
    receive() external payable{}
    //回滚，接收以太的功能，mas.data不为空
    fallback() external payable{}

}