
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, MoreVertical, Eye, Loader2, ReceiptText } from 'lucide-react';
import type { Boleto, BoletoParcelaStatus } from '@/types';
import { Input } from '@/components/ui/input';
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

const getAggregatedStatus = (boleto: Boleto): { text: string, variant: "default" | "secondary" | "destructive" | "outline" } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare dates only

    let allPaid = true;
    let hasOverdue = false;
    let nextDueDate: Date | null = null;

    for (const installment of boleto.installments) {
        if (installment.status !== 'pago' && installment.status !== 'cancelado') {
            allPaid = false;
            const dueDate = parseISO(installment.dueDate);
            if (dueDate < today && installment.status !== 'pago') {
                hasOverdue = true;
            }
            if (!nextDueDate || dueDate < nextDueDate) {
                if (installment.status === 'pendente' || installment.status === 'vencido') {
                    nextDueDate = dueDate;
                }
            }
        }
    }

    if (allPaid) return { text: "Quitado", variant: "default" }; // Green-like
    if (hasOverdue) return { text: "Vencido", variant: "destructive" }; // Red
    if (nextDueDate) return { text: `Próx: ${format(nextDueDate, 'dd/MM/yy')}`, variant: "outline" }; // Blue/Info like
    
    const allCancelled = boleto.installments.every(inst => inst.status === 'cancelado');
    if (allCancelled && boleto.installments.length > 0) return {text: "Cancelado", variant: "secondary"};

    return { text: "Pendente", variant: "secondary" }; // Yellow-like
};


export function BoletoList({ boletos, isLoading }: BoletoListProps) {
  const [searchTerm, setSearchTerm] = useState('');
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
    return searchString.includes(searchTerm.toLowerCase()) ||
           boleto.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading && boletos.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando boletos...</p>
      </div>
    );
  }

  return (
     <div className="space-y-4">
      <Input 
          placeholder="Buscar por cliente ou ID do boleto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
      />
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
                  Nenhum boleto encontrado. {boletos.length === 0 && !searchTerm && !isLoading ? "Cadastre o primeiro." : ""}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
           {filteredBoletos.length === 0 && (boletos.length > 0 || searchTerm) && !isLoading && (
             <TableCaption>Nenhum boleto encontrado para os filtros aplicados.</TableCaption>
           )}
        </Table>
      </div>
    </div>
  );
}

