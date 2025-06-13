
'use client';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
// import { BudgetForm } from '@/components/budgets/budget-form';
// import { db } from '@/lib/firebase';
// import { doc, getDoc } from 'firebase/firestore';
// import type { Budget } from '@/types';
// import { useEffect, useState } from 'react';

export default function EditBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;
  // const [budget, setBudget] = useState<Budget | null>(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   if (budgetId) {
  //     const fetchBudget = async () => {
  //       setLoading(true);
  //       const budgetDoc = await getDoc(doc(db, 'budgets', budgetId));
  //       if (budgetDoc.exists()) {
  //         setBudget({ id: budgetDoc.id, ...budgetDoc.data() } as Budget);
  //       } else {
  //         console.error("Orçamento não encontrado para edição.");
  //       }
  //       setLoading(false);
  //     };
  //     fetchBudget();
  //   }
  // }, [budgetId]);

  // if (loading) return <p>Carregando dados do orçamento para edição...</p>;
  // if (!budget && !loading) return <p>Orçamento não encontrado.</p>;

  return (
    <>
      <PageHeader 
        title="Editar Orçamento" 
        description={`Modificando dados do orçamento ID: ${budgetId}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>
      <div className="bg-card p-6 rounded-lg shadow">
        <p className="text-lg">ID do Orçamento para Edição: <span className="font-mono">{budgetId}</span></p>
        {/* {budget && <BudgetForm budget={budget} onSubmitSuccess={() => router.push('/budgets')} />} */}
        <p className="mt-4 text-muted-foreground">
          Esta é uma página de placeholder para a edição do orçamento.
          O formulário de edição preenchido com os dados do orçamento será implementado aqui.
        </p>
      </div>
    </>
  );
}
