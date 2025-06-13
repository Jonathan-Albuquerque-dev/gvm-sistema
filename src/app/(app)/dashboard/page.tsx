
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { DollarSign, FileText, CheckCircle2, Clock3, PlusCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useEffect, useState, useMemo } from 'react';
import type { SalesData, Budget } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'; // Removed limit and where as we process all budgets
import { useToast } from '@/hooks/use-toast';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const chartConfig = {
  totalSales: {
    label: "Vendas",
    color: "hsl(var(--primary))",
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
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [timeRange, setTimeRange] = useState<string>("6months");
  const { toast } = useToast();

  useEffect(() => {
    setIsLoadingBudgets(true);
    const budgetsQuery = query(collection(db, 'budgets'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(budgetsQuery, (querySnapshot) => {
      const fetchedBudgets: Budget[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBudgets.push({ id: doc.id, ...doc.data() } as Budget);
      });
      setBudgets(fetchedBudgets);
      setIsLoadingBudgets(false);
    }, (error) => {
      console.error("Erro ao buscar orçamentos para o dashboard:", error);
      toast({
        title: "Erro ao carregar orçamentos",
        description: "Não foi possível buscar os dados dos orçamentos.",
        variant: "destructive",
      });
      setIsLoadingBudgets(false);
    });

    return () => unsubscribe(); 
  }, [toast]);

  const totalBudgets = useMemo(() => budgets.length, [budgets]);
  const approvedBudgetsCount = useMemo(() => budgets.filter(b => b.status === 'approved').length, [budgets]);
  const pendingBudgetsCount = useMemo(() => budgets.filter(b => b.status === 'sent' || b.status === 'draft').length, [budgets]);
  
  const monthlyRevenue = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return budgets
      .filter(b => {
        // Use updatedAt if available and budget is approved, otherwise createdAt for recent drafts.
        // For revenue, it should ideally be based on approval date.
        const budgetDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
        return b.status === 'approved' && 
               budgetDate.getMonth() === currentMonth &&
               budgetDate.getFullYear() === currentYear;
      })
      .reduce((sum, b) => sum + b.totalAmount, 0);
  }, [budgets]);

  const recentBudgets = useMemo(() => {
    return [...budgets] 
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [budgets]);

  const displaySalesData = useMemo(() => {
    const approvedBudgets = budgets.filter(b => b.status === 'approved');
    const salesByMonthYear: Record<string, number> = {};

    approvedBudgets.forEach(budget => {
      // Assuming updatedAt reflects the date the budget was approved or became a sale
      const date = new Date(budget.updatedAt || budget.createdAt); 
      const monthYearKey = format(date, 'yyyy-MM');
      salesByMonthYear[monthYearKey] = (salesByMonthYear[monthYearKey] || 0) + budget.totalAmount;
    });

    let numMonthsToDisplay = 6; // Default
    if (timeRange === "1month") numMonthsToDisplay = 1;
    else if (timeRange === "3months") numMonthsToDisplay = 3;
    else if (timeRange === "12months") numMonthsToDisplay = 12;

    const chartData: SalesData[] = [];
    const currentDate = new Date();

    for (let i = 0; i < numMonthsToDisplay; i++) {
      const monthToProcess = startOfMonth(subMonths(currentDate, i));
      const monthYearKey = format(monthToProcess, 'yyyy-MM');
      // For X-axis label, use 'MMM' for simplicity as ranges are <= 12 months.
      // If year changes within the range, it's implicitly handled by order.
      const monthLabel = format(monthToProcess, 'MMM', { locale: ptBR });
      
      chartData.push({
        month: monthLabel,
        totalSales: salesByMonthYear[monthYearKey] || 0,
      });
    }
    return chartData.reverse(); // Ensure chronological order
  }, [budgets, timeRange]);


  const kpiCardBaseClasses = "flex flex-col items-start text-left";
  const kpiIconWrapperBaseClasses = "p-3 rounded-lg mb-3";
  const kpiValueClasses = "text-3xl font-bold";
  const kpiTitleClasses = "text-sm font-medium text-muted-foreground";
  const kpiSubtitleClasses = "text-xs text-muted-foreground";

  if (isLoadingBudgets) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados do dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do seu negócio.">
        <div className="flex items-center gap-4">
          <Link href="/budgets/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento
            </Button>
          </Link>
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
            <p className={kpiSubtitleClasses}>Geral</p> 
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
              <CardDescription>Faturamento total de orçamentos aprovados nos últimos meses.</CardDescription>
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
                <BarChart data={displaySalesData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickFormatter={(value) => `R$${value / 1000}k`} tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent
                      formatter={(value) => typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : String(value)}
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
            <Link href="/budgets">
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
                        <div className="text-xs text-muted-foreground">
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
                        </div>
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
