import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { ClientList } from '@/components/clients/client-list';
import { PlusCircle } from 'lucide-react';

export default function ClientsPage() {
  return (
    <>
      <PageHeader title="Clientes" description="Gerencie seus clientes.">
        <Link href="/clients/new" legacyBehavior passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </Link>
      </PageHeader>
      <ClientList />
    </>
  );
}
