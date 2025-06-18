
'use client';
import { BoletoForm } from '@/components/boletos/boleto-form';
import { PageHeader } from '@/components/layout/page-header';
import { useRouter } from 'next/navigation';

export default function NewBoletoPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/boletos');
  };

  return (
    <>
      <PageHeader title="Novo Boleto" description="Cadastre um novo boleto para um cliente." />
      <BoletoForm onSubmitSuccess={handleSuccess} />
    </>
  );
}
