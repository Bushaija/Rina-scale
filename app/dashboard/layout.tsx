import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
// import { Toaster } from '@/components/ui/sonner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Dashboard',
};

interface DashboardClientLayoutProps {
  children: ReactNode;
  defaultOpen: boolean | undefined;
}

function DashboardClientLayout({
  children,
  defaultOpen,
}: DashboardClientLayoutProps) {
  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {/* Global toast notifications for all dashboard routes */}
          {/* <Toaster richColors closeButton position="bottom-right" /> */}
          <div className='p-4'>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to sign-in if not authenticated
  if (!session) {
    redirect('/sign-in');
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';

  return (
    <DashboardClientLayout defaultOpen={defaultOpen}>
      {children}
    </DashboardClientLayout>
  );
}