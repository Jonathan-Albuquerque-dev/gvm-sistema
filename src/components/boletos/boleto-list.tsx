
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, MoreVertical, Eye, Loader2 } from 'lucide-react';
import type { Boleto, BoletoParcelaStatus } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface BoletoListProps {
  boletos: Boleto[];
  isLoading: boolean;
}

type AggregatedStatusKey = "quitado" | "vencido" | "pendente" | "cancelado" | "proximo" | "sem_parcelas";

const getAggregatedStatus = (boleto: Boleto): { text: string, key: AggregatedStatusKey, variant: "default" | "secondary" | "destructive" | "outline" } => {
    const today = startOfDay(new Date());

    if (!boleto.installments || boleto.installments.length === 0) {
        return { text: "Sem Parcelas", key: "sem_parcelas", variant: "secondary" };
    }

    let allPaid = true;
    let hasOverdueInstallment = false;
    let nextDueDate: Date | null = null;
    let allCancelled = true;
    // let hasPendingInstallment = false; // Not strictly needed if other flags are comprehensive

    for (const installment of boleto.installments) {
        if (installment.status !== 'pago') {
            allPaid = false;
        }
        if (installment.status !== 'cancelado') {
            allCancelled = false;
        }

        // Only consider non-cancelled installments for overdue and next due date logic
        if (installment.status !== 'cancelado') {
            const dueDate = startOfDay(parseISO(installment.dueDate));
            if (installment.status === 'pendente') {
                // hasPendingInstallment = true;
                if (isBefore(dueDate, today)) {
                    hasOverdueInstallment = true; // Pending and past due date means an overdue installment
                } else { // Pending and due date is today or in the future
                    if (!nextDueDate || isBefore(dueDate, nextDueDate)) {
                        nextDueDate = dueDate;
                    }
                }
            } else if (installment.status === 'vencido') {
                hasOverdueInstallment = true;
            }
        }
    }

    if (allPaid) return { text: "Quitado", key: "quitado", variant: "default" };
    // If all installments are cancelled, it's "Cancelado", regardless of other states.
    if (allCancelled) return {text: "Cancelado", key: "cancelado", variant: "secondary"};
    
    // If not all paid and not all cancelled, then check for active states:
    if (hasOverdueInstallment) return { text: "Vencido", key: "vencido", variant: "destructive" };
    if (nextDueDate) return { text: `Próx: ${format(nextDueDate, 'dd/MM/yy', { locale: ptBR })}`, key: "proximo", variant: "outline" }; 
    
    // Fallback: If it's not quitado, not (all) cancelado, not vencido, and has no future pending installments,
    // it's likely in a general "pendente" state (e.g., manually set, or an edge case).
    // This implies all its active installments might be past due but somehow not caught by hasOverdueInstallment (unlikely with current logic),
    // or it's an unusual state.
    return { text: "Pendente", key: "pendente", variant: "secondary" };
};


export function BoletoList({ boletos, isLoading }: BoletoListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<AggregatedStatusKey | 'todos' | 'ativos'>('ativos');
  const { toast } = useToast();
  const router = useRouter();

  const handleEdit = (boletoId: string) => {
    router.push(`/boletos/${boletoId}/edit`);
  };

  const handleDelete = async (boletoId: string, clientName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir os boletos para "${clientName}" (ID: ${boletoId.substring(0,8)})?`)) {
        return;
    }
    try {
      await deleteDoc(doc(db, 'boletos', boletoId));
      toast({
        title: 'Boletos Excluídos!',
        description: `Os boletos para "${clientName}" foram excluídos.`,
      });
    } catch (error) {
      console.error("Erro ao excluir boletos:", error);
      toast({ title: 'Erro ao Excluir', variant: 'destructive' });
    }
  };

  const handleViewDetails = (boletoId: string) => {
    router.push(`/boletos/${boletoId}`);
  };
  
  const filteredBoletos = boletos.filter(boleto => {
    const searchString = boleto.clientName?.toLowerCase() || '';
    const matchesSearch = searchString.includes(searchTerm.toLowerCase()) ||
                          boleto.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const statusInfo = getAggregatedStatus(boleto);

    if (viewFilter === 'todos') return true;
    if (viewFilter === 'ativos') { // Shows pending (including 'proximo') and vencido
        return statusInfo.key === 'pendente' || statusInfo.key === 'vencido' || statusInfo.key === 'proximo';
    }
    if (viewFilter === 'pendente') { // Specifically 'pendente' or 'proximo'
        return statusInfo.key === 'pendente' || statusInfo.key === 'proximo';
    }
    // For 'vencido', 'quitado', 'cancelado', 'proximo', 'sem_parcelas'
    return statusInfo.key === viewFilter;
  });

  if (isLoading && boletos.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando boletos...</p>
      </div>
    );
  }
  
  const filterOptions: {value: typeof viewFilter, label: string}[] = [
    {value: 'ativos', label: 'Ativos (Pendente/Vencido/Próximo)'},
    {value: 'quitado', label: 'Quitados'},
    {value: 'cancelado', label: 'Cancelados'},
    {value: 'pendente', label: 'Pendentes (inclui Próximos)'},
    {value: 'vencido', label: 'Vencidos'},
    {value: 'proximo', label: 'Próximos Vencimentos'},
    {value: 'todos', label: 'Todos os Boletos'},
  ]

  return (
     <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input 
            placeholder="Buscar por cliente ou ID do boleto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full" 
        />
        <Select value={viewFilter} onValueChange={(value: typeof viewFilter) => setViewFilter(value)}>
            <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder="Filtrar por status..." />
            </SelectTrigger>
            <SelectContent>
                {filterOptions.map(opt => (
                     <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] sm:w-[120px]">ID Boleto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-center hidden md:table-cell">Parcelas</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-center">Status Agregado</TableHead>
              <TableHead className="text-right w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBoletos.length > 0 ? (
              filteredBoletos.map((boleto) => {
                const statusInfo = getAggregatedStatus(boleto);
                return (
                    <TableRow key={boleto.id}>
                    <TableCell className="font-mono text-xs">{boleto.id.substring(0,8)}...</TableCell>
                    <TableCell className="font-medium">{boleto.clientName}</TableCell>
                    <TableCell className="text-center hidden md:table-cell">{boleto.numberOfInstallments}</TableCell>
                    <TableCell className="text-right">{boleto.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant={statusInfo.variant} className="text-xs px-2 py-0.5">
                            {statusInfo.text}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(boleto.id)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(boleto.id)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(boleto.id, boleto.clientName)} className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum boleto encontrado para o filtro "{filterOptions.find(f=>f.value === viewFilter)?.label || viewFilter}"
                  {searchTerm && ` e busca "${searchTerm}"`}.
                  {boletos.length === 0 && !searchTerm && !isLoading ? " Cadastre o primeiro." : ""}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
           {filteredBoletos.length === 0 && (boletos.length > 0 || searchTerm) && !isLoading && (
             <TableCaption>
                Nenhum boleto encontrado para o filtro "{filterOptions.find(f=>f.value === viewFilter)?.label || viewFilter}"
                {searchTerm && ` e busca "${searchTerm}"`}.
            </TableCaption>
           )}
        </Table>
      </div>
    </div>
  );
}

    
