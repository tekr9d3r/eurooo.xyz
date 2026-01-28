import { useConfig } from 'wagmi';
import { ReactNode } from 'react';

interface WagmiReadyGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Guards children from rendering until wagmi config is ready.
 * Prevents "Cannot read properties of null (reading 'getSnapshot')" errors
 * that occur when wagmi hooks are called before the provider is fully initialized.
 */
export function WagmiReadyGuard({ children, fallback }: WagmiReadyGuardProps) {
  try {
    const config = useConfig();
    
    if (!config) {
      return fallback ? <>{fallback}</> : null;
    }
    
    return <>{children}</>;
  } catch {
    // If useConfig throws, the provider isn't ready yet
    return fallback ? <>{fallback}</> : null;
  }
}
