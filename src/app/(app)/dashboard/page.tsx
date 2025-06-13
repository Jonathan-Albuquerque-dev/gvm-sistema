'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { DollarSign, FileText, CheckCircle2, Clock, PlusCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { MOCK_BUDGETS, MOCK_SALES_DATA } from '@/lib/mock-data';
import { useEffect, useState } from 'react';
import type { SalesData, Budget } from '@/types';

const chartConfig = {
  totalSales: {
    label: "Vendas",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);

  useEffect(() => {
    // Simulate API call
    setBudgets(MOCK_BUDGETS);
    setSalesData(MOCK_SALES_DATA);
  }, []);
  
  const totalBudgets = budgets.length;
  const approvedBudgets = budgets.filter(b => b.status === 'approved').length;
  const pendingBudgets = budgets.filter(b => b.status === 'sent' || b.status === 'draft').length;
  const monthlyRevenue = budgets
    .filter(b => b.status === 'approved' && new Date(b.updatedAt).getMonth() === new Date().getMonth())
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do seu negócio.">
        <Link href="/budgets/new" legacyBehavior passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Orçamentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBudgets}</div>
            <p className="text-xs text-muted-foreground">Orçamentos gerados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos Aprovados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedBudgets}</div>
            <p className="text-xs text-muted-foreground">Aprovados este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBudgets}</div>
            <p className="text-xs text-muted-foreground">Aguardando resposta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento no Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Com base nos aprovados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas por Período</CardTitle>
          <CardDescription>Faturamento total nos últimos meses.</CardDescription>
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
    </>
  );
}
