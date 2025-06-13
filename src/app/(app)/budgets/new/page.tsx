'use client';
import { BudgetForm } from '@/components/budgets/budget-form';
import { PageHeader } from '@/components/layout/page-header';
import { useRouter } from 'next/navigation';

export default function NewBudgetPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/budgets');
  };

  return (
    <>
      <PageHeader title="Novo Orçamento" description="Crie um novo orçamento para um cliente." />
      <BudgetForm onSubmitSuccess={handleSuccess} />
    </>
  );
}
