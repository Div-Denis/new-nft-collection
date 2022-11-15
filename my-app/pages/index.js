import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal"
import { Contract, providers, utils } from 'ethers'
import { abi, NFT_CONTRACT_ADDRESS } from '../constants'

export default function Home() {
  //用户钱包是否连接
  const [walletConnected, setWalletConnected] = useState(false);
  //预售是否开始
  const [presaleStarted, setPresaleStarted] = useState(false);
  //预售是否结束
  const [presaleEnded, setPresaleEnded] = useState(false);
  //加载状态
  const [loading,setLoading] = useState(false);
  //当前连接的钱包是否是合约的所有者
  const [isOwner, setIsOwner] = useState(false);
  //已经铸造的NFT数量
  const [tokenIdMinted, setTokenIdMinted] = useState("0");
  //创建对Web3模式(用于连接到钱包)的引用，只要页面打开，该引用就会持续存在
  const web3ModalRef = useRef();  

  /**
   * 在预售期铸造NFT
   */
  const presaleMint = async () => {
    try {
      //这里需要一个签名者
      const signer  = await getProviderOrSignner(true);
      //创建与签名者的合约新实例。该实例允许更新方法
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );

      //从合约中调用预售铸造币长，只有列入白名单的地址才能铸造
      const tx = await nftContract.presaleMint({
        //价值是0.01个以太币
        //我们使用以太坊的utils库将0.01字符串解析为ethers.js
        value:utils.parseEther("0.01"),
      });

      setLoading(true);
      //等待交易被挖掘
      await tx.wait();
      setLoading(false);
      window.alert("Your successfully minted a Crypto Devs!");

    } catch (error) {
      console.log(error);
    }
  };

  /**
   * 预售期结束后铸造NFT
   */
  const publicMint = async () => {
    try {
      const signer = await getProviderOrSignner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      const tx = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Your successfully minted a Crypto Devs!")
    } catch (error) {
      console.log(error);
    }
  };
  
  /**
   * 开始预售期
   */
  const startPresale = async () => {
    try {
      const signer = await getProviderOrSignner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.startPresale();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      //将预售开始设置为true
      await checkIfPresaleStarted();
    } catch (error) {
      console.log(error);
    }
  };
  
  /**
   * 检查预售期是否开始
   */
  const checkIfPresaleStarted = async () => {
   try {
    //无需签名，只从区块链中读取状态
    const provider = await getProviderOrSignner();
    //使用提供者连接合约，因此只有对合约的只读访问权
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
    //从合约中调用presaleStarted
    const _presaleStarted = await nftContract.presaleStarted();
    //如果为true，调用拥有者
    if(!_presaleStarted){
      await getOwner();
    }
    setPresaleStarted(_presaleStarted);
    return _presaleStarted;
   } catch (error) {
    console.log(error);
    return false;
   }
  };
  
  /**
   * 检查预售期是否结束
   */
  const checkIfPresaleEnded = async () => {
     try {
      const provider = await getProviderOrSignner();
     const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);

     const _presaleEnded = await nftContract.presaleEnded();
     
     //_presaleEnded是一个大数，所以我们使用lt(小于函数)而不是用'<'小于号
     //Date.now()/1000返回当前时间(以秒为单位)
     //我们比较_presaleEnded时间戳是否小于当前时间，如果是，意味者预售已经结束
     const hasEnded = _presaleEnded.lt(Math.floor(Date.now()/1000));
     if(hasEnded){
      setPresaleEnded(true);
     }else {
      setPresaleEnded(false);
     }
     return hasEnded;
     } catch (error) {
      console.log(error);
      return false;
     }
  };
  
  /**
   * 调用合约的所有者
   */
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSignner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
      const _owner = await nftContract.owner();
      //现在将让签名者提供当前连接的钱包账户的地址
      const signer = await getProviderOrSignner(true);
      //获取连接到钱包的签名者关联的地址
      const address = await signer.getAddress();
      //检查此地址是否与拥有者地址一致
      if(address.toLowerCase() === _owner.toLowerCase()){
        setIsOwner(true);
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  /**
   * 获取已铸造的tokenId数量
   */
  const getTokenIdsMinted = async () =>{
    try {
      const provider = await getProviderOrSignner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
      const _tokenIds = await nftContract.tokenIds();
      setTokenIdMinted(_tokenIds.toString());
    } catch (error) {
      console.log(error);
    }
  };
 
  /**
   * 连接钱包
   */
  const connectWallet = async () => {
    try {
      await getProviderOrSignner();
      setWalletConnected(true);
    } catch (error) {
      console.log(error);
    }
  };
  
  /**
   * 函数返回提供者和签名者对象
   * @param needSigner 如果需要签名为true，默认为false
   */
  const getProviderOrSignner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const {chainId} = await web3Provider.getNetwork();
    if(chainId !== 5) {
      window.alert("Change the network Goerli");
      throw new Error("Change the network Goerli");
    } 

    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };
  
  /**
   * 用于对网站状态的变化做出反应
   */
  useEffect(()=>{
    //检查是否连接钱包
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      
      //检查预售是否已开始和结束
      const _presaleStarted = checkIfPresaleStarted();
      if(_presaleStarted){
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();
      
      //设置每5秒调用一次的间隔，以检查预售是否已结束
      const presaleEndedInterval  = setInterval(async function(){
        const _presaleStarted = await checkIfPresaleStarted();
        if(_presaleStarted){
          const _presaleEnded = await checkIfPresaleEnded();
          if(_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5*1000);
      
      //设置间隔以获取每5秒铸造的代币ID 数量
      setInterval(async function() {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  },[walletConnected]);
  
  /**
   * 根据dApp的状态返回一个按钮
   */
  const renderButton = () =>{
    //如果钱包没连接，请返回一个按钮，允许他们连接他们的钱包
    if(!walletConnected){
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
    
    //如果我们当前正在等待某些内容。请返回一个加载按钮
    if(loading) {
      return <button className={styles.button}>Loading...</button>;
    }
    
    //如果已连接用户是所有者，并且预售尚未开始，请允许他们开始预售
    if(isOwner && !presaleStarted){
      return(
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }
    
    //如果已连接的用户不是所有者，但预售尚未开始，请告诉他们
    if(!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started!</div>
        </div>
      );
    }
    
    //如果预售已经开始但尚未结束，请允许在预售期铸造
    if(presaleStarted && !presaleEnded){
      return(
        <div>
          <div className={styles.description}>
            Presale has started!! If your address is whitelisted , Mint a Crypto Dev 😊
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint🚀
          </button>
        </div>
      );
    }
    
    //如果预售开始和结束，则公开铸造的时间
    if(presaleStarted && presaleEnded){
      return(
        <button className={styles.button} onClick={publicMint}>
          Public Mint🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name='descpriction' content='Whitelist-Dapp'/>
        <link rel='icon' href='/favicon.ico'/>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Ctypt Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.jpg"/>
        </div>
      </div>

      <footer className={styles.footer}>
        Made whit by Crypto Devs
      </footer>
    </div>
  )
}
