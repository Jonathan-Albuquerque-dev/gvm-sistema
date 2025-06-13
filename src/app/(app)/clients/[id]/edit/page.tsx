
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { ClientForm } from '@/components/clients/client-form';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Client } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      const fetchClient = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const clientDocRef = doc(db, 'clients', clientId);
          const clientDocSnap = await getDoc(clientDocRef);

          if (clientDocSnap.exists()) {
            setClient({ id: clientDocSnap.id, ...clientDocSnap.data() } as Client);
          } else {
            setError("Cliente não encontrado para edição.");
          }
        } catch (err) {
          console.error("Erro ao buscar cliente para edição:", err);
          setError("Falha ao carregar dados do cliente para edição.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchClient();
    } else {
        setError("ID do cliente não fornecido.");
        setIsLoading(false);
    }
  }, [clientId]);

  const handleSuccess = () => {
    router.push('/clients');
  };

  return (
    <>
      <PageHeader 
        title={client ? `Editar Cliente: ${client.name}` : "Editar Cliente"}
        description={client ? `Modificando dados do cliente ID: ${clientId.substring(0,8)}...` : "Carregando..."}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do cliente para edição...</p>
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
             <Button onClick={() => router.push('/clients')}>Voltar para Clientes</Button>
           </CardContent>
        </Card>
      )}

      {!isLoading && !error && client && (
        <ClientForm client={client} onSubmitSuccess={handleSuccess} />
      )}
      
      {!isLoading && !error && !client && !clientId && ( // Case where clientId was not in params
         <Card className="shadow-lg border-destructive">
          <CardHeader>
              <CardTitle className="text-destructive">Erro</CardTitle>
              <CardDescription className="text-destructive">ID do cliente não fornecido na URL.</CardDescription>
          </CardHeader>
           <CardContent>
             <Button onClick={() => router.push('/clients')}>Voltar para Clientes</Button>
           </CardContent>
        </Card>
      )}
    </>
  );
}
