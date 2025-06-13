
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
import { LayoutDashboard, FileText, Package, Users, BarChartBig, Calculator, Building } from 'lucide-react'; // Updated icons

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, // Icon updated
  { href: '/budgets', label: 'Orçamentos', icon: FileText },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/reports', label: 'Relatórios', icon: BarChartBig }, // Icon updated
  { href: '/cost-control', label: 'Controle de Custos', icon: Calculator }, // New item
];

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-start gap-2">
            <Button variant="ghost" size="icon" className="text-primary hover:text-primary-foreground hover:bg-primary rounded-md flex-shrink-0 h-10 w-10">
              <Building className="h-6 w-6" />
            </Button>
            <div className="group-data-[collapsible=icon]:hidden">
              <h1 className="text-xl font-semibold font-headline text-sidebar-foreground">
                SisGest
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
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4 mr-2" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </ScrollArea>
      </Sidebar>
      <SidebarInset className="flex-1">
        <main className="p-4 md:p-6 lg:p-8 h-full">
           <div className="md:hidden mb-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary hover:text-primary-foreground hover:bg-primary rounded-md h-8 w-8">
                  <Building className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold font-headline">SisGest</h1>
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
