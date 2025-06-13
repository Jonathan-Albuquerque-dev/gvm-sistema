
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { DollarSign, FileText, CheckCircle2, Clock3, PlusCircle, UserCircle, ArrowRight } from 'lucide-react'; // Clock3 and UserCircle added
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { MOCK_BUDGETS, MOCK_SALES_DATA } from '@/lib/mock-data';
import { useEffect, useState } from 'react';
import type { SalesData, Budget } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added Avatar
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const chartConfig = {
  totalSales: {
    label: "Vendas",
    color: "hsl(var(--primary))", // Keep using theme color for chart
  },
} satisfies ChartConfig;

const statusLabels: Record<Budget['status'], string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

export default function DashboardPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [timeRange, setTimeRange] = useState<string>("6months");

  useEffect(() => {
    setBudgets(MOCK_BUDGETS);
    setSalesData(MOCK_SALES_DATA);
  }, []);
  
  const totalBudgets = budgets.length;
  const approvedBudgetsCount = budgets.filter(b => b.status === 'approved').length;
  const pendingBudgetsCount = budgets.filter(b => b.status === 'sent' || b.status === 'draft').length;
  const monthlyRevenue = budgets
    .filter(b => b.status === 'approved' && new Date(b.updatedAt).getMonth() === new Date().getMonth())
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const recentBudgets = budgets.slice(0, 5).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  const kpiCardBaseClasses = "flex flex-col items-start text-left";
  const kpiIconWrapperBaseClasses = "p-3 rounded-lg mb-3";
  const kpiValueClasses = "text-3xl font-bold";
  const kpiTitleClasses = "text-sm font-medium text-muted-foreground";
  const kpiSubtitleClasses = "text-xs text-muted-foreground";


  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do seu negócio.">
        <div className="flex items-center gap-4">
          <Link href="/budgets/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/40x40.png" alt="João Silva" data-ai-hint="user avatar" />
              <AvatarFallback>
                <UserCircle className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">João Silva</span>
          </div>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className={kpiCardBaseClasses}>
          <CardHeader className="p-4 pb-0">
             <div className={cn(kpiIconWrapperBaseClasses, "bg-[hsl(var(--status-info-background))] text-[hsl(var(--status-info-foreground))]")}>
              <FileText className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={kpiValueClasses}>{totalBudgets}</div>
            <CardTitle className={kpiTitleClasses}>Total</CardTitle>
            <p className={kpiSubtitleClasses}>Orçamentos</p>
          </CardContent>
        </Card>
        <Card className={kpiCardBaseClasses}>
          <CardHeader className="p-4 pb-0">
            <div className={cn(kpiIconWrapperBaseClasses, "bg-[hsl(var(--status-success-background))] text-[hsl(var(--status-success-foreground))]")}>
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={kpiValueClasses}>{approvedBudgetsCount}</div>
             <CardTitle className={kpiTitleClasses}>Aprovados</CardTitle>
            <p className={kpiSubtitleClasses}>Este mês</p>
          </CardContent>
        </Card>
        <Card className={kpiCardBaseClasses}>
          <CardHeader className="p-4 pb-0">
            <div className={cn(kpiIconWrapperBaseClasses, "bg-[hsl(var(--status-warning-background))] text-[hsl(var(--status-warning-foreground))]")}>
              <Clock3 className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={kpiValueClasses}>{pendingBudgetsCount}</div>
            <CardTitle className={kpiTitleClasses}>Pendentes</CardTitle>
            <p className={kpiSubtitleClasses}>Aguardando</p>
          </CardContent>
        </Card>
        <Card className={kpiCardBaseClasses}>
          <CardHeader className="p-4 pb-0">
            <div className={cn(kpiIconWrapperBaseClasses, "bg-[hsl(var(--status-success-background))] text-[hsl(var(--status-success-foreground))]")}>
              <DollarSign className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={kpiValueClasses}>
              {monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <CardTitle className={kpiTitleClasses}>Faturamento</CardTitle>
            <p className={kpiSubtitleClasses}>Este mês</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Vendas por Período</CardTitle>
              <CardDescription>Faturamento total nos últimos meses.</CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Último mês</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="12months">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickFormatter={(value) => `R$${value / 1000}k`} tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                      formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      indicator="dot" 
                    />}
                  />
                  <Legend />
                  <Bar dataKey="totalSales" fill="var(--color-totalSales)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Orçamentos Recentes</CardTitle>
            <Link href="/budgets" passHref>
              <Button variant="link" className="text-xs h-auto p-0">
                Ver todos <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBudgets.length > 0 ? (
              <ul className="space-y-4">
                {recentBudgets.map((budget) => (
                  <li key={budget.id} className="flex items-center justify-between hover:bg-muted/50 p-2 -m-2 rounded-md transition-colors">
                    <div className="flex items-center gap-3">
                       <Avatar className="h-8 w-8 hidden sm:flex">
                          <AvatarFallback className="text-xs bg-[hsl(var(--status-info-background))] text-[hsl(var(--status-info-foreground))]">
                            {budget.clientName?.substring(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      <div>
                        <p className="font-medium text-sm">{budget.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(budget.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                           {' - '}
                           <Badge 
                             variant={budget.status === 'approved' ? 'default' : budget.status === 'rejected' ? 'destructive' : budget.status === 'sent' ? 'outline' : 'secondary'}
                             className={cn(
                              "text-xs px-1.5 py-0.5 font-normal",
                              budget.status === 'approved' && 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
                              budget.status === 'sent' && 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
                              budget.status === 'draft' && 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
                              budget.status === 'rejected' && 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700'
                             )}
                           >
                             {statusLabels[budget.status]}
                           </Badge>
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-right">
                      {budget.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum orçamento recente para exibir.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
