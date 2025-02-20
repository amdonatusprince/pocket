'use client';

import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { Copy, Check, Coins } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useFundWallet } from '@privy-io/react-auth/solana';

export default function AssetsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const walletAddress = user?.wallet?.address || '';
  const shortAddress = walletAddress 
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '';

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Address copied to clipboard!', {
        duration: 2000,
        position: 'top-right',
        style: {
          background: '#222831',
          color: '#fff',
          borderRadius: '8px',
        },
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const { fundWallet } = useFundWallet({
    onUserExited: () => {
      toast.error('Account funding cancelled', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#222831',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    },
  });

  const handleFundWallet = async () => {
    if (!walletAddress) return;
    try {
      await fundWallet(walletAddress);
    } catch (error) {
      console.error('Error funding wallet:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Portfolio Header */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold dark:text-white text-center w-full md:text-left md:w-auto mt-8 md:mt-0">Assets</h1>
        {walletAddress && (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            <span className="text-sm font-mono dark:text-white">{shortAddress}</span>
            <button
              onClick={copyAddress}
              className="hover:text-[#007BFF] transition-colors"
            >
              {copied ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Copy size={16} className="dark:text-white" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tokens Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold dark:text-white">Tokens</h2>
          <button 
            onClick={handleFundWallet}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#007BFF] text-[#007BFF] hover:bg-[#007BFF] hover:text-white hover:border-white transition-colors whitespace-nowrap"
          >
            <Coins size={20} />
            <span className="hidden sm:inline">Fund Wallet</span>
            <span className="sm:hidden">Fund Wallet</span>
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-md border border-[#007BFF]/20">
          {/* Table Header - Hide on mobile */}
          <div className="hidden sm:grid grid-cols-4 gap-4 mb-4 text-sm font-bold text-gray-500 dark:text-gray-400">
            <div>Asset</div>
            <div>Balance</div>
            <div>Price</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Token Cards */}
          <div className="space-y-4">
            {/* SOL Card */}
            {/* <div className="sm:grid sm:grid-cols-4 sm:gap-4 items-center py-4 border-t border-gray-100 dark:border-gray-700">
              {/* Mobile: Stack vertically, Desktop: Grid */}
              {/* <div className="flex items-center justify-between sm:justify-start gap-2 mb-3 sm:mb-0">
                <div className="flex items-center gap-2">
                  <Image src="/sol-icon.svg" alt="SOL" width={24} height={24} className="dark:invert"/>
                  <span className="font-bold dark:text-white">SOL</span>
                </div>
                <div className="flex items-center gap-2 sm:hidden">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Balance:</span>
                  <span className="font-mono dark:text-white">0.00</span>
                </div>
              </div>
              
              <div className="hidden sm:block font-mono dark:text-white">0.00</div> */} 
              
              {/* <div className="flex justify-between sm:justify-start items-center mb-3 sm:mb-0">
                <span className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">Price:</span>
                <span className="font-mono dark:text-white">$204.46</span>
              </div> */}
              
              {/* <div className="flex justify-end gap-2">
                <button className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white hover:border-[#007BFF] hover:text-[#007BFF] transition-colors">
                  Sell
                </button>
                <button className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg bg-[#007BFF] text-white hover:bg-[#0056b3] transition-colors">
                  Buy
                </button>
              </div> */}
            {/* </div> */}

            {/* USDC Card - Same pattern */}
            <div className="sm:grid sm:grid-cols-4 sm:gap-4 items-center py-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between sm:justify-start gap-2 mb-3 sm:mb-0">
                <div className="flex items-center gap-2">
                  <Image src="/usdc-icon.svg" alt="USDC" width={24} height={24} className="dark:invert"/>
                  <span className="font-bold dark:text-white">USDC</span>
                </div>
                <div className="flex items-center gap-2 sm:hidden">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Balance:</span>
                  <span className="font-mono dark:text-white">0.00</span>
                </div>
              </div>
              
              <div className="hidden sm:block font-mono dark:text-white">0.00</div>
              
              <div className="flex justify-between sm:justify-start items-center mb-3 sm:mb-0">
                <span className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">Price:</span>
                <span className="font-mono dark:text-white">$1.00</span>
              </div>
              
              <div className="flex justify-end gap-2">
                <button className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white hover:border-[#007BFF] hover:text-[#007BFF] transition-colors">
                  Sell
                </button>
                <button className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg bg-[#007BFF] text-white hover:bg-[#0056b3] transition-colors">
                  Buy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 