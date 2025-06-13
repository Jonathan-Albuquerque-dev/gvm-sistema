
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
import { CalendarIcon, FileDown } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { MOCK_BUDGETS, MOCK_CLIENTS } from '@/lib/mock-data';
import type { Budget, BudgetStatus, Client, ProductCategory } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all');
  const [clientFilter, setClientFilter] = useState<string | 'all'>('all');
  // const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all'); // For product-based reports

  const [reportData, setReportData] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    setClients(MOCK_CLIENTS);
  }, []);

  const filteredReportData = useMemo(() => {
    return MOCK_BUDGETS.filter(budget => {
      const budgetDate = new Date(budget.createdAt);
      const matchesDate = dateRange?.from && dateRange?.to ?
                          budgetDate >= dateRange.from && budgetDate <= dateRange.to : true;
      const matchesStatus = statusFilter === 'all' || budget.status === statusFilter;
      const matchesClient = clientFilter === 'all' || budget.clientId === clientFilter;

      return matchesDate && matchesStatus && matchesClient;
    });
  }, [dateRange, statusFilter, clientFilter]);

  const handleGenerateReport = () => {
    setReportData(filteredReportData);
  };

  const handleGeneratePdf = () => {
    if (reportData.length === 0) {
      console.log("Nenhum dado para gerar PDF.");
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
        item.status.charAt(0).toUpperCase() + item.status.slice(1),
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
      headStyles: { fillColor: [22, 160, 133] }, // Exemplo de cor de cabeçalho
      didDrawPage: function (data) {
        // Adicionar totalizadores no final da tabela, se necessário.
        // Exemplo: doc.text("Total: " + totalVendido, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });
    
    doc.save('relatorio_orcamentos.pdf');
    console.log("Gerar PDF para os relatórios:", reportData);
  };

  return (
    <>
      <PageHeader title="Relatórios" description="Analise o desempenho do seu negócio." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
          <CardDescription>Selecione os filtros para gerar o relatório de orçamentos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    {(['draft', 'sent', 'approved', 'rejected'] as BudgetStatus[]).map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client-filter">Cliente</Label>
              <Select value={clientFilter} onValueChange={(value: string | 'all') => setClientFilter(value)}>
                <SelectTrigger id="client-filter" className="mt-1">
                    <SelectValue placeholder="Todos Clientes" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos Clientes</SelectItem>
                    {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {/* Category filter placeholder - might be used for different report types */}
            {/* <div>
              <Label htmlFor="category-filter">Categoria de Produto</Label>
               <Select value={categoryFilter} onValueChange={(value: ProductCategory | 'all') => setCategoryFilter(value)}>
                 <SelectTrigger id="category-filter" className="mt-1">
                    <SelectValue placeholder="Todas Categorias" />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {(['electrical', 'hydraulic', 'carpentry', 'other'] as ProductCategory[]).map(cat => (
                         <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                    ))}
                 </SelectContent>
               </Select>
            </div> */}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button onClick={handleGenerateReport}>Gerar Relatório</Button>
            <Button variant="outline" onClick={handleGeneratePdf} disabled={reportData.length === 0}>
              <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReportView
        data={reportData}
        title="Relatório de Orçamentos"
        description={`Exibindo orçamentos ${dateRange?.from ? `de ${format(dateRange.from, 'dd/MM/yy')}` : ''} ${dateRange?.to ? `até ${format(dateRange.to, 'dd/MM/yy')}` : ''}.`}
      />
    </>
  );
}
