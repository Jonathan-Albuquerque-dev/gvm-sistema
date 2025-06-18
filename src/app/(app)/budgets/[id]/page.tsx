
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertTriangle, FileText, ShoppingCart, Edit, Percent, Clock, CreditCard } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Budget, BudgetStatus, BudgetItem, DiscountType, PaymentMethod } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

const statusTranslations: Record<BudgetStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const statusColors: Record<BudgetStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
  sent: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
  approved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
  rejected: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
};

const discountTypeLabels: Record<DiscountType, string> = {
    fixed: 'Fixo (R$)',
    percentage: 'Percentual (%)'
}


export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;

  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (budgetId) {
      const fetchBudget = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const budgetDocRef = doc(db, 'budgets', budgetId);
          const budgetDocSnap = await getDoc(budgetDocRef);

          if (budgetDocSnap.exists()) {
            setBudget({ id: budgetDocSnap.id, ...budgetDocSnap.data() } as Budget);
          } else {
            setError("Orçamento não encontrado.");
          }
        } catch (err) {
          console.error("Erro ao buscar orçamento:", err);
          setError("Falha ao carregar dados do orçamento.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchBudget();
    } else {
        setError("ID do orçamento não fornecido.");
        setIsLoading(false);
    }
  }, [budgetId]);

  const DetailItem = ({ label, value, currency = false, className, isNegative = false, isPositive = false, suffix, Icon }: { label: string; value?: string | number | null, currency?: boolean, className?: string, isNegative?: boolean, isPositive?: boolean, suffix?: string, Icon?: React.ElementType }) => (
    value !== undefined && value !== null && (typeof value !== 'number' || value !== 0 || label.toLowerCase().includes("desconto") || label.toLowerCase().includes("forma de pagamento")) ? ( 
      <div className={`py-2 ${className}`}>
        <p className="text-sm font-medium text-muted-foreground flex items-center">
           {Icon && <Icon className="mr-1.5 h-4 w-4" />}
           {label}
        </p>
        <p className={`text-md ${isNegative ? 'text-red-600 dark:text-red-400' : ''} ${isPositive ? 'text-green-600 dark:text-green-400' : ''}`}>
          {currency && typeof value === 'number' ? 
            (isNegative && value > 0 ? -value : value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
            : value}
          {suffix && typeof value === 'number' && value > 0 ? suffix : ''}
        </p>
      </div>
    ) : null
  );

  const subtotalItems = budget?.items.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  
  const discountLabel = () => {
    if (!budget || budget.appliedDiscountAmount === undefined || budget.appliedDiscountAmount === 0) return "Desconto";
    if (budget.discountType === 'percentage' && budget.discountInput) {
      return `Desconto (${budget.discountInput.toLocaleString('pt-BR')}%)`;
    }
    return "Desconto (R$)";
  }

  return (
    <>
      <PageHeader 
        title={budget ? `Detalhes do Orçamento` : "Detalhes do Orçamento"}
        description={budget ? `Visualizando orçamento para ${budget.clientName} (ID: ${budgetId.substring(0,8)}...)` : "Carregando..."}
      >
        <div className="flex items-center gap-2">
            {budget && (
                 <Link href={`/budgets/${budgetId}/edit`}>
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" /> Editar
                    </Button>
                 </Link>
            )}
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
        </div>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do orçamento...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="shadow-lg border-destructive">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Erro ao Carregar Orçamento</CardTitle>
              <CardDescription className="text-destructive">{error}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && budget && (
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                    <div className="flex items-center gap-3">
                        <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                        <div>
                            <CardTitle className="text-xl">Orçamento #{budgetId.substring(0,8)}</CardTitle>
                            <CardDescription>Cliente: {budget.clientName}</CardDescription>
                        </div>
                    </div>
                    <Badge className={`${statusColors[budget.status]} text-sm px-3 py-1`}>{statusTranslations[budget.status]}</Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2">
                    <DetailItem label="Data de Criação" value={new Date(budget.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} />
                    {budget.updatedAt && <DetailItem label="Última Atualização" value={new Date(budget.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} />}
                    {budget.deliveryTime && <DetailItem label="Prazo de Entrega" value={budget.deliveryTime} Icon={Clock}/>}
                    {budget.paymentMethod && <DetailItem label="Forma de Pagamento" value={budget.paymentMethod} Icon={CreditCard}/>}
                    
                    <div className="md:col-span-3 mt-4 pt-4 border-t">
                        <p className="text-lg font-semibold">Resumo Financeiro</p>
                    </div>
                    <DetailItem label="Subtotal dos Itens" value={subtotalItems} currency className="md:col-span-1" />
                    
                    <DetailItem 
                        label={discountLabel()}
                        value={budget.appliedDiscountAmount} 
                        currency 
                        className="md:col-span-1" 
                        isNegative={budget.appliedDiscountAmount !== undefined && budget.appliedDiscountAmount > 0}
                    />

                    <DetailItem label="Frete (R$)" value={budget.shippingCost} currency className="md:col-span-1" isPositive={budget.shippingCost !== undefined && budget.shippingCost > 0}/>
                    <DetailItem label="Impostos (R$)" value={budget.taxAmount} currency className="md:col-span-1" isPositive={budget.taxAmount !== undefined && budget.taxAmount > 0}/>
                    
                    <DetailItem label="Valor Total do Orçamento" value={budget.totalAmount} currency className="md:col-span-3 text-lg font-bold text-primary pt-2" />
                    
                    <DetailItem label="Custo Interno de Materiais" value={budget.materialCostInternal} currency className="md:col-span-1 pt-2 border-t mt-2" />
                     <DetailItem 
                        label="Margem Bruta Estimada" 
                        value={(budget.totalAmount - budget.materialCostInternal)} 
                        currency 
                        className="md:col-span-2 pt-2 border-t mt-2 font-semibold" 
                    />
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                        <CardTitle>Itens do Orçamento</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {budget.items && budget.items.length > 0 ? (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-center">Qtd.</TableHead>
                                <TableHead className="text-right">Preço Unit.</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {budget.items.map((item: BudgetItem, index: number) => (
                                <TableRow key={`${item.productId}-${index}`}>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                <TableCell className="text-right">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Nenhum item neste orçamento.</p>
                    )}
                </CardContent>
            </Card>

            {budget.observations && (
                <Card className="shadow-lg">
                    <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-md whitespace-pre-wrap">{budget.observations}</p>
                    </CardContent>
                </Card>
            )}
        </div>
      )}
    </>
  );
}
