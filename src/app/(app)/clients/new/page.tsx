'use client';
import { ClientForm } from '@/components/clients/client-form';
import { PageHeader } from '@/components/layout/page-header';
import { useRouter } from 'next/navigation';


export default function NewClientPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/clients');
  };

  return (
    <>
      <PageHeader title="Novo Cliente" description="Preencha os dados para cadastrar um novo cliente." />
      <ClientForm onSubmitSuccess={handleSuccess} />
    </>
  );
}
