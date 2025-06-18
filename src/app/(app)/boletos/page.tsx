
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BoletoList } from '@/components/boletos/boleto-list';
import { PlusCircle, ReceiptText, Landmark, CalendarCheck2, Loader2, AlertTriangle as AlertTriangleIcon, CalendarClock, FileWarning, FileDown } from 'lucide-react';
import type { Boleto, BoletoParcela, BoletoParcelaStatus } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, isSameMonth, parseISO, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const parcelaStatusTranslations: Record<BoletoParcelaStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
};

export default function BoletosPage() {
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'boletos'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const boletosData: Boleto[] = [];
      querySnapshot.forEach((doc) => {
        boletosData.push({ id: doc.id, ...doc.data() } as Boleto);
      });
      setBoletos(boletosData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar boletos:", error);
      toast({ title: "Erro ao buscar boletos", description: "Não foi possível carregar a lista de boletos.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const dashboardData = useMemo(() => {
    const today = startOfDay(new Date());
    let totalToReceiveThisMonth = 0;
    let totalToReceiveOverall = 0;
    let overdueBoletosCount = 0;
    const overdueBoletosIds = new Set<string>();
    let dueSoonBoletosCount = 0;
    const dueSoonBoletosIds = new Set<string>();
    let totalOverdueAmount = 0;

    boletos.forEach(boleto => {
      let hasOverdueInstallmentInBoleto = false;
      let hasDueSoonInstallmentInBoleto = false;

      boleto.installments.forEach(installment => {
        const dueDate = startOfDay(parseISO(installment.dueDate));

        if (installment.status === 'pendente' || installment.status === 'vencido') {
          totalToReceiveOverall += installment.value;
          if (isSameMonth(dueDate, today)) {
            totalToReceiveThisMonth += installment.value;
          }
        }

        if (installment.status === 'vencido') {
          totalOverdueAmount += installment.value;
          hasOverdueInstallmentInBoleto = true;
        } else if (installment.status === 'pendente' && isBefore(dueDate, today)) {
          totalOverdueAmount += installment.value;
          hasOverdueInstallmentInBoleto = true;
        }
        
        if (installment.status === 'pendente') {
          const daysDiff = differenceInDays(dueDate, today);
          if (daysDiff >= 0 && daysDiff <= 5) {
            hasDueSoonInstallmentInBoleto = true;
          }
        }
      });

      if (hasOverdueInstallmentInBoleto) {
        overdueBoletosIds.add(boleto.id);
      }
      if (hasDueSoonInstallmentInBoleto) {
        dueSoonBoletosIds.add(boleto.id);
      }
    });
    
    overdueBoletosCount = overdueBoletosIds.size;
    dueSoonBoletosCount = dueSoonBoletosIds.size;

    return {
      totalBoletos: boletos.length,
      totalToReceiveThisMonth,
      totalToReceiveOverall,
      overdueBoletosCount,
      dueSoonBoletosCount,
      totalOverdueAmount,
    };
  }, [boletos]);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleGenerateAllParcelasPdf = () => {
    if (boletos.length === 0) {
      toast({
          title: "Nenhum boleto para listar",
          description: "Não há boletos cadastrados para gerar o relatório de parcelas.",
          variant: "default"
      });
      return;
    }

    const allParcelas: (BoletoParcela & { clientName: string; boletoId: string; totalInstallments: number })[] = [];
    boletos.forEach(boleto => {
      boleto.installments.forEach(parcela => {
        // Filtra para incluir apenas parcelas pendentes ou vencidas
        if (parcela.status === 'pendente' || parcela.status === 'vencido') {
          allParcelas.push({
            ...parcela,
            clientName: boleto.clientName,
            boletoId: boleto.id,
            totalInstallments: boleto.numberOfInstallments,
          });
        }
      });
    });

    if (allParcelas.length === 0) {
        toast({
            title: "Nenhuma parcela pendente ou vencida",
            description: "Não há parcelas com status 'Pendente' ou 'Vencido' nos boletos cadastrados.",
            variant: "default"
        });
        return;
    }
    
    allParcelas.sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let currentY = 22;

    doc.setFontSize(18);
    doc.text('Relatório de Parcelas Pendentes e Vencidas', margin, currentY);
    currentY += 8;
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin, currentY);
    currentY += 10;
    
    const tableColumn = ["Cliente", "ID Boleto", "Nº Parcela", "Vencimento", "Valor Parcela (R$)", "Status Parcela"];
    const tableRows: (string | number)[][] = [];

    allParcelas.forEach(parcela => {
      const parcelaDataRow = [
        parcela.clientName,
        parcela.boletoId.substring(0, 8) + '...',
        `${parcela.parcelNumber}/${parcela.totalInstallments}`,
        format(parseISO(parcela.dueDate), "dd/MM/yyyy", { locale: ptBR }),
        formatCurrency(parcela.value),
        parcelaStatusTranslations[parcela.status] || parcela.status
      ];
      tableRows.push(parcelaDataRow);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      headStyles: { fillColor: [22, 160, 133] }, 
      columnStyles: {
        0: { cellWidth: 'auto' }, 
        1: { cellWidth: 25 }, 
        2: { cellWidth: 22, halign: 'center' }, 
        3: { cellWidth: 25, halign: 'center' }, 
        4: { cellWidth: 35, halign: 'right' }, 
        5: { cellWidth: 28, halign: 'center' }, 
      },
    });
    
    const fileName = 'relatorio_parcelas_pendentes_vencidas.pdf';
    doc.save(fileName);
    toast({ title: 'PDF de Parcelas Gerado', description: 'O relatório de parcelas pendentes e vencidas foi gerado.' });
  };


  if (isLoading && boletos.length === 0) { 
    return (
      <>
        <PageHeader title="Boletos" description="Gerencie seus boletos a receber."/>
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados de boletos...</p>
        </div>
      </>
    );
  }


  return (
    <>
      <PageHeader title="Boletos" description="Gerencie seus boletos a receber.">
        <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleGenerateAllParcelasPdf} variant="outline" disabled={isLoading || boletos.length === 0}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
              Relatório de Parcelas PDF
            </Button>
          <Link href="/boletos/new">
            <Button disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Boleto
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cadastrados</CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : dashboardData.totalBoletos}</div>
            <p className="text-xs text-muted-foreground">Conjuntos de boletos no sistema</p>
          </CardContent>
        </Card>

        <Card className="border-destructive dark:border-destructive/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive dark:text-destructive/90">Boletos Vencidos</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-destructive dark:text-destructive/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive dark:text-destructive/90">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : dashboardData.overdueBoletosCount}</div>
            <p className="text-xs text-destructive/80 dark:text-destructive/70">Conjuntos com parcelas vencidas</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500 dark:border-amber-400/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-500">A Vencer (Próx. 5 dias)</CardTitle>
            <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-500">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : dashboardData.dueSoonBoletosCount}</div>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/70">Conjuntos com vencimento próximo</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber Este Mês</CardTitle>
            <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(dashboardData.totalToReceiveThisMonth)}</div>
            <p className="text-xs text-muted-foreground">Previsto para {format(new Date(), 'MMMM/yyyy', { locale: ptBR })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral a Receber</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(dashboardData.totalToReceiveOverall)}</div>
            <p className="text-xs text-muted-foreground">Soma de todas parcelas pendentes</p>
          </CardContent>
        </Card>
        
        <Card className="border-destructive dark:border-destructive/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive dark:text-destructive/90">Valor a Receber (Vencidos)</CardTitle>
            <FileWarning className="h-4 w-4 text-destructive dark:text-destructive/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive dark:text-destructive/90">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(dashboardData.totalOverdueAmount)}</div>
            <p className="text-xs text-destructive/80 dark:text-destructive/70">Soma de todas parcelas vencidas</p>
          </CardContent>
        </Card>
      </div>
      
      <BoletoList boletos={boletos} isLoading={isLoading} />
    </>
  );
}
    

    

    

