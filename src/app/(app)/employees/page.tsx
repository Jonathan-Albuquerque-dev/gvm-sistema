
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { EmployeeList } from '@/components/employees/employee-list';
import { PlusCircle } from 'lucide-react';

export default function EmployeesPage() {
  return (
    <>
      <PageHeader title="Funcionários" description="Gerencie os funcionários da sua empresa.">
        <Link href="/employees/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Funcionário
          </Button>
        </Link>
      </PageHeader>
      <EmployeeList />
    </>
  );
}
