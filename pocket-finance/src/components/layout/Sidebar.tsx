'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { 
  MessageSquare, 
  Wallet, 
  User, 
  BarChart2,
  Menu,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

const navigation = [
  { name: 'Chats', href: '/chats', icon: MessageSquare },
  { name: 'Assets', href: '/assets', icon: Wallet },
  { name: 'Account', href: '/account', icon: User },
  { name: 'Transactions', href: '/transactions', icon: BarChart2 },
];

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile Menu Button - Only show on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-900 md:hidden"
      >
        <Menu size={24} className="text-[#222831] dark:text-white" />
      </button>

      <div className={`fixed inset-y-0 left-0 z-40 flex flex-col w-72 
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0`}
      >
        {/* Header with Logo */}
        <div className="flex items-center h-16 px-6 mt-4 mb-2">
          <Image
            src="/pocketLogo.png"
            alt="Pocket Finance"
            width={160}
            height={40}
            className="object-contain mx-auto dark:invert"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-gray-100 text-[#007BFF] dark:bg-gray-800'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#222831] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                      }`}
                  >
                    <Icon size={20} className={isActive ? 'text-[#007BFF]' : ''} />
                    <span className="ml-3 font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="px-4 py-6 space-y-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-[#222831] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="ml-3 font-medium">Theme</span>
          </button>

          {/* Logout Button */}
          <button 
            onClick={logout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="ml-3 font-medium">Log out</span>
          </button>

          {/* Social Links */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              <a
                href="https://twitter.com/pocketfinance"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-[#222831] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
              >
                <Image 
                  src="/x.svg"
                  alt="X (Twitter)"
                  width={20}
                  height={20}
                  className="dark:invert"
                />
                <span className="ml-3 font-medium">Follow us</span>
              </a>
              <a
                href="https://discord.gg/pocketfinance"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-[#222831] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
              >
                <Image 
                  src="/discord.svg"
                  alt="Discord"
                  width={20}
                  height={20}
                  className="dark:invert"
                />
                <span className="ml-3 font-medium">Join Discord</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 