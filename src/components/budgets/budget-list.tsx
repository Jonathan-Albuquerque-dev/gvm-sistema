
'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, MoreVertical, Eye, FileDown, Loader2 } from 'lucide-react';
import type { Budget, BudgetStatus, Product, Client } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';


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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all');
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'budgets'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const budgetsData: Budget[] = [];
      querySnapshot.forEach((doc) => {
        budgetsData.push({ id: doc.id, ...doc.data() } as Budget);
      });
      setBudgets(budgetsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar orçamentos:", error);
      toast({ title: "Erro ao buscar orçamentos", description: "Não foi possível carregar a lista.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleEdit = (budgetId: string) => {
    router.push(`/budgets/${budgetId}/edit`);
  };

  const handleDelete = async (budgetId: string, budgetClientName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o orçamento para "${budgetClientName}" (ID: ${budgetId.substring(0,8)})?`)) {
        return;
    }
    try {
      await deleteDoc(doc(db, 'budgets', budgetId));
      toast({
        title: 'Orçamento Excluído!',
        description: `O orçamento para "${budgetClientName}" foi excluído com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast({
        title: 'Erro ao Excluir',
        description: `Não foi possível excluir o orçamento. Tente novamente.`,
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (budgetId: string) => {
    router.push(`/budgets/${budgetId}`);
  };

  const handleDownloadPdf = (budget: Budget) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    let currentY = 20;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("GVM", margin, currentY);
    doc.setFont('helvetica', 'normal');
    const companyName = "IND. DE GONDOLAS E CHECKOUTS";
    const gvmWidth = doc.getTextWidth("GVM ");
    doc.text(companyName, margin + gvmWidth, currentY, { maxWidth: contentWidth - gvmWidth });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const pedidoVendaX = margin + (contentWidth / 2);
    doc.text("PEDIDO DE VENDA", pedidoVendaX, currentY + 6, { align: 'center', maxWidth: contentWidth });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(), 'dd/MM/yyyy', { locale: ptBR }), pageWidth - margin, currentY, { align: 'right' });

    currentY += 12; 
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    doc.setFontSize(8);
    const fieldHeight = 5;
    const col1X = margin;
    const col2X = margin + contentWidth / 2.2;

    const clientDetails = [
      { label: "CLIENTE:", value: budget.clientName || "N/A" },
      { label: "ENDEREÇO:", value: "N/A (Buscar do Cliente)" }, 
      { label: "CNPJ:", value: "N/A (Buscar do Cliente)" },
    ];
     const clientDetailsCol2 = [
      { label: "RAZÃO SOCIAL:", value: "N/A (Buscar do Cliente)" },
      { label: "IE:", value: "N/A" },
      { label: "CEP:", value: "N/A" },
      { label: "TEL:", value: "N/A (Buscar do Cliente)" },
    ];

    let tempY1 = currentY;
    clientDetails.forEach(detail => {
      doc.setFont('helvetica', 'bold');
      doc.text(detail.label, col1X, tempY1);
      doc.setFont('helvetica', 'normal');
      doc.text(detail.value, col1X + 25, tempY1, {maxWidth: contentWidth / 2.5 - 25});
      tempY1 += fieldHeight;
    });
    
    let tempY2 = currentY;
    clientDetailsCol2.forEach(detail => {
      doc.setFont('helvetica', 'bold');
      doc.text(detail.label, col2X, tempY2);
      doc.setFont('helvetica', 'normal');
      doc.text(detail.value, col2X + 25, tempY2, {maxWidth: contentWidth / 2 - 30 });
      tempY2 += fieldHeight;
    });

    currentY = Math.max(tempY1, tempY2); 
    currentY += 2; 
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("VALIDO POR 7 DIAS", col1X, currentY);
    doc.text("PRAZO DE ENTREGA", col2X, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text("30 DIAS ULTEIS", col2X + 30, currentY);

    currentY += 6;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 2;

    const tableColumn = ["CÓDIGO", "DESCRIÇÃO", "QTDA", "VALOR UNI", "TOTAL"];
    const tableRows: (string | number)[][] = [];

    budget.items.forEach(item => {
      const budgetItemData = [
        item.productId.substring(0,8).toUpperCase(),
        item.productName, 
        item.quantity,
        item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
      tableRows.push(budgetItemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      theme: 'plain',
      headStyles: { fillColor: [255, 255, 0], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, halign: 'center'},
      bodyStyles: { fontSize: 8, cellPadding: {top: 1.5, right: 2, bottom: 1.5, left: 2}, },
      columnStyles: {
        0: { cellWidth: 20, halign: 'left' }, 
        1: { cellWidth: 'auto', halign: 'left' }, 
        2: { cellWidth: 15, halign: 'right' }, 
        3: { cellWidth: 25, halign: 'right' }, 
        4: { cellWidth: 25, halign: 'right' }, 
      },
      margin: { left: margin, right: margin },
      didDrawCell: (data) => {
        if (data.section === 'head') {
            doc.setDrawColor(0);
            doc.setLineWidth(0.1);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    const totalsData = [
      { label: "VALOR TOTAL", value: budget.totalAmount },
      { label: "DESCONTO", value: 0 }, { label: "IMPOSTOS", value: 0 },
      { label: "TRANSPORTE", value: 0 },
      { label: "VALOR FINAL", value: budget.totalAmount, isFinal: true }
    ];
    const totalRowHeight = 10; const totalLabelColumnWidth = 50; const totalValueColumnWidth = 40; const textPadding = 2;
    const totalBlockXStart = pageWidth - margin - (totalLabelColumnWidth + totalValueColumnWidth);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    totalsData.forEach(total => {
      const labelCellX = totalBlockXStart; const valueCellX = totalBlockXStart + totalLabelColumnWidth;
      if (total.isFinal) { doc.setFillColor(50, 205, 50); doc.rect(labelCellX, currentY, totalLabelColumnWidth + totalValueColumnWidth, totalRowHeight, 'F'); doc.setTextColor(255, 255, 255); } else { doc.setTextColor(0, 0, 0); }
      doc.setDrawColor(0); doc.rect(labelCellX, currentY, totalLabelColumnWidth, totalRowHeight);
      doc.text(total.label, labelCellX + textPadding, currentY + totalRowHeight / 2, { align: 'left', baseline: 'middle' });
      doc.rect(valueCellX, currentY, totalValueColumnWidth, totalRowHeight);
      const formattedValue = total.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      doc.text(formattedValue, valueCellX + totalValueColumnWidth - textPadding, currentY + totalRowHeight / 2, { align: 'right', baseline: 'middle' });
      currentY += totalRowHeight;
    });
    doc.setTextColor(0, 0, 0); currentY += 5; 

    doc.setFont('helvetica', 'bold'); doc.text("OBSERVAÇÕES:", margin, currentY); currentY += 3;
    doc.setLineWidth(0.2); doc.rect(margin, currentY, contentWidth, 20); 
    if (budget.observations) { doc.setFont('helvetica', 'normal'); const observationLines = doc.splitTextToSize(budget.observations, contentWidth - 4); doc.text(observationLines, margin + 2, currentY + 4); }
    currentY += 20 + 5; 

    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    const companyContact = "CONTATO: (85) 9.8764-5281"; const companyAddress = "Rua Paolo Afonço, 3703 Maracanaú-CE / CNPJ: 36.245.901/0001-90";
    doc.text(companyContact, margin, currentY); currentY += 4; doc.text(companyAddress, margin, currentY); currentY += 6;
    doc.line(margin, currentY, pageWidth - margin, currentY); currentY += 8;

    doc.setFontSize(8); const signatureY = doc.internal.pageSize.getHeight() - 25 > currentY ? doc.internal.pageSize.getHeight() - 25 : currentY;
    doc.line(margin + 10, signatureY, margin + 70, signatureY); doc.text("Cliente", margin + 40, signatureY + 4, { align: 'center'}); 
    doc.line(pageWidth - margin - 70, signatureY, pageWidth - margin - 10, signatureY); doc.text("Vendedor", pageWidth - margin - 40, signatureY + 4, {align: 'center'}); 
    
    doc.save(`pedido_venda_${budget.clientName.replace(/\s+/g, '_')}_${budget.id.substring(0,6)}.pdf`);
    toast({ title: 'PDF Gerado', description: `O PDF para o orçamento ${budget.id.substring(0,8)} foi gerado.` });
  };
  
  const filteredBudgets = budgets.filter(budget => {
    const searchString = budget.clientName?.toLowerCase() || '';
    const matchesSearchTerm = searchString.includes(searchTerm.toLowerCase()) ||
                              budget.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || budget.status === statusFilter;
    return matchesSearchTerm && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando orçamentos...</p>
      </div>
    );
  }

  return (
     <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
            placeholder="Buscar por cliente ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs"
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
              <TableHead className="w-[100px] sm:w-[120px]">ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell w-[120px]">Data Criação</TableHead>
              <TableHead className="text-right w-[130px] sm:w-[150px]">Valor Total</TableHead>
              <TableHead className="text-center w-[110px] sm:w-[130px]">Status</TableHead>
              <TableHead className="text-right w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBudgets.length > 0 ? (
              filteredBudgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-mono text-xs">{budget.id.substring(0,8)}...</TableCell>
                  <TableCell className="font-medium">{budget.clientName}</TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(budget.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">{budget.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${statusColors[budget.status]} text-white text-xs px-2 py-0.5`}>{statusLabels[budget.status]}</Badge>
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
                        <DropdownMenuItem onClick={() => handleDelete(budget.id, budget.clientName)} className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">
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
                  Nenhum orçamento encontrado. {budgets.length === 0 && !searchTerm && statusFilter === 'all' ? "Crie o primeiro orçamento." : ""}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
            {filteredBudgets.length === 0 && (budgets.length > 0 || searchTerm || statusFilter !== 'all') && (
             <TableCaption>Nenhum orçamento encontrado para os filtros aplicados.</TableCaption>
           )}
        </Table>
      </div>
    </div>
  );
}
    
