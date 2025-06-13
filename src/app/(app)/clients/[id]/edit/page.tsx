
'use client';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
// import { ClientForm } from '@/components/clients/client-form';
// import { db } from '@/lib/firebase';
// import { doc, getDoc } from 'firebase/firestore';
// import type { Client } from '@/types';
// import { useEffect, useState } from 'react';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  // const [client, setClient] = useState<Client | null>(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   if (clientId) {
  //     const fetchClient = async () => {
  //       setLoading(true);
  //       const clientDoc = await getDoc(doc(db, 'clients', clientId));
  //       if (clientDoc.exists()) {
  //         setClient({ id: clientDoc.id, ...clientDoc.data() } as Client);
  //       } else {
  //         console.error("Cliente não encontrado para edição.");
  //         // router.push('/clients'); // Opcional: redirecionar se não encontrado
  //       }
  //       setLoading(false);
  //     };
  //     fetchClient();
  //   }
  // }, [clientId, router]);

  // if (loading) return (
  //   <div className="flex justify-center items-center h-32">
  //     <p>Carregando dados do cliente para edição...</p>
  //   </div>
  // );
  // if (!client && !loading) return ( // Adicionado !loading para evitar renderização prematura
  //   <>
  //     <PageHeader title="Erro" description="Cliente não encontrado." >
  //        <Button variant="outline" onClick={() => router.push('/clients')}>
  //           <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Clientes
  //         </Button>
  //     </PageHeader>
  //     <p>O cliente que você está tentando editar não foi encontrado.</p>
  //   </>
  // );

  return (
    <>
      <PageHeader 
        title="Editar Cliente" 
        description={`Modificando dados do cliente ID: ${clientId}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>
      <div className="bg-card p-6 rounded-lg shadow">
        <p className="text-lg">ID do Cliente para Edição: <span className="font-mono">{clientId}</span></p>
        {/* {client && <ClientForm client={client} onSubmitSuccess={() => router.push('/clients')} />} */}
        <p className="mt-4 text-muted-foreground">
          Esta é uma página de placeholder para a edição do cliente.
          O formulário de edição preenchido com os dados do cliente será implementado aqui.
        </p>
      </div>
    </>
  );
}
