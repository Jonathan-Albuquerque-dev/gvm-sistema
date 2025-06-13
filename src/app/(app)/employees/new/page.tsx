
'use client';
import { EmployeeForm } from '@/components/employees/employee-form';
import { PageHeader } from '@/components/layout/page-header';
import { useRouter } from 'next/navigation';

export default function NewEmployeePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/employees');
  };

  return (
    <>
      <PageHeader title="Novo Funcionário" description="Cadastre um novo membro para a equipe." />
      <EmployeeForm onSubmitSuccess={handleSuccess} />
    </>
  );
}
