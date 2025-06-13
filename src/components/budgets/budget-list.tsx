
'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, MoreVertical, Eye, FileDown } from 'lucide-react';
import { MOCK_BUDGETS, MOCK_PRODUCTS, MOCK_CLIENTS } from '@/lib/mock-data';
import type { Budget, BudgetStatus, Product, Client } from '@/types';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all');
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    setBudgets(MOCK_BUDGETS);
    setProducts(MOCK_PRODUCTS);
    setClients(MOCK_CLIENTS);
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
    const currentClient = clients.find(c => c.id === budget.clientId);

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    let currentY = 20;

    // Header Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("GVM", margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text("IND. DE GONDOLAS E CHECKOUTS", margin + 8, currentY);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("PEDIDO DE VENDA", pageWidth / 2, currentY, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(), 'dd/MM/yyyy', { locale: ptBR }), pageWidth - margin, currentY, { align: 'right' });

    currentY += 6;
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // Client Information Section
    doc.setFontSize(8);
    const fieldHeight = 5;
    const col1X = margin;
    const col2X = margin + contentWidth / 2.2;

    const clientDetails = [
      { label: "CLIENTE:", value: currentClient?.name || budget.clientName || "N/A" },
      { label: "ENDEREÇO:", value: currentClient?.address || "N/A" },
      { label: "CNPJ:", value: currentClient?.document || "N/A" },
    ];
    const clientDetailsCol2 = [
      { label: "RAZÃO SOCIAL:", value: currentClient?.companyName || (currentClient?.name.includes(' ') ? "N/A" : "Pessoa Física") },
      { label: "IE:", value: "N/A" }, // Placeholder
      { label: "CEP:", value: "N/A" }, // Placeholder
      { label: "TEL:", value: currentClient?.phone || "N/A" },
    ];

    clientDetails.forEach(detail => {
      doc.setFont('helvetica', 'bold');
      doc.text(detail.label, col1X, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(detail.value, col1X + 25, currentY, {maxWidth: contentWidth / 2.5 - 25});
      currentY += fieldHeight;
    });
    
    currentY -= clientDetails.length * fieldHeight; 

    let col2StartY = currentY;
    if (clientDetailsCol2.length < clientDetails.length) {
        col2StartY += (clientDetails.length - clientDetailsCol2.length) * fieldHeight / 2;
    }

    clientDetailsCol2.forEach(detail => {
      doc.setFont('helvetica', 'bold');
      doc.text(detail.label, col2X, col2StartY);
      doc.setFont('helvetica', 'normal');
      doc.text(detail.value, col2X + 25, col2StartY, {maxWidth: contentWidth / 2 - 30 });
      col2StartY += fieldHeight;
    });

    currentY += Math.max(clientDetails.length, clientDetailsCol2.length) * fieldHeight - fieldHeight; 
    currentY += 2; 
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // Validity and Delivery Section
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("VALIDO POR 7 DIAS", col1X, currentY);
    doc.text("PRAZO DE ENTREGA", col2X, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text("30 DIAS ULTEIS", col2X + 30, currentY);

    currentY += 6;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 2;

    // Items Table
    const tableColumn = ["CÓDIGO", "DESCRIÇÃO", "QTDA", "VALOR UNI", "TOTAL"];
    const tableRows: (string | number)[][] = [];

    budget.items.forEach(item => {
      const productDetails = products.find(p => p.id === item.productId);
      const itemName = productDetails?.name || item.productName || 'Produto Desconhecido';
      const unitPrice = item.unitPrice || 0;
      const quantity = item.quantity || 0;
      const totalPrice = item.totalPrice || (unitPrice * quantity);

      const budgetItemData = [
        item.productId.substring(0,8).toUpperCase(),
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
      startY: currentY,
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 0], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: {top: 1.5, right: 2, bottom: 1.5, left: 2},
      },
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

    // Totals Section
    const totalsData = [
      { label: "VALOR TOTAL", value: budget.totalAmount },
      { label: "DESCONTO", value: 0 },
      { label: "IMPOSTOS", value: 0 },
      { label: "TRANSPORTE", value: 0 },
      { label: "VALOR FINAL", value: budget.totalAmount, isFinal: true }
    ];

    const totalRowHeight = 10; // Increased row height
    const totalLabelColumnWidth = 50;
    const totalValueColumnWidth = 40;
    const textPadding = 2;

    const totalBlockXStart = pageWidth - margin - (totalLabelColumnWidth + totalValueColumnWidth);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    totalsData.forEach(total => {
      const labelCellX = totalBlockXStart;
      const valueCellX = totalBlockXStart + totalLabelColumnWidth;

      if (total.isFinal) {
        doc.setFillColor(50, 205, 50); // Green
        doc.rect(labelCellX, currentY, totalLabelColumnWidth + totalValueColumnWidth, totalRowHeight, 'F');
        doc.setTextColor(255, 255, 255); // White text
      } else {
        doc.setTextColor(0, 0, 0); // Black text
      }
      
      doc.setDrawColor(0); // Black border for cells
      doc.rect(labelCellX, currentY, totalLabelColumnWidth, totalRowHeight);
      doc.text(total.label, labelCellX + textPadding, currentY + totalRowHeight / 2, { align: 'left', baseline: 'middle' });
      
      doc.rect(valueCellX, currentY, totalValueColumnWidth, totalRowHeight);
      const formattedValue = total.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      doc.text(formattedValue, valueCellX + totalValueColumnWidth - textPadding, currentY + totalRowHeight / 2, { align: 'right', baseline: 'middle' });
      
      currentY += totalRowHeight;
    });
    doc.setTextColor(0, 0, 0); // Reset text color

    currentY += 5; // Space after totals block

    // Observations Section
    doc.setFont('helvetica', 'bold');
    doc.text("OBSERVAÇÕES:", margin, currentY);
    currentY += 3;
    doc.setLineWidth(0.2);
    doc.rect(margin, currentY, contentWidth, 20); 
    currentY += 20 + 5; 

    // Footer Section
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const companyContact = "CONTATO: (85) 9.8764-5281";
    const companyAddress = "Rua Paolo Afonço, 3703 Maracanaú-CE / CNPJ: 36.245.901/0001-90";
    doc.text(companyContact, margin, currentY);
    currentY += 4;
    doc.text(companyAddress, margin, currentY);
    currentY += 6;
    
    doc.line(margin, currentY, pageWidth - margin, currentY); 
    currentY += 8;

    // Signature Lines
    doc.setFontSize(8);
    const signatureY = doc.internal.pageSize.getHeight() - 25 > currentY ? doc.internal.pageSize.getHeight() - 25 : currentY;

    doc.line(margin + 10, signatureY, margin + 70, signatureY);
    doc.text("Cliente", margin + 40, signatureY + 4, { align: 'center'}); // Centered text

    doc.line(pageWidth - margin - 70, signatureY, pageWidth - margin - 10, signatureY);
    doc.text("Vendedor", pageWidth - margin - 40, signatureY + 4, {align: 'center'}); // Centered text
    
    doc.save(`pedido_venda_${budget.clientName.replace(/\s+/g, '_')}_${budget.id.substring(0,6)}.pdf`);
    toast({
      title: 'PDF Gerado',
      description: `O PDF para o orçamento ${budget.id.substring(0,8)} foi gerado com sucesso.`,
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

