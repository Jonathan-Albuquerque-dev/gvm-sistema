
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Calculator, TrendingUp, Percent, Landmark, ShoppingCart, PlusCircle, HandCoins, ReceiptText, Loader2 } from 'lucide-react';
import type { Budget, VariableCost, FixedCost, CostCategory } from '@/types';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { FixedCostForm } from '@/components/costs/fixed-cost-form';
import { VariableCostForm } from '@/components/costs/variable-cost-form';

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
  const [approvedBudgets, setApprovedBudgets] = useState<Budget[]>([]);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [isLoadingFixedCosts, setIsLoadingFixedCosts] = useState(true);
  const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);
  const [isLoadingVariableCosts, setIsLoadingVariableCosts] = useState(true);
  const { toast } = useToast();

  const [isFixedCostDialogOpen, setIsFixedCostDialogOpen] = useState(false);
  const [isVariableCostDialogOpen, setIsVariableCostDialogOpen] = useState(false);

  const [receitaTotal, setReceitaTotal] = useState(0);
  const [custoMaterialTotal, setCustoMaterialTotal] = useState(0);
  const [custosVariaveisTotal, setCustosVariaveisTotal] = useState(0);
  const [custosFixosTotal, setCustosFixosTotal] = useState(0);
  const [custoTotal, setCustoTotal] = useState(0);
  const [lucroTotal, setLucroTotal] = useState(0);
  const [margemMedia, setMargemMedia] = useState(0);
  const [approvedBudgetsCount, setApprovedBudgetsCount] = useState(0);

  useEffect(() => {
    setIsLoadingBudgets(true);
    const budgetsQuery = query(collection(db, 'budgets'), where('status', '==', 'approved'));
    const unsubscribeBudgets = onSnapshot(budgetsQuery, (querySnapshot) => {
      const fetchedBudgets: Budget[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBudgets.push({ id: doc.id, ...doc.data() } as Budget);
      });
      setApprovedBudgets(fetchedBudgets);
      setIsLoadingBudgets(false);
    }, (error) => {
      console.error("Erro ao buscar orçamentos aprovados:", error);
      toast({ title: "Erro ao carregar orçamentos", description: "Não foi possível buscar os orçamentos aprovados.", variant: "destructive" });
      setIsLoadingBudgets(false);
    });

    setIsLoadingFixedCosts(true);
    const fixedCostsQuery = query(collection(db, 'fixedCosts'), orderBy('createdAt', 'desc'));
    const unsubscribeFixedCosts = onSnapshot(fixedCostsQuery, (querySnapshot) => {
        const fetchedFixedCosts: FixedCost[] = [];
        querySnapshot.forEach((doc) => {
            fetchedFixedCosts.push({ id: doc.id, ...doc.data()} as FixedCost);
        });
        setFixedCosts(fetchedFixedCosts);
        setIsLoadingFixedCosts(false);
    }, (error) => {
        console.error("Erro ao buscar custos fixos:", error);
        toast({ title: "Erro ao carregar custos fixos", description: "Não foi possível buscar os custos fixos.", variant: "destructive"});
        setIsLoadingFixedCosts(false);
    });

    setIsLoadingVariableCosts(true);
    const variableCostsQuery = query(collection(db, 'variableCosts'), orderBy('date', 'desc'));
    const unsubscribeVariableCosts = onSnapshot(variableCostsQuery, (querySnapshot) => {
        const fetchedVariableCosts: VariableCost[] = [];
        querySnapshot.forEach((doc) => {
            fetchedVariableCosts.push({ id: doc.id, ...doc.data()} as VariableCost);
        });
        setVariableCosts(fetchedVariableCosts);
        setIsLoadingVariableCosts(false);
    }, (error) => {
        console.error("Erro ao buscar custos variáveis:", error);
        toast({ title: "Erro ao carregar custos variáveis", description: "Não foi possível buscar os custos variáveis.", variant: "destructive"});
        setIsLoadingVariableCosts(false);
    });

    return () => {
      unsubscribeBudgets();
      unsubscribeFixedCosts();
      unsubscribeVariableCosts();
    };
  }, [toast]);

  useEffect(() => {
    const currentApprovedBudgetsCount = approvedBudgets.length;
    setApprovedBudgetsCount(currentApprovedBudgetsCount);

    const currentReceitaTotal = approvedBudgets.reduce((sum, b) => sum + b.totalAmount, 0);
    setReceitaTotal(currentReceitaTotal);

    const currentCustoMaterialTotal = approvedBudgets.reduce((sum, b) => sum + b.materialCostInternal, 0);
    setCustoMaterialTotal(currentCustoMaterialTotal);
    
    const currentCustosVariaveisTotal = variableCosts.reduce((sum, vc) => sum + vc.amount, 0);
    setCustosVariaveisTotal(currentCustosVariaveisTotal);

    const currentCustosFixosTotal = fixedCosts.reduce((sum, fc) => sum + fc.amount, 0);
    setCustosFixosTotal(currentCustosFixosTotal);

    const currentCustoTotal = currentCustoMaterialTotal + currentCustosVariaveisTotal + currentCustosFixosTotal;
    setCustoTotal(currentCustoTotal);

    const currentLucroTotal = currentReceitaTotal - currentCustoTotal;
    setLucroTotal(currentLucroTotal);

    const currentMargemMedia = currentReceitaTotal > 0 ? (currentLucroTotal / currentReceitaTotal) * 100 : 0;
    setMargemMedia(currentMargemMedia);

  }, [approvedBudgets, fixedCosts, variableCosts]);

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

  if (isLoadingBudgets || isLoadingFixedCosts || isLoadingVariableCosts) {
    return (
      <>
        <PageHeader title="Controle de Custos" description="Análise de margem, rentabilidade e despesas." />
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados de custos...</p>
        </div>
      </>
    );
  }

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
            <Dialog open={isFixedCostDialogOpen} onOpenChange={setIsFixedCostDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Gasto Fixo</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes do novo gasto fixo mensal.
                  </DialogDescription>
                </DialogHeader>
                <FixedCostForm onSubmitSuccess={() => setIsFixedCostDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingFixedCosts ? (
                <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...</div>
            ) : fixedCosts.length > 0 ? (
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
            ) : <p className="text-muted-foreground text-center py-4">Nenhum gasto fixo cadastrado.</p>}
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
             <Dialog open={isVariableCostDialogOpen} onOpenChange={setIsVariableCostDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]"> {/* Adjusted width slightly */}
                <DialogHeader>
                  <DialogTitle>Adicionar Gasto Variável</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes do novo gasto variável.
                  </DialogDescription>
                </DialogHeader>
                <VariableCostForm onSubmitSuccess={() => setIsVariableCostDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingVariableCosts ? (
                 <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...</div>
            ) : variableCosts.length > 0 ? (
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
            ) : <p className="text-muted-foreground text-center py-4">Nenhum gasto variável lançado.</p>}
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
             <p className="text-xs text-muted-foreground pt-2">Nota: "Custos de Mão de Obra" podem estar refletidos principalmente nos "Custos Fixos" (salários) e parcialmente nos "Custos Variáveis" (despesas de funcionários). A análise de custo por projeto pode ser mais detalhada ao rastrear horas/custos de mão de obra por projeto.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
