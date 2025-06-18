
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, MoreVertical, Eye, Loader2, ReceiptText } from 'lucide-react';
import type { Boleto, BoletoParcelaStatus } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface BoletoListProps {
  boletos: Boleto[];
  isLoading: boolean;
}

type AggregatedStatusKey = "quitado" | "vencido" | "pendente" | "cancelado" | "proximo";

const getAggregatedStatus = (boleto: Boleto): { text: string, key: AggregatedStatusKey, variant: "default" | "secondary" | "destructive" | "outline" } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    let allPaid = true;
    let hasOverdue = false;
    let nextDueDate: Date | null = null;
    let allCancelled = boleto.installments.length > 0; // Assume cancelled if there are installments

    for (const installment of boleto.installments) {
        if (installment.status !== 'pago') {
            allPaid = false;
        }
        if (installment.status !== 'cancelado') {
            allCancelled = false;
        }

        if (installment.status !== 'pago' && installment.status !== 'cancelado') {
            const dueDate = parseISO(installment.dueDate);
            if (dueDate < today) { // No need to check status here, if not paid/cancelled and due date passed, it's effectively overdue
                hasOverdue = true;
            }
            if ((!nextDueDate || dueDate < nextDueDate) && installment.status === 'pendente') {
                 nextDueDate = dueDate;
            }
        }
    }

    if (allPaid && boleto.installments.length > 0) return { text: "Quitado", key: "quitado", variant: "default" };
    if (allCancelled) return {text: "Cancelado", key: "cancelado", variant: "secondary"};
    if (hasOverdue) return { text: "Vencido", key: "vencido", variant: "destructive" };
    if (nextDueDate) return { text: `Próx: ${format(nextDueDate, 'dd/MM/yy')}`, key: "proximo", variant: "outline" }; 
    
    // If no specific status, but not all paid or all cancelled, consider it pending
    if (boleto.installments.length > 0 && !allPaid && !allCancelled) return { text: "Pendente", key: "pendente", variant: "secondary" };

    // Fallback for boletos with no installments or undefined states
    return { text: "Indefinido", key: "pendente", variant: "secondary" };
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
    if (viewFilter === 'ativos') {
        return statusInfo.key === 'pendente' || statusInfo.key === 'vencido' || statusInfo.key === 'proximo';
    }
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
    {value: 'ativos', label: 'Ativos (Pendente/Vencido)'},
    {value: 'quitados', label: 'Quitados'},
    {value: 'cancelados', label: 'Cancelados'},
    {value: 'pendente', label: 'Pendentes'},
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
            <SelectTrigger className="w-full sm:w-[280px]">
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

