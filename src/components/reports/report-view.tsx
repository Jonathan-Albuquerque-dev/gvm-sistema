
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import type { Budget } from '@/types'; // Assuming reports will be based on budgets for now

interface ReportViewProps {
  data: Budget[]; // Example data type, can be more specific for reports
  title: string;
  description?: string;
}

export function ReportView({ data, title, description }: ReportViewProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Nenhum dado para exibir neste relatório.</p>
        </CardContent>
      </Card>
    );
  }

  const totalSold = data.filter(b => b.status === 'approved').reduce((sum, item) => sum + item.totalAmount, 0);
  const estimatedProfit = data.filter(b => b.status === 'approved').reduce((sum, item) => sum + (item.totalAmount - item.materialCostInternal), 0);


  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Vendido (Aprovados)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {totalSold.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Margem de Lucro Estimada</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {estimatedProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                     <p className="text-xs text-muted-foreground">(Total Aprovado - Custos Materiais)</p>
                </CardContent>
            </Card>
        </div>
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Orçamento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead className="hidden md:table-cell">Custo Material (Interno)</TableHead>
              <TableHead className="hidden md:table-cell">Margem Estimada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const cells = [
                <TableCell key={`id-${item.id}`} className="font-mono text-xs">{item.id.substring(0,8)}...</TableCell>,
                <TableCell key={`clientName-${item.id}`}>{item.clientName}</TableCell>,
                <TableCell key={`status-${item.id}`}>{item.status}</TableCell>,
                <TableCell key={`totalAmount-${item.id}`}>{item.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>,
                <TableCell key={`materialCostInternal-${item.id}`} className="hidden md:table-cell">{item.materialCostInternal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>,
                <TableCell key={`estimatedMargin-${item.id}`} className="hidden md:table-cell">{(item.totalAmount - item.materialCostInternal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              ];
              return <TableRow key={item.id}>{cells}</TableRow>;
            })}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
