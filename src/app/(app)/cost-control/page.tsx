
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Calculator, TrendingUp, Percent } from 'lucide-react';
import { MOCK_BUDGETS, MOCK_VARIABLE_COSTS } from '@/lib/mock-data';
import type { Budget, VariableCost } from '@/types';
import { cn } from '@/lib/utils';

export default function CostControlPage() {
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [custoMaterialTotal, setCustoMaterialTotal] = useState(0);
  const [custosVariaveisTotal, setCustosVariaveisTotal] = useState(0);
  const [custoTotal, setCustoTotal] = useState(0);
  const [lucroTotal, setLucroTotal] = useState(0);
  const [margemMedia, setMargemMedia] = useState(0);
  const [approvedBudgetsCount, setApprovedBudgetsCount] = useState(0);

  useEffect(() => {
    const approvedBudgets = MOCK_BUDGETS.filter(b => b.status === 'approved');
    const currentApprovedBudgetsCount = approvedBudgets.length;
    setApprovedBudgetsCount(currentApprovedBudgetsCount);

    const currentReceitaTotal = approvedBudgets.reduce((sum, b) => sum + b.totalAmount, 0);
    setReceitaTotal(currentReceitaTotal);

    const currentCustoMaterialTotal = approvedBudgets.reduce((sum, b) => sum + b.materialCostInternal, 0);
    setCustoMaterialTotal(currentCustoMaterialTotal);
    
    const currentCustosVariaveisTotal = MOCK_VARIABLE_COSTS.reduce((sum, vc) => sum + vc.amount, 0);
    setCustosVariaveisTotal(currentCustosVariaveisTotal);

    const currentCustoTotal = currentCustoMaterialTotal + currentCustosVariaveisTotal;
    setCustoTotal(currentCustoTotal);

    const currentLucroTotal = currentReceitaTotal - currentCustoTotal;
    setLucroTotal(currentLucroTotal);

    const currentMargemMedia = currentReceitaTotal > 0 ? (currentLucroTotal / currentReceitaTotal) * 100 : 0;
    setMargemMedia(currentMargemMedia);

  }, []);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const kpiCardBaseClasses = "flex flex-col items-start text-left";
  const kpiIconWrapperBaseClasses = "p-3 rounded-lg mb-3";
  const kpiValueClasses = "text-3xl font-bold";
  const kpiTitleClasses = "text-sm font-medium text-muted-foreground";
  const kpiSubtitleClasses = "text-xs text-muted-foreground";
  
  const custoMaoDeObraTotal = 0; // Placeholder as no direct labor cost in budget items now
  const percentCustoMaterial = custoTotal > 0 ? (custoMaterialTotal / custoTotal) * 100 : 0;
  const percentCustoMaoDeObra = custoTotal > 0 ? (custoMaoDeObraTotal / custoTotal) * 100 : 0;
  const custoMedioPorProjeto = approvedBudgetsCount > 0 ? custoTotal / approvedBudgetsCount : 0;


  return (
    <>
      <PageHeader title="Controle de Custos" description="Análise de margem e rentabilidade" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className={kpiCardBaseClasses}>
          <CardHeader className="p-4 pb-0">
            <div className={cn(kpiIconWrapperBaseClasses, "bg-[hsl(var(--status-success-background))] text-[hsl(var(--status-success-foreground))]")}>
              <DollarSign className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={kpiValueClasses}>{formatCurrency(receitaTotal)}</div>
            <CardTitle className={kpiTitleClasses}>Receita Total</CardTitle>
            <p className={kpiSubtitleClasses}>{approvedBudgetsCount} orçamentos aprovados</p>
          </CardContent>
        </Card>

        <Card className={kpiCardBaseClasses}>
          <CardHeader className="p-4 pb-0">
            <div className={cn(kpiIconWrapperBaseClasses, "bg-[hsl(var(--status-danger-background))] text-[hsl(var(--status-danger-foreground))]")}>
              <Calculator className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={kpiValueClasses}>{formatCurrency(custoTotal)}</div>
            <CardTitle className={kpiTitleClasses}>Custo Total</CardTitle>
            <p className={kpiSubtitleClasses}>Material + Custos Variáveis</p>
          </CardContent>
        </Card>

        <Card className={kpiCardBaseClasses}>
          <CardHeader className="p-4 pb-0">
            <div className={cn(kpiIconWrapperBaseClasses, "bg-[hsl(var(--status-info-background))] text-[hsl(var(--status-info-foreground))]")}>
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={kpiValueClasses}>{formatCurrency(lucroTotal)}</div>
            <CardTitle className={kpiTitleClasses}>Lucro Total</CardTitle>
            <p className={kpiSubtitleClasses}>Receita - Custos</p>
          </CardContent>
        </Card>

        <Card className={kpiCardBaseClasses}>
          <CardHeader className="p-4 pb-0">
            <div className={cn(kpiIconWrapperBaseClasses, "bg-[hsl(var(--status-purple-background))] text-[hsl(var(--status-purple-foreground))]")}>
              <Percent className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={kpiValueClasses}>{formatPercent(margemMedia)}</div>
            <CardTitle className={kpiTitleClasses}>Margem Média</CardTitle>
            <p className={kpiSubtitleClasses}>Margem de lucro</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Análise de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em breve: Análise detalhada da rentabilidade por produto ou serviço.</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Breakdown de Custos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-md bg-[hsl(var(--status-info-background))] bg-opacity-20 dark:bg-opacity-10">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--status-info-foreground))]">Custos de Material</p>
                <p className="text-xs text-muted-foreground">{formatPercent(percentCustoMaterial)} do total</p>
              </div>
              <p className="text-sm font-semibold text-[hsl(var(--status-info-foreground))]">{formatCurrency(custoMaterialTotal)}</p>
            </div>
            <div className="flex justify-between items-center p-3 rounded-md bg-[hsl(var(--status-success-background))] bg-opacity-20 dark:bg-opacity-10">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--status-success-foreground))]">Custos de Mão de Obra</p>
                <p className="text-xs text-muted-foreground">{formatPercent(percentCustoMaoDeObra)} do total</p>
              </div>
              <p className="text-sm font-semibold text-[hsl(var(--status-success-foreground))]">{formatCurrency(custoMaoDeObraTotal)}</p>
            </div>
             <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Custo Médio por Projeto</p>
                    <p className="text-sm font-semibold">{formatCurrency(custoMedioPorProjeto)}</p>
                </div>
             </div>
             <p className="text-xs text-muted-foreground pt-2">Nota: "Custos de Mão de Obra" são baseados nos custos variáveis lançados. Para uma análise mais precisa, categorize os custos variáveis ou implemente uma forma de rastrear custos de mão de obra por projeto.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

