'use client';

import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WelcomePage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center -mt-20 p-4 relative bg-gray-50">
      
      {/* Main content */}
      <div className="text-center z-10">
        <Image
          src="/pocketLogo.png"
          alt="Pocket Finance Logo"
          width={200}
          height={60}
          className="mx-auto mb-2"
        />
        <h1 className="text-6xl font-bold mb-4">
          One app, all<br />
          things payment
        </h1>
        <p className="text-lg mb-8 text-gray-600">
        From easy Single and Batch payments, to Invoices, <br />
        Payroll management, DeFi and more. 
        </p>
        <button 
          onClick={login}
          className="bg-black text-white font-medium py-3 px-6 rounded-full hover:opacity-90 transition-opacity"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
