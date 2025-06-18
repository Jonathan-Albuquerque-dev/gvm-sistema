
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BoletoList } from '@/components/boletos/boleto-list';
import { PlusCircle, ReceiptText, Landmark, CalendarCheck2, Loader2, AlertTriangle } from 'lucide-react';
import type { Boleto } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, isSameMonth, parseISO } from 'date-fns';

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
    const today = new Date();
    let totalToReceiveThisMonth = 0;
    let totalToReceiveOverall = 0;

    boletos.forEach(boleto => {
      boleto.installments.forEach(installment => {
        if (installment.status === 'pendente' || installment.status === 'vencido') {
          totalToReceiveOverall += installment.value;
          const dueDate = parseISO(installment.dueDate);
          if (isSameMonth(dueDate, today)) {
            totalToReceiveThisMonth += installment.value;
          }
        }
      });
    });

    return {
      totalBoletos: boletos.length,
      totalToReceiveThisMonth,
      totalToReceiveOverall,
    };
  }, [boletos]);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (isLoading && boletos.length === 0) { // Show loader only if initial load and no data yet
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

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cadastrados</CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : dashboardData.totalBoletos}</div>
            <p className="text-xs text-muted-foreground">Boletos no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber Este Mês</CardTitle>
            <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> :formatCurrency(dashboardData.totalToReceiveThisMonth)}</div>
            <p className="text-xs text-muted-foreground">Previsto para {format(new Date(), 'MMMM/yyyy', { locale: require('date-fns/locale/pt-BR').default })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral a Receber</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> :formatCurrency(dashboardData.totalToReceiveOverall)}</div>
            <p className="text-xs text-muted-foreground">Soma de todas parcelas pendentes/vencidas</p>
          </CardContent>
        </Card>
      </div>
      
      <BoletoList boletos={boletos} isLoading={isLoading} />
    </>
  );
}
