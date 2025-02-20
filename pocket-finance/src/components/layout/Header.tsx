'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <div className="flex flex-1">
          <Image
            src="/pocketLogo.png"
            alt="Pocket Finance"
            width={120}
            height={30}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            onClick={logout}
            className="text-sm font-medium hover:text-gray-600 dark:hover:text-gray-300"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
} 