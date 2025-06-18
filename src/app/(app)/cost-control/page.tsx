
'use client';

import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Calculator, PlusCircle, HandCoins, ReceiptText, Loader2, MoreVertical, Edit, Trash2, FileDown, FileText, CheckCircle2 } from 'lucide-react';
import type { Budget, VariableCost, FixedCost, CostCategory } from '@/types';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FixedCostForm } from '@/components/costs/fixed-cost-form';
import { VariableCostForm } from '@/components/costs/variable-cost-form';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, isSameMonth, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryTranslations: Record<CostCategory, string> = {
  food: 'Alimentação',
  transport: 'Transporte',
  salary: 'Salários',
  rent: 'Aluguel',
  utilities: 'Utilidades',
  marketing: 'Marketing',
  office_supplies: 'Material de Escritório',
  other: 'Outros',
  benefits: 'Benefícios'
};


export default function CostControlPage() {
  const [approvedBudgets, setApprovedBudgets] = useState<Budget[]>([]);
  const [isLoadingBudgets, setIsLoadingBudgets] useState(true);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [isLoadingFixedCosts, setIsLoadingFixedCosts] = useState(true);
  const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);
  const [isLoadingVariableCosts, setIsLoadingVariableCosts] = useState(true);
  const { toast } = useToast();

  const [isFixedCostDialogOpen, setIsFixedCostDialogOpen] = useState(false);
  const [fixedCostToEdit, setFixedCostToEdit] = useState<FixedCost | null>(null);
  const [isVariableCostDialogOpen, setIsVariableCostDialogOpen] = useState(false);
  const [variableCostToEdit, setVariableCostToEdit] = useState<VariableCost | null>(null);

  const [approvedBudgetsThisMonthCount, setApprovedBudgetsThisMonthCount] = useState(0);
  const [approvedBudgetsThisMonthValue, setApprovedBudgetsThisMonthValue] = useState(0);
  const [overallApprovedBudgetsCount, setOverallApprovedBudgetsCount] = useState(0);
  const [overallRevenueTotal, setOverallRevenueTotal] = useState(0);

  const [custoMaterialTotal, setCustoMaterialTotal] = useState(0);
  const [custosVariaveisTotal, setCustosVariaveisTotal] = useState(0);
  const [custosFixosTotal, setCustosFixosTotal] = useState(0);
  const [custoTotal, setCustoTotal] = useState(0);
  

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
    const today = new Date();
    const currentMonthBudgets = approvedBudgets.filter(b => {
        const budgetDate = b.updatedAt ? parseISO(b.updatedAt) : parseISO(b.createdAt);
        return isSameMonth(budgetDate, today);
    });
    
    setApprovedBudgetsThisMonthCount(currentMonthBudgets.length);
    setApprovedBudgetsThisMonthValue(currentMonthBudgets.reduce((sum, b) => sum + b.totalAmount, 0));
    
    setOverallApprovedBudgetsCount(approvedBudgets.length);
    setOverallRevenueTotal(approvedBudgets.reduce((sum, b) => sum + b.totalAmount, 0));

    const currentCustoMaterialTotal = approvedBudgets.reduce((sum, b) => sum + b.materialCostInternal, 0);
    setCustoMaterialTotal(currentCustoMaterialTotal);
    
    const currentCustosVariaveisTotal = variableCosts.reduce((sum, vc) => sum + vc.amount, 0);
    setCustosVariaveisTotal(currentCustosVariaveisTotal);

    const currentCustosFixosTotal = fixedCosts.reduce((sum, fc) => sum + fc.amount, 0);
    setCustosFixosTotal(currentCustosFixosTotal);

    const currentCustoTotal = currentCustoMaterialTotal + currentCustosVariaveisTotal + currentCustosFixosTotal;
    setCustoTotal(currentCustoTotal);

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
  const custoMedioPorProjeto = overallApprovedBudgetsCount > 0 ? custoTotal / overallApprovedBudgetsCount : 0;

  const handleOpenFixedCostDialog = (cost: FixedCost | null = null) => {
    setFixedCostToEdit(cost);
    setIsFixedCostDialogOpen(true);
  };

  const handleDeleteFixedCost = async (costId: string, costDescription: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o custo fixo "${costDescription}"?`)) return;
    try {
      await deleteDoc(doc(db, 'fixedCosts', costId));
      toast({ title: 'Custo Fixo Excluído!', description: `O custo "${costDescription}" foi excluído.` });
    } catch (error) {
      console.error("Erro ao excluir custo fixo:", error);
      toast({ title: 'Erro ao Excluir', description: 'Não foi possível excluir o custo fixo.', variant: 'destructive' });
    }
  };

  const handleOpenVariableCostDialog = (cost: VariableCost | null = null) => {
    setVariableCostToEdit(cost);
    setIsVariableCostDialogOpen(true);
  };

  const handleDeleteVariableCost = async (costId: string, costDescription: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o custo variável "${costDescription}"?`)) return;
    try {
      await deleteDoc(doc(db, 'variableCosts', costId));
      toast({ title: 'Custo Variável Excluído!', description: `O custo "${costDescription}" foi excluído.` });
    } catch (error) {
      console.error("Erro ao excluir custo variável:", error);
      toast({ title: 'Erro ao Excluir', description: 'Não foi possível excluir o custo variável.', variant: 'destructive' });
    }
  };
  
  const handleGenerateCostReportPdf = () => {
    if (isLoadingBudgets || isLoadingFixedCosts || isLoadingVariableCosts) {
      toast({ title: "Aguarde", description: "Os dados ainda estão carregando. Tente novamente em breve.", variant: "default" });
      return;
    }

    const pdfDoc = new jsPDF();
    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const margin = 14;
    let currentY = 20;

    pdfDoc.setFontSize(16);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Relatório Geral de Controle de Custos', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    pdfDoc.setFontSize(10);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', {locale: ptBR})}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;

    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Resumo Financeiro e de Custos (Geral)', margin, currentY);
    currentY += 7;
    pdfDoc.setFontSize(10);
    pdfDoc.setFont('helvetica', 'normal');

    const kpiData = [
      { label: "Receita Total (Orçamentos Aprovados - Geral):", value: formatCurrency(overallRevenueTotal) },
      { label: "Custo Material Total (Orçamentos Aprovados - Geral):", value: formatCurrency(custoMaterialTotal) },
      { label: "Custos Variáveis Totais (Lançados):", value: formatCurrency(custosVariaveisTotal) },
      { label: "Custos Fixos Totais (Mensais):", value: formatCurrency(custosFixosTotal) },
      { label: "Custo Total Geral:", value: formatCurrency(custoTotal) },
      { label: "Número de Orçamentos Aprovados (Total Geral):", value: overallApprovedBudgetsCount.toString() },
      { label: "Custo Médio por Projeto Aprovado (Geral):", value: formatCurrency(custoMedioPorProjeto) },
    ];

    kpiData.forEach(kpi => {
      if (currentY > pdfDoc.internal.pageSize.getHeight() - 20) { pdfDoc.addPage(); currentY = 20; }
      pdfDoc.text(`${kpi.label} ${kpi.value}`, margin, currentY);
      currentY += 6;
    });
    currentY += 5;

    if (fixedCosts.length > 0) {
      if (currentY > pdfDoc.internal.pageSize.getHeight() - 40) { pdfDoc.addPage(); currentY = 20; }
      pdfDoc.setFontSize(12);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('Detalhes dos Custos Fixos Mensais', margin, currentY);
      currentY += 7;
      const fixedCostsColumns = ["Descrição", "Categoria", "Valor (R$)"];
      const fixedCostsRows = fixedCosts.map(cost => [
        cost.description,
        categoryTranslations[cost.category as CostCategory] || cost.category,
        cost.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ]);
      autoTable(pdfDoc, {
        head: [fixedCostsColumns],
        body: fixedCostsRows,
        startY: currentY,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
        columns: [{/* Descrição */}, {/* Categoria */}, { halign: 'right' /* Valor */ }],
        didDrawPage: (data) => { currentY = data.cursor?.y || currentY; }
      });
      currentY = (pdfDoc as any).lastAutoTable.finalY + 5;
      pdfDoc.setFontSize(10);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text(`Total de Custos Fixos: ${formatCurrency(custosFixosTotal)}`, pageWidth - margin, currentY, { align: 'right' });
      currentY += 10;
    }

    if (variableCosts.length > 0) {
      if (currentY > pdfDoc.internal.pageSize.getHeight() - 40) { pdfDoc.addPage(); currentY = 20; }
      pdfDoc.setFontSize(12);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('Detalhes dos Custos Variáveis Lançados', margin, currentY);
      currentY += 7;
      const variableCostsColumns = ["Descrição", "Data", "Categoria", "Valor (R$)"];
      const variableCostsRows = variableCosts.map(cost => [
        cost.description,
        format(parseISO(cost.date), 'dd/MM/yyyy', {locale: ptBR}),
        categoryTranslations[cost.category as CostCategory] || cost.category,
        cost.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ]);
       autoTable(pdfDoc, {
        head: [variableCostsColumns],
        body: variableCostsRows,
        startY: currentY,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
        columns: [{/* Descrição */}, { halign: 'center' /* Data */}, {/* Categoria */}, { halign: 'right' /* Valor */}],
        didDrawPage: (data) => { currentY = data.cursor?.y || currentY; }
      });
      currentY = (pdfDoc as any).lastAutoTable.finalY + 5;
      pdfDoc.setFontSize(10);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text(`Total de Custos Variáveis: ${formatCurrency(custosVariaveisTotal)}`, pageWidth - margin, currentY, { align: 'right' });
      currentY += 10;
    }
    
    if (currentY > pdfDoc.internal.pageSize.getHeight() - 50) { pdfDoc.addPage(); currentY = 20; }
    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Breakdown de Custos Totais (Baseado no Custo Total Geral)', margin, currentY);
    currentY += 7;
    pdfDoc.setFontSize(10);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(`Custos de Material: ${formatCurrency(custoMaterialTotal)} (${formatPercent(percentCustoMaterial)} do total)`, margin, currentY);
    currentY += 6;
    pdfDoc.text(`Custos Variáveis: ${formatCurrency(custosVariaveisTotal)} (${formatPercent(percentCustosVariaveis)} do total)`, margin, currentY);
    currentY += 6;
    pdfDoc.text(`Custos Fixos Mensais: ${formatCurrency(custosFixosTotal)} (${formatPercent(percentCustosFixos)} do total)`, margin, currentY);
    currentY += 10;
    
    pdfDoc.setFontSize(8);
    pdfDoc.text("Nota: Este relatório reflete os dados acumulados até a data de geração. Orçamentos, custos fixos e variáveis são considerados em sua totalidade.", margin, currentY, { maxWidth: pageWidth - margin * 2 });

    pdfDoc.save('relatorio_controle_de_custos.pdf');
    toast({ title: 'PDF Gerado', description: 'O relatório de controle de custos foi gerado com sucesso.' });
  };


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

  const noDataForReport = fixedCosts.length === 0 && variableCosts.length === 0 && approvedBudgets.length === 0;

  return (
    <>
      <PageHeader title="Controle de Custos" description="Análise de despesas e custos operacionais.">
        <Button 
          onClick={handleGenerateCostReportPdf} 
          variant="outline" 
          disabled={noDataForReport || isLoadingBudgets || isLoadingFixedCosts || isLoadingVariableCosts}
        >
          <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 mb-6"> {/* Changed to md:grid-cols-2 */}
        <Card className={kpiCardBaseClasses}>
          <CardHeader className="p-4 pb-0">
            <div className={cn(kpiIconWrapperBaseClasses, "bg-[hsl(var(--status-success-background))] text-[hsl(var(--status-success-foreground))]")}>
              <CheckCircle2 className="h-6 w-6" /> {/* Icon changed */}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={kpiValueClasses}>{approvedBudgetsThisMonthCount}</div>
            <CardTitle className={kpiTitleClasses}>Orçamentos Aprovados no Mês</CardTitle>
            <p className={kpiSubtitleClasses}>Faturamento no mês: {formatCurrency(approvedBudgetsThisMonthValue)}</p>
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
            <p className={kpiSubtitleClasses}>Material + Fixo + Variável (Geral)</p>
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
            <Dialog open={isFixedCostDialogOpen} onOpenChange={(isOpen) => {
                setIsFixedCostDialogOpen(isOpen);
                if (!isOpen) setFixedCostToEdit(null);
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => handleOpenFixedCostDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{fixedCostToEdit ? 'Editar Gasto Fixo' : 'Adicionar Gasto Fixo'}</DialogTitle>
                  <DialogDescription>
                    {fixedCostToEdit ? 'Modifique os detalhes do gasto fixo.' : 'Preencha os detalhes do novo gasto fixo mensal.'}
                  </DialogDescription>
                </DialogHeader>
                <FixedCostForm 
                    fixedCost={fixedCostToEdit} 
                    onSubmitSuccess={() => {
                        setIsFixedCostDialogOpen(false);
                        setFixedCostToEdit(null);
                    }} 
                />
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixedCosts.map(cost => (
                    <TableRow key={cost.id}>
                      <TableCell>{cost.description}</TableCell>
                      <TableCell>{categoryTranslations[cost.category as CostCategory] || cost.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cost.amount)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenFixedCostDialog(cost)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteFixedCost(cost.id, cost.description)} className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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
             <Dialog open={isVariableCostDialogOpen} onOpenChange={(isOpen) => {
                setIsVariableCostDialogOpen(isOpen);
                if (!isOpen) setVariableCostToEdit(null);
             }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => handleOpenVariableCostDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>{variableCostToEdit ? 'Editar Gasto Variável' : 'Adicionar Gasto Variável'}</DialogTitle>
                  <DialogDescription>
                     {variableCostToEdit ? 'Modifique os detalhes do gasto variável.' : 'Preencha os detalhes do novo gasto variável.'}
                  </DialogDescription>
                </DialogHeader>
                <VariableCostForm 
                    variableCost={variableCostToEdit}
                    onSubmitSuccess={() => {
                        setIsVariableCostDialogOpen(false);
                        setVariableCostToEdit(null);
                    }} 
                />
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
                    <TableHead className="text-right">Ações</TableHead> 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variableCosts.map(cost => (
                    <TableRow key={cost.id}>
                      <TableCell>{cost.description}</TableCell>
                      <TableCell>{new Date(cost.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{categoryTranslations[cost.category as CostCategory] || cost.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cost.amount)}</TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenVariableCostDialog(cost)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteVariableCost(cost.id, cost.description)} className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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
    

