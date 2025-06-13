
'use client';
import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useRequireAuth, AuthProvider } from '@/hooks/useAuth'; 
import { Skeleton } from '@/components/ui/skeleton';

function AuthenticatedCoreLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAuth handles redirection
  }

  return <AppLayout>{children}</AppLayout>;
}


export default function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedCoreLayout>{children}</AuthenticatedCoreLayout>
    </AuthProvider>
  );
}
