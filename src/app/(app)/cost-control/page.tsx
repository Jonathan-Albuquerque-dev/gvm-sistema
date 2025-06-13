
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Calculator, TrendingUp, Percent, Landmark, ShoppingCart, PlusCircle, HandCoins, ReceiptText } from 'lucide-react';
import { MOCK_BUDGETS, MOCK_VARIABLE_COSTS, MOCK_FIXED_COSTS } from '@/lib/mock-data';
import type { Budget, VariableCost, FixedCost, CostCategory } from '@/types';
import { cn } from '@/lib/utils';

const categoryTranslations: Record<CostCategory, string> = {
  food: 'Alimentação',
  transport: 'Transporte',
  salary: 'Salários',
  rent: 'Aluguel',
  utilities: 'Utilidades',
  marketing: 'Marketing',
  office_supplies: 'Material Escritório',
  other: 'Outros',
  benefits: 'Benefícios'
};


export default function CostControlPage() {
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [custoMaterialTotal, setCustoMaterialTotal] = useState(0);
  const [custosVariaveisTotal, setCustosVariaveisTotal] = useState(0);
  const [custosFixosTotal, setCustosFixosTotal] = useState(0);
  const [custoTotal, setCustoTotal] = useState(0);
  const [lucroTotal, setLucroTotal] = useState(0);
  const [margemMedia, setMargemMedia] = useState(0);
  const [approvedBudgetsCount, setApprovedBudgetsCount] = useState(0);

  const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);

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
    setVariableCosts(MOCK_VARIABLE_COSTS);

    const currentCustosFixosTotal = MOCK_FIXED_COSTS.reduce((sum, fc) => sum + fc.amount, 0);
    setCustosFixosTotal(currentCustosFixosTotal);
    setFixedCosts(MOCK_FIXED_COSTS);

    const currentCustoTotal = currentCustoMaterialTotal + currentCustosVariaveisTotal + currentCustosFixosTotal;
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
  
  const percentCustoMaterial = custoTotal > 0 ? (custoMaterialTotal / custoTotal) * 100 : 0;
  const percentCustosVariaveis = custoTotal > 0 ? (custosVariaveisTotal / custoTotal) * 100 : 0;
  const percentCustosFixos = custoTotal > 0 ? (custosFixosTotal / custoTotal) * 100 : 0;
  const custoMedioPorProjeto = approvedBudgetsCount > 0 ? custoTotal / approvedBudgetsCount : 0;


  return (
    <>
      <PageHeader title="Controle de Custos" description="Análise de margem, rentabilidade e despesas." />

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
            <p className={kpiSubtitleClasses}>Material + Fixo + Variável</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                <CardTitle>Gastos Fixos Mensais</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => console.log("Adicionar Gasto Fixo")}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </CardHeader>
          <CardContent>
            {fixedCosts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixedCosts.map(cost => (
                    <TableRow key={cost.id}>
                      <TableCell>{cost.description}</TableCell>
                      <TableCell>{categoryTranslations[cost.category as CostCategory] || cost.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cost.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground">Nenhum gasto fixo cadastrado.</p>}
             <div className="font-semibold text-right mt-4 border-t pt-2">
                Total Fixo: {formatCurrency(custosFixosTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
             <div className="flex items-center gap-2">
                <HandCoins className="h-5 w-5 text-primary" />
                <CardTitle>Gastos Variáveis Lançados</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => console.log("Adicionar Gasto Variável")}>
                 <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </CardHeader>
          <CardContent>
            {variableCosts.length > 0 ? (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variableCosts.map(cost => (
                    <TableRow key={cost.id}>
                      <TableCell>{cost.description}</TableCell>
                      <TableCell>{new Date(cost.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{categoryTranslations[cost.category as CostCategory] || cost.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cost.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground">Nenhum gasto variável lançado.</p>}
            <div className="font-semibold text-right mt-4 border-t pt-2">
                Total Variável: {formatCurrency(custosVariaveisTotal)}
            </div>
          </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            <CardTitle>Análise de Rentabilidade por Produto/Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em breve: Análise detalhada da rentabilidade por produto ou serviço, considerando custos diretos e rateio de custos indiretos.</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <CardTitle>Breakdown de Custos Totais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-md bg-[hsl(var(--status-info-background))] bg-opacity-20 dark:bg-opacity-10">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--status-info-foreground))]">Custos de Material</p>
                <p className="text-xs text-muted-foreground">{formatPercent(percentCustoMaterial)} do total</p>
              </div>
              <p className="text-sm font-semibold text-[hsl(var(--status-info-foreground))]">{formatCurrency(custoMaterialTotal)}</p>
            </div>
             <div className="flex justify-between items-center p-3 rounded-md bg-[hsl(var(--status-warning-background))] bg-opacity-20 dark:bg-opacity-10">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--status-warning-foreground))]">Custos Variáveis</p>
                <p className="text-xs text-muted-foreground">{formatPercent(percentCustosVariaveis)} do total</p>
              </div>
              <p className="text-sm font-semibold text-[hsl(var(--status-warning-foreground))]">{formatCurrency(custosVariaveisTotal)}</p>
            </div>
            <div className="flex justify-between items-center p-3 rounded-md bg-[hsl(var(--status-danger-background))] bg-opacity-20 dark:bg-opacity-10">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--status-danger-foreground))]">Custos Fixos Mensais</p>
                <p className="text-xs text-muted-foreground">{formatPercent(percentCustosFixos)} do total</p>
              </div>
              <p className="text-sm font-semibold text-[hsl(var(--status-danger-foreground))]">{formatCurrency(custosFixosTotal)}</p>
            </div>
            
             <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Custo Médio por Projeto Aprovado</p>
                    <p className="text-sm font-semibold">{formatCurrency(custoMedioPorProjeto)}</p>
                </div>
             </div>
             <p className="text-xs text-muted-foreground pt-2">Nota: "Custos de Mão de Obra" estão agora refletidos principalmente nos "Custos Fixos" (salários) e parcialmente nos "Custos Variáveis" (despesas de funcionários). A análise de custo por projeto pode ser mais detalhada ao rastrear horas/custos de mão de obra por projeto.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
