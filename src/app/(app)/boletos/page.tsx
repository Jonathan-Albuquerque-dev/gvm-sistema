
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BoletoList } from '@/components/boletos/boleto-list';
import { PlusCircle, ReceiptText, Landmark, CalendarCheck2, Loader2, AlertTriangle as AlertTriangleIcon, CalendarClock, FileWarning } from 'lucide-react';
import type { Boleto } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, isSameMonth, parseISO, isBefore, addDays, startOfDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

        // Calculations for "A Receber Este Mês" and "Total Geral a Receber"
        if (installment.status === 'pendente' || installment.status === 'vencido') {
          totalToReceiveOverall += installment.value;
          if (isSameMonth(dueDate, today)) {
            totalToReceiveThisMonth += installment.value;
          }
        }

        // Calculations for "Boletos Vencidos" (Count and Value)
        if (installment.status === 'vencido') {
          totalOverdueAmount += installment.value;
          hasOverdueInstallmentInBoleto = true;
        } else if (installment.status === 'pendente' && isBefore(dueDate, today)) {
          // Consider pendente as vencido if due date is in the past (Firestore update might be pending)
          // This part might be redundant if status is reliably updated to 'vencido'
          // but kept for safety for now.
          totalOverdueAmount += installment.value;
          hasOverdueInstallmentInBoleto = true;
        }
        
        // Calculations for "Boletos a Vencer (Próximos 5 dias)"
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
        <Link href="/boletos/new">
          <Button disabled={isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Boleto
          </Button>
        </Link>
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
