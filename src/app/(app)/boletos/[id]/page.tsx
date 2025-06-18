
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, AlertTriangle, Edit, DollarSign, CalendarDays, Hash, Info, UserCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Boleto, BoletoParcela, BoletoParcelaStatus, Client } from '@/types';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const parcelaStatusTranslations: Record<BoletoParcelaStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
};

const parcelaStatusColors: Record<BoletoParcelaStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
  pago: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
  vencido: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  cancelado: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-500',
};


export default function BoletoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const boletoId = params.id as string;

  const [boleto, setBoleto] = useState<Boleto | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoletoAndClient = async () => {
    if (!boletoId) {
      setError("ID do boleto não fornecido.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const boletoDocRef = doc(db, 'boletos', boletoId);
      let boletoDocSnap = await getDoc(boletoDocRef);

      if (boletoDocSnap.exists()) {
        let fetchedBoleto = { id: boletoDocSnap.id, ...boletoDocSnap.data() } as Boleto;
        
        // Auto-update overdue installments
        const today = startOfDay(new Date());
        let installmentsNeedUpdate = false;
        const updatedInstallments = fetchedBoleto.installments.map(inst => {
          if (inst.status === 'pendente' && isBefore(startOfDay(parseISO(inst.dueDate)), today)) {
            installmentsNeedUpdate = true;
            return { ...inst, status: 'vencido' as BoletoParcelaStatus };
          }
          return inst;
        });

        if (installmentsNeedUpdate) {
          try {
            await updateDoc(boletoDocRef, { 
              installments: updatedInstallments,
              updatedAt: new Date().toISOString(),
            });
            fetchedBoleto.installments = updatedInstallments;
            fetchedBoleto.updatedAt = new Date().toISOString();
            // No toast for automatic updates to avoid being too verbose,
            // but you can add one if desired.
            // toast({ title: "Status Atualizado", description: "Algumas parcelas foram marcadas como vencidas."});
          } catch (updateError) {
            console.error("Erro ao atualizar automaticamente status das parcelas:", updateError);
            // Continue with fetchedBoleto even if auto-update fails, but log it.
            // Optionally show a less intrusive error message.
          }
        }
        
        setBoleto(fetchedBoleto);

        if (fetchedBoleto.clientId) {
          const clientDocRef = doc(db, 'clients', fetchedBoleto.clientId);
          const clientDocSnap = await getDoc(clientDocRef);
          if (clientDocSnap.exists()) {
            setClient({ id: clientDocSnap.id, ...clientDocSnap.data()} as Client);
          } else {
            console.warn("Cliente associado ao boleto não encontrado.");
          }
        }
      } else {
        setError("Boleto não encontrado.");
      }
    } catch (err) {
      console.error("Erro ao buscar boleto:", err);
      setError("Falha ao carregar dados do boleto.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBoletoAndClient();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boletoId]);

  const handleParcelaStatusChange = async (parcelNumber: number, newStatus: BoletoParcelaStatus) => {
    if (!boleto) return;

    const updatedInstallments = boleto.installments.map(inst => {
      if (inst.parcelNumber === parcelNumber) {
        const updatedInst = { ...inst, status: newStatus };
        if (newStatus === 'pago' && !inst.paymentDate) {
            updatedInst.paymentDate = new Date().toISOString();
        } else if (newStatus !== 'pago') {
             delete updatedInst.paymentDate;
        }
        return updatedInst;
      }
      return inst;
    });

    try {
      const boletoDocRef = doc(db, 'boletos', boleto.id);
      await updateDoc(boletoDocRef, { 
        installments: updatedInstallments,
        updatedAt: new Date().toISOString(),
      });
      setBoleto(prev => prev ? { ...prev, installments: updatedInstallments, updatedAt: new Date().toISOString() } : null);
      toast({ title: "Status da Parcela Atualizado!", description: `Parcela ${parcelNumber} atualizada para ${parcelaStatusTranslations[newStatus]}.` });
    } catch (err) {
      console.error("Erro ao atualizar status da parcela:", err);
      toast({ title: "Erro ao Atualizar", description: "Não foi possível atualizar o status da parcela.", variant: "destructive" });
    }
  };

  const DetailItem = ({ label, value, Icon, currency = false, className = '' }: { label: string; value?: string | number | null; Icon?: React.ElementType, currency?: boolean, className?: string }) => (
    value !== undefined && value !== null ? (
      <div className={`py-2 ${className}`}>
        <p className="text-sm font-medium text-muted-foreground flex items-center">
          {Icon && <Icon className="mr-1.5 h-4 w-4" />}
          {label}
        </p>
        <p className="text-md">
            {currency && typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value}
        </p>
      </div>
    ) : null
  );

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando detalhes do boleto...</p>
        </div>
    );
  }

  if (error) {
    return (
        <Card className="shadow-lg border-destructive">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div><CardTitle className="text-destructive">Erro</CardTitle><CardDescription className="text-destructive">{error}</CardDescription></div>
          </CardHeader>
        </Card>
    );
  }
  
  if (!boleto) {
    return <p>Boleto não encontrado.</p>;
  }

  return (
    <>
      <PageHeader 
        title={`Boletos de ${boleto.clientName}`}
        description={`Detalhes do conjunto de boletos ID: ${boletoId.substring(0,8)}...`}
      >
        <div className="flex items-center gap-2">
            <Link href={`/boletos/${boletoId}/edit`}>
                <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Editar Boletos</Button>
            </Link>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle>Resumo dos Boletos</CardTitle>
                    <CardDescription>Cliente: <Link href={`/clients/${boleto.clientId}`} className="text-primary hover:underline">{boleto.clientName}</Link></CardDescription>
                </div>
                 {client && client.companyName && <Badge variant="secondary">{client.companyName}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1">
            <DetailItem label="Valor Total" value={boleto.totalAmount} Icon={DollarSign} currency />
            <DetailItem label="Nº de Parcelas" value={boleto.numberOfInstallments} Icon={Hash} />
            <DetailItem label="Venc. 1ª Parcela" value={format(parseISO(boleto.initialDueDate), "dd/MM/yyyy", { locale: ptBR })} Icon={CalendarDays} />
            <DetailItem label="Data de Criação" value={format(parseISO(boleto.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} Icon={CalendarDays} />
            {boleto.updatedAt && <DetailItem label="Última Atualização" value={format(parseISO(boleto.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} Icon={CalendarDays} />}
          </CardContent>
           {boleto.observations && (
             <CardContent className="pt-4 border-t">
                <DetailItem label="Observações" value={boleto.observations} Icon={Info} />
             </CardContent>
           )}
        </Card>

        <Card className="shadow-lg">
          <CardHeader><CardTitle>Parcelas</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Parcela</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                  <TableHead className="text-right w-[180px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boleto.installments.map((inst) => (
                  <TableRow key={inst.parcelNumber}>
                    <TableCell>{inst.parcelNumber} / {boleto.numberOfInstallments}</TableCell>
                    <TableCell>{inst.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    <TableCell>{format(parseISO(inst.dueDate), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>
                        <Badge className={`${parcelaStatusColors[inst.status]} text-xs`}>
                            {parcelaStatusTranslations[inst.status]}
                        </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {inst.paymentDate ? format(parseISO(inst.paymentDate), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        value={inst.status} 
                        onValueChange={(newStatus) => handleParcelaStatusChange(inst.parcelNumber, newStatus as BoletoParcelaStatus)}
                      >
                        <SelectTrigger className="h-8 text-xs w-full max-w-[150px] ml-auto">
                          <SelectValue placeholder="Mudar status" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(parcelaStatusTranslations) as BoletoParcelaStatus[]).map(s => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {parcelaStatusTranslations[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
