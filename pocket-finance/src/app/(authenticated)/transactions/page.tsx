'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Clock, AlertCircle, X } from 'lucide-react';
import Image from 'next/image';

interface Transaction {
  date: string;
  paymentId: string;
  requestId?: string;
  client: string;
  amount: number;
  currency: string;
  status: 'completed' | 'paid' | 'pending' | 'overdue';
  dueDate?: string;
  fromAddress: string;
  toAddress: string;
  reason: string;
  network: string;

  clientDetails: {
    name: string;
    email: string;
    address: string;
  };
  businessDetails: {
    name: string;
    email: string;
    address: string;
  };
}

const getStatusStyle = (status: 'completed' | 'paid' | 'pending' | 'overdue') => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Updated stats cards
  const stats = [
    {
      title: 'Total Inflow',
      amount: 41,
      transactions: 22,
      icon: <ArrowUpRight className="w-4 h-4 text-green-500" />,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Total Outflow',
      amount: 49,
      transactions: 23,
      icon: <ArrowDownRight className="w-4 h-4 text-red-500" />,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Net Change',
      amount: -8,
      transactions: 45,
      icon: <RefreshCw className="w-4 h-4 text-blue-500" />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Invoices',
      pending: 5,
      overdue: 3,
      icon: (
        <div className="flex gap-1">
          <Clock className="w-4 h-4 text-yellow-500" />
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
      ),
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
  ];

  // Mock transactions data
  const mockTransactions: Transaction[] = [
    {
      date: '2024-02-20',
      paymentId: 'TX-001',
      client: 'Alice Johnson',
      amount: 500,
      currency: 'USDC',
      status: 'completed',
      fromAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      toAddress: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
      reason: 'Website Development',

      network: 'Solana',
      clientDetails: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        address: '123 Tech Street'
      },
      businessDetails: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        address: '123 Tech Street'
      }
    },
    {
      date: '2024-02-19',
      paymentId: 'TX-002',
      client: 'Bob Smith',
      amount: 300,
      currency: 'USDC',
      status: 'pending',
      dueDate: '2024-02-25',
      fromAddress: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
      toAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      reason: 'UI/UX Design',
      network: 'Solana',
      clientDetails: {
        name: 'Bob Smith',
        email: 'bob@example.com',
        address: '456 Design Ave'
      },
      businessDetails: {
        name: 'Bob Smith',
        email: 'bob@example.com',
        address: '456 Design Ave'
      }
    },
    // Add more mock transactions as needed
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Grid - Updated for better small screen display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`${stat.bgColor} p-4 rounded-lg shadow-sm border border-[#007BFF]/20`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{stat.title}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  {'amount' in stat ? (
                    <div className="flex items-center">
                      <Image
                        src="/usd-coin.svg"
                        alt="USDC"
                        width={35}
                        height={35}
                        className="mr-1 bg"
                      />
                      <p className={`text-xl font-semibold ${stat.textColor}`}>
                        {stat.amount}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">
                          {stat.pending} pending
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {stat.overdue} overdue
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {'transactions' in stat && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {stat.transactions} txns
                  </p>
                )}
              </div>
              <div className="p-2 rounded-full bg-white dark:bg-gray-800 shrink-0">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-[#007BFF]/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {mockTransactions.map((transaction) => (
                <tr 
                  key={transaction.paymentId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setIsModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transaction.paymentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-1">
                      <Image src="/usd-coin.svg" alt="USDC" width={25} height={25} />
                      {transaction.amount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {/* Modal Header with Amount and Status */}
            <div className="bg-[#007BFF] text-white p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium opacity-90">Amount</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl sm:text-3xl font-bold">{selectedTransaction?.amount} USDC</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 sm:px-3 text-xs sm:text-sm rounded-full font-medium ${getStatusStyle(selectedTransaction?.status || 'completed')}`}>
                      {selectedTransaction?.status?.toUpperCase()}
                    </span>
                    <p className="text-xs sm:text-sm mt-1 opacity-90">
                      {selectedTransaction?.date ? new Date(selectedTransaction.date).toLocaleString() : '-'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Payment Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Payment ID</span>
                      <span className="text-gray-900 dark:text-white font-mono text-right break-all ml-4">{selectedTransaction?.paymentId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Network</span>
                      <span className="text-gray-900 dark:text-white text-right">{selectedTransaction?.network}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Due Date</span>
                      <span className="text-gray-900 dark:text-white text-right">
                        {selectedTransaction?.dueDate ? new Date(selectedTransaction.dueDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">Transaction Purpose</h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                    <p className="text-sm text-gray-900 dark:text-white break-words">{selectedTransaction?.reason || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">Wallet Addresses</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">From</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                      {selectedTransaction?.fromAddress}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">To</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                      {selectedTransaction?.toAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Participant Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">Client Details</h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Name</span>
                      <span className="text-gray-900 dark:text-white break-words text-right ml-4">{selectedTransaction?.clientDetails.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Email</span>
                      <span className="text-gray-900 dark:text-white break-words text-right ml-4">{selectedTransaction?.clientDetails.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Address</span>
                      <span className="text-gray-900 dark:text-white break-words text-right ml-4">{selectedTransaction?.clientDetails.address}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">Business Details</h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Name</span>
                      <span className="text-gray-900 dark:text-white break-words text-right ml-4">{selectedTransaction?.businessDetails.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Email</span>
                      <span className="text-gray-900 dark:text-white break-words text-right ml-4">{selectedTransaction?.businessDetails.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Address</span>
                      <span className="text-gray-900 dark:text-white break-words text-right ml-4">{selectedTransaction?.businessDetails.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 