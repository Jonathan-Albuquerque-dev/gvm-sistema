
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { ReportView } from '@/components/reports/report-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, FileDown, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import type { Budget, BudgetStatus, Client } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const statusTranslations: Record<BudgetStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all');
  const [clientFilter, setClientFilter] = useState<string | 'all'>('all');

  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [reportData, setReportData] = useState<Budget[]>([]);
  
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoadingBudgets(true);
    const budgetsQuery = query(collection(db, 'budgets'), orderBy('createdAt', 'desc'));
    const unsubscribeBudgets = onSnapshot(budgetsQuery, (snapshot) => {
      const fetchedBudgets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
      setAllBudgets(fetchedBudgets);
      setIsLoadingBudgets(false);
    }, (error) => {
      console.error("Error fetching budgets for reports: ", error);
      toast({ title: "Erro ao carregar orçamentos", description: "Não foi possível buscar os dados de orçamentos.", variant: "destructive"});
      setIsLoadingBudgets(false);
    });

    setIsLoadingClients(true);
    const clientsQuery = query(collection(db, 'clients'), orderBy('name'));
    const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
      const fetchedClients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setAllClients(fetchedClients);
      setIsLoadingClients(false);
    }, (error) => {
      console.error("Error fetching clients for reports: ", error);
      toast({ title: "Erro ao carregar clientes", description: "Não foi possível buscar os dados de clientes para o filtro.", variant: "destructive"});
      setIsLoadingClients(false);
    });

    return () => {
      unsubscribeBudgets();
      unsubscribeClients();
    };
  }, [toast]);

  const filteredReportData = useMemo(() => {
    return allBudgets.filter(budget => {
      const budgetDate = new Date(budget.createdAt);
      const matchesDate = dateRange?.from && dateRange?.to ?
                          budgetDate >= dateRange.from && budgetDate <= dateRange.to : true;
      const matchesStatus = statusFilter === 'all' || budget.status === statusFilter;
      const matchesClient = clientFilter === 'all' || budget.clientId === clientFilter;

      return matchesDate && matchesStatus && matchesClient;
    });
  }, [allBudgets, dateRange, statusFilter, clientFilter]);

  const handleGenerateReport = () => {
    setReportData(filteredReportData);
     if (filteredReportData.length === 0) {
        toast({
            title: "Nenhum dado encontrado",
            description: "Nenhum orçamento corresponde aos filtros selecionados.",
            variant: "default"
        })
    }
  };

  const handleGeneratePdf = () => {
    if (reportData.length === 0) {
      toast({
          title: "Nenhum dado para PDF",
          description: "Gere um relatório primeiro ou refine seus filtros.",
          variant: "default"
      });
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Relatório de Orçamentos', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateFromString = dateRange?.from ? format(dateRange.from, 'dd/MM/yy') : 'N/A';
    const dateToString = dateRange?.to ? format(dateRange.to, 'dd/MM/yy') : 'N/A';
    doc.text(`Período: ${dateFromString} - ${dateToString}`, 14, 30);
    
    const tableColumn = ["ID", "Cliente", "Status", "Valor Total", "Custo Material", "Margem Estimada"];
    const tableRows: (string | number)[][] = [];

    reportData.forEach(item => {
      const budgetData = [
        item.id.substring(0,8) + '...',
        item.clientName,
        statusTranslations[item.status] || item.status,
        item.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        item.materialCostInternal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        (item.totalAmount - item.materialCostInternal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
      tableRows.push(budgetData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      headStyles: { fillColor: [22, 160, 133] }, 
      didDrawPage: function (_data) {
        // Placeholder for potential footer content on each page
      }
    });
    
    doc.save('relatorio_orcamentos.pdf');
    toast({ title: 'PDF Gerado', description: 'O relatório de orçamentos foi gerado em PDF.' });
  };

  if (isLoadingBudgets || isLoadingClients) {
    return (
      <>
        <PageHeader title="Relatórios" description="Analise o desempenho do seu negócio." />
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados para relatórios...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Relatórios" description="Analise o desempenho do seu negócio." />

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
          <CardDescription>Selecione os filtros para gerar o relatório de orçamentos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date-range">Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'dd/MM/yy')} - ${format(dateRange.to, 'dd/MM/yy')}`
                      ) : (
                        format(dateRange.from, 'dd/MM/yy')
                      )
                    ) : (
                      <span>Selecione um período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="status-filter">Status do Orçamento</Label>
               <Select value={statusFilter} onValueChange={(value: BudgetStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger id="status-filter" className="mt-1">
                    <SelectValue placeholder="Todos Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    {(Object.keys(statusTranslations) as BudgetStatus[]).map(s => (
                        <SelectItem key={s} value={s}>{statusTranslations[s]}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client-filter">Cliente</Label>
              <Select value={clientFilter} onValueChange={(value: string | 'all') => setClientFilter(value)}>
                <SelectTrigger id="client-filter" className="mt-1" disabled={isLoadingClients}>
                    <SelectValue placeholder={isLoadingClients ? "Carregando clientes..." : "Todos Clientes"} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos Clientes</SelectItem>
                    {allClients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    {!isLoadingClients && allClients.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button onClick={handleGenerateReport} disabled={isLoadingBudgets || isLoadingClients}>
                { (isLoadingBudgets || isLoadingClients) && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
                Gerar Relatório
            </Button>
            <Button variant="outline" onClick={handleGeneratePdf} disabled={reportData.length === 0 || isLoadingBudgets || isLoadingClients}>
              <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReportView
        data={reportData}
        title="Relatório de Orçamentos"
        description={reportData.length > 0 ? `Exibindo ${reportData.length} orçamento(s) ${dateRange?.from ? `de ${format(dateRange.from, 'dd/MM/yy')}` : ''} ${dateRange?.to ? `até ${format(dateRange.to, 'dd/MM/yy')}` : ''}.` : "Nenhum relatório gerado ou dados encontrados para os filtros."}
      />
    </>
  );
}
