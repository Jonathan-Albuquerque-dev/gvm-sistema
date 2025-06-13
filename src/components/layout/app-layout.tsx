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
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Home, FileText, Package, Users, BarChart3, Settings, LogOut, Building2 } from 'lucide-react'; // Added Building2 for brand

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/budgets', label: 'Orçamentos', icon: FileText },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
];

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-primary hover:text-primary-foreground hover:bg-primary rounded-full">
              <Building2 className="h-7 w-7" />
            </Button>
            <h1 className="text-xl font-semibold font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              BizManager
            </h1>
          </Link>
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      variant="default"
                      className="w-full justify-start"
                      asChild
                    >
                      <a>
                        <item.icon className="h-4 w-4 mr-2" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </ScrollArea>
        {/* Sidebar Footer Example - can be customized or removed */}
        {/*
        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Configurações</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton variant="ghost" className="w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive/90">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        */}
      </Sidebar>
      <SidebarInset className="flex-1">
        <main className="p-4 md:p-6 lg:p-8 h-full">
           <div className="md:hidden mb-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary hover:text-primary-foreground hover:bg-primary rounded-full">
                  <Building2 className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold font-headline">BizManager</h1>
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
