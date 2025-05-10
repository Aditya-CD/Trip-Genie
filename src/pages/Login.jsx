import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [walletAddress, setWalletAddress] = useState('');
  const [typedAddress, setTypedAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [startTyping, setStartTyping] = useState(false);
  const navigate = useNavigate();

  async function requestAccount() {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setWalletAddress(accounts[0]);
        localStorage.setItem("walletAddress", accounts[0]);
        setTimeout(() => {
          setIsLoading(false);
          setStartTyping(true);
        }, 2000);
      } catch (error) {
        console.error('MetaMask connection failed:', error);
        setIsLoading(false);
      }
    } else {
      alert('Please install MetaMask to use this travel planner.');
    }
  }

  useEffect(() => {
    if (startTyping && walletAddress) {
      let index = 0;
      const interval = setInterval(() => {
        setTypedAddress(walletAddress.slice(0, index + 1));
        index++;
        if (index === walletAddress.length) {
          clearInterval(interval);
          setTimeout(() => navigate('/dashboard'), 1000);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [startTyping, walletAddress, navigate]);

  return (
    <div className="w-screen min-h-screen bg-gradient-to-tr from-purple-900 via-black to-blue-900 text-white flex flex-col items-center justify-center">
      <div className="text-center space-y-6 max-w-xl px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          Trip <span className="text-yellow-400">Genie</span>
        </h1>
        <p className="text-lg text-gray-300">
          Start your personalized AI travel planning journey securely with Web3.
        </p>

        {!isLoading && !startTyping && (
          <button
            onClick={requestAccount}
            className="mt-4 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full transition duration-300 shadow-lg"
          >
            Login with MetaMask
          </button>
        )}

        {isLoading && (
          <div className="mt-6 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-yellow-300">Connecting...</span>
          </div>
        )}

        {startTyping && (
          <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md break-all text-sm">
            <span className="text-gray-400">Wallet Connected:</span>
            <p className="mt-1 text-green-400 font-mono">{typedAddress}</p>
          </div>
        )}
      </div>

      <footer className="absolute bottom-4 text-xs text-gray-500">
        Powered by BitCrew 🚀
      </footer>
    </div>
  );
}

export default Login;
