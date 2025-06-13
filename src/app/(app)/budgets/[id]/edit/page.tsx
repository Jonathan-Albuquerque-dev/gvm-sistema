
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { BudgetForm } from '@/components/budgets/budget-form';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Budget } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EditBudgetPage() {
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
            setError("Orçamento não encontrado para edição.");
          }
        } catch (err) {
          console.error("Erro ao buscar orçamento para edição:", err);
          setError("Falha ao carregar dados do orçamento para edição.");
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

  const handleSuccess = () => {
    router.push('/budgets');
  };

  return (
    <>
      <PageHeader 
        title={budget ? `Editar Orçamento #${budgetId.substring(0,8)}...` : "Editar Orçamento"}
        description={budget ? `Modificando dados para ${budget.clientName}` : "Carregando..."}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do orçamento para edição...</p>
        </div>
      )}

      {error && !isLoading && (
         <Card className="shadow-lg border-destructive">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Erro ao Carregar Edição</CardTitle>
              <CardDescription className="text-destructive">{error}</CardDescription>
            </div>
          </CardHeader>
           <CardContent>
             <Button onClick={() => router.push('/budgets')}>Voltar para Orçamentos</Button>
           </CardContent>
        </Card>
      )}

      {!isLoading && !error && budget && (
        <BudgetForm budget={budget} onSubmitSuccess={handleSuccess} />
      )}
      
      {!isLoading && !error && !budget && !budgetId && ( 
         <Card className="shadow-lg border-destructive">
          <CardHeader>
              <CardTitle className="text-destructive">Erro</CardTitle>
              <CardDescription className="text-destructive">ID do orçamento não fornecido na URL.</CardDescription>
          </CardHeader>
           <CardContent>
             <Button onClick={() => router.push('/budgets')}>Voltar para Orçamentos</Button>
           </CardContent>
        </Card>
      )}
    </>
  );
}
