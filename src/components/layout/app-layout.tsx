
'use client'; 

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter, 
  SidebarSeparator
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Package, Users, BarChartBig, Calculator, Building, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation'; 
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budgets', label: 'Orçamentos', icon: FileText },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/employees', label: 'Funcionários', icon: Users }, // Make sure this matches the folder name
  { href: '/reports', label: 'Relatórios', icon: BarChartBig },
  { href: '/cost-control', label: 'Controle de Custos', icon: Calculator },
];

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname(); 
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logout realizado com sucesso!' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({ title: 'Erro ao fazer logout', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2"> 
            <Button variant="default" size="icon" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 rounded-md flex-shrink-0 h-10 w-10">
              <Building className="h-5 w-5" /> 
            </Button>
            <div className="group-data-[collapsible=icon]:hidden">
              <h1 className="text-lg font-semibold font-headline text-sidebar-foreground"> 
                GVM
              </h1>
              <p className="text-xs text-sidebar-foreground/80">Gestão Comercial</p>
            </div>
          </Link>
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    variant="default"
                    className="w-full justify-start"
                    asChild
                    isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href.length > 1 && pathname.substring(1).startsWith(item.href.substring(1)) )}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5 mr-3" /> 
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </ScrollArea>
        <SidebarSeparator />
        <SidebarFooter className="p-2">
           {user && (
             <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
                <p className="text-xs font-medium text-sidebar-foreground truncate" title={user.email || ''}>
                  {user.email}
                </p>
             </div>
           )}
          <SidebarMenuButton variant="default" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-3" />
            <span className="group-data-[collapsible=icon]:hidden">Sair</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex-1">
        <main className="p-4 md:p-6 lg:p-8 h-full">
           <div className="md:hidden mb-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
                <Button variant="default" size="icon" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 rounded-md h-8 w-8">
                  <Building className="h-4 w-4" /> 
                </Button>
                <h1 className="text-lg font-semibold font-headline">GVM</h1>
            </Link>
            <SidebarTrigger />
          </div>
          <div className="hidden md:flex items-center justify-end mb-4">
             <SidebarTrigger />
          </div>
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
