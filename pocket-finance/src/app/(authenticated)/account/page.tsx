'use client';

import { useAuth } from '@/hooks/useAuth';
import { useLinkAccount } from '@privy-io/react-auth';
import Image from 'next/image';
import { Mail, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AccountPage() {
  const { user } = useAuth();
  const { 
    linkTwitter,
    linkGoogle,
    linkEmail,
    linkPhone,
    linkFarcaster
  } = useLinkAccount({
    onSuccess: () => {
      toast.success('Account connected successfully!', {
        position: 'top-right',
        style: {
          background: '#222831',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    },
    onError: (error) => {
      toast.error(error || 'Failed to connect account', {
        position: 'top-right',
        style: {
          background: '#222831',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    }
  });

  const connectedWallets = user?.wallet?.address || '';
  const connectedAccounts = user?.linkedAccounts || [];

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Account Header - centered on mobile */}
      <h1 className="text-2xl font-bold mb-6 mt-8 md:mt-0 dark:text-white text-center md:text-left">
        Account
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-md border border-[#007BFF]/20">
        <div className="space-y-6">
          {/* User Info */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-300 mb-2">User Info</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold break-all dark:text-white">Joined on {user?.createdAt?.toLocaleDateString()}</p>
            </div>
          </div>

          {/* User ID */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-300 mb-2">User ID</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold break-all dark:text-white">
                {user?.id?.replace('did:privy:', '')}
              </p>
            </div>
          </div>

          {/* Connected Wallets */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-300 mb-2">Connected Wallets</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold break-all dark:text-white">{connectedWallets}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Connected Accounts</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-[#007BFF]/20">
        <div className="space-y-4">
          {/* X (Twitter) */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Image
                src="/x-icon.svg"
                alt="X"
                width={24}
                height={24}
              />
              <div>
                <p className="font-bold dark:text-gray-300">X (formerly Twitter)</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {connectedAccounts.some(account => account.type === 'twitter_oauth') ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            {!connectedAccounts.some(account => account.type === 'twitter_oauth') && (
              <button 
                onClick={() => linkTwitter()}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white hover:border-[#007BFF] hover:text-[#007BFF] transition-colors"
              >
                Connect
              </button>
            )}
          </div>

          {/* Google */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Image
                src="/google.png"
                alt="Google"
                width={24}
                height={24}
              />
              <div>
                <p className="font-bold dark:text-gray-300">Google</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {connectedAccounts.some(account => account.type === 'google_oauth') ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            {!connectedAccounts.some(account => account.type === 'google_oauth') && (
              <button 
                onClick={() => linkGoogle()}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white hover:border-[#007BFF] hover:text-[#007BFF] transition-colors"
              >
                Connect
              </button>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6" />
              <div>
                <p className="font-bold dark:text-gray-300">Email</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {connectedAccounts.some(account => account.type === 'email') ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            {!connectedAccounts.some(account => account.type === 'email') && (
              <button 
                onClick={() => linkEmail()}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white hover:border-[#007BFF] hover:text-[#007BFF] transition-colors"
              >
                Connect
              </button>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6" />
              <div>
                <p className="font-bold dark:text-gray-300">Phone</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {connectedAccounts.some(account => account.type === 'phone') ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            {!connectedAccounts.some(account => account.type === 'phone') && (
              <button 
                onClick={() => linkPhone()}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white hover:border-[#007BFF] hover:text-[#007BFF] transition-colors"
              >
                Connect
              </button>
            )}
          </div>

          {/* Farcaster */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Image
                src="/farcaster-icon.svg"
                alt="Farcaster"
                width={24}
                height={24}
                className="text-[#007BFF]"
              />
              <div>
                <p className="font-bold dark:text-gray-300">Farcaster</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {connectedAccounts.some(account => account.type === 'farcaster') ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            {!connectedAccounts.some(account => account.type === 'farcaster') && (
              <button 
                onClick={() => linkFarcaster()}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white hover:border-[#007BFF] hover:text-[#007BFF] transition-colors"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 