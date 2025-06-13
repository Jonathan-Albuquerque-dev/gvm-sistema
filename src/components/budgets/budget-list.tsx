
'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, MoreVertical, Eye, FileDown } from 'lucide-react';
import { MOCK_BUDGETS, MOCK_PRODUCTS } from '@/lib/mock-data'; // MOCK_PRODUCTS is needed for item details
import type { Budget, BudgetStatus, Product } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


const statusLabels: Record<BudgetStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const statusColors: Record<BudgetStatus, string> = {
  draft: 'bg-yellow-500 hover:bg-yellow-600',
  sent: 'bg-blue-500 hover:bg-blue-600',
  approved: 'bg-green-500 hover:bg-green-600',
  rejected: 'bg-red-500 hover:bg-red-600',
};


export function BudgetList() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // Store products for PDF details
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all');
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    // Simulate API call
    setBudgets(MOCK_BUDGETS);
    setProducts(MOCK_PRODUCTS); // Load products
  }, []);

  const handleEdit = (budgetId: string) => {
    toast({
      title: 'Edição em Desenvolvimento',
      description: `A funcionalidade para editar o orçamento ${budgetId.substring(0,8)}... está sendo implementada. Em breve você poderá acessar /budgets/edit/${budgetId}`,
    });
    // router.push(`/budgets/edit/${budgetId}`); // Future implementation
  };

  const handleDelete = (budgetId: string) => {
    setBudgets(prevBudgets => prevBudgets.filter(budget => budget.id !== budgetId));
    toast({
      title: 'Orçamento Excluído',
      description: `O orçamento ${budgetId.substring(0,8)}... foi excluído (localmente).`,
    });
  };

  const handleViewDetails = (budgetId: string) => {
    toast({
      title: 'Visualização em Desenvolvimento',
      description: `A funcionalidade para ver detalhes do orçamento ${budgetId.substring(0,8)}... está sendo implementada.`,
    });
    // router.push(`/budgets/${budgetId}`); // Future implementation
  };

  const handleDownloadPdf = (budget: Budget) => {
    const doc = new jsPDF();
    const clientName = budget.clientName || "Cliente não informado";
    const budgetIdShort = budget.id.substring(0,8) + '...';

    doc.setFontSize(18);
    doc.text(`Orçamento: ${budgetIdShort}`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Cliente: ${clientName}`, 14, 30);
    doc.text(`Data de Criação: ${format(new Date(budget.createdAt), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 36);
    doc.text(`Status: ${statusLabels[budget.status] || budget.status}`, 14, 42);

    const tableColumn = ["Produto", "Qtd.", "Preço Unit.", "Preço Total"];
    const tableRows: (string | number)[][] = [];

    budget.items.forEach(item => {
      const productDetails = products.find(p => p.id === item.productId);
      const itemName = productDetails?.name || item.productName || 'Produto Desconhecido';
      const unitPrice = item.unitPrice || 0;
      const quantity = item.quantity || 0;
      const totalPrice = item.totalPrice || (unitPrice * quantity);

      const budgetItemData = [
        itemName,
        quantity,
        unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
      tableRows.push(budgetItemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      headStyles: { fillColor: [22, 160, 133] }, // Example green color
      footStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
      foot: [
        [{ content: 'Valor Total do Orçamento:', colSpan: 3, styles: { halign: 'right' } }, 
         { content: budget.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), styles: { halign: 'right' }}]
      ],
    });
    
    doc.save(`orcamento_${clientName.replace(/\s+/g, '_')}_${budgetIdShort}.pdf`);
    toast({
      title: 'PDF Gerado',
      description: `O PDF para o orçamento ${budgetIdShort} foi gerado com sucesso.`,
    });
  };
  
  const filteredBudgets = budgets.filter(budget => {
    const matchesSearchTerm = budget.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              budget.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || budget.status === statusFilter;
    return matchesSearchTerm && matchesStatus;
  });

  return (
     <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
            placeholder="Buscar por cliente ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={(value: BudgetStatus | 'all') => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value as BudgetStatus}>{label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Data Criação</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBudgets.length > 0 ? (
              filteredBudgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-mono text-xs">{budget.id.substring(0,8)}...</TableCell>
                  <TableCell className="font-medium">{budget.clientName}</TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(budget.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{budget.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[budget.status]} text-white`}>{statusLabels[budget.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(budget.id)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(budget.id)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPdf(budget)}>
                          <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(budget.id)} className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum orçamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
            {filteredBudgets.length === 0 && (searchTerm || statusFilter !== 'all') && (
             <TableCaption>Nenhum orçamento encontrado para os filtros aplicados.</TableCaption>
           )}
        </Table>
      </div>
    </div>
  );
}

