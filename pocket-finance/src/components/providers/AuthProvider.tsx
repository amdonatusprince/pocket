'use client';
import { PrivyProvider } from '@privy-io/react-auth';
import { PRIVY_CONFIG, PRIVY_APP_ID } from '@/lib/privy/config';
import { useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={PRIVY_CONFIG}
      // onSuccess={() => router.push('/dashboard')} 
      // onLogoutSuccess={() => router.push('/')}
    >
      {children}
    </PrivyProvider>
  );
} 