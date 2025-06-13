import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { BudgetList } from '@/components/budgets/budget-list';
import { PlusCircle } from 'lucide-react';

export default function BudgetsPage() {
  return (
    <>
      <PageHeader title="Orçamentos" description="Gerencie todos os seus orçamentos.">
        <Link href="/budgets/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento
          </Button>
        </Link>
      </PageHeader>
      <BudgetList />
    </>
  );
}
