
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertTriangle, UserCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Client } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function ClientDetailPage() {
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
            setError("Cliente não encontrado.");
          }
        } catch (err) {
          console.error("Erro ao buscar cliente:", err);
          setError("Falha ao carregar dados do cliente.");
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

  const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
    value ? (
      <div className="py-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-md">{value}</p>
      </div>
    ) : null
  );

  return (
    <>
      <PageHeader 
        title={client ? `Detalhes de ${client.name}` : "Detalhes do Cliente"}
        description={client ? `Visualizando dados do cliente ID: ${clientId.substring(0,8)}...` : "Carregando..."}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do cliente...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="shadow-lg border-destructive">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Erro ao Carregar Cliente</CardTitle>
              <CardDescription className="text-destructive">{error}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && client && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <UserCircle className="h-12 w-12 text-primary" />
            <div>
                <CardTitle className="text-2xl">{client.name}</CardTitle>
                {client.companyName && <CardDescription>{client.companyName}</CardDescription>}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <DetailItem label="Documento (CPF/CNPJ)" value={client.document} />
            <DetailItem label="Email" value={client.email} />
            <DetailItem label="Telefone" value={client.phone} />
            <DetailItem label="Endereço" value={client.address} />
            <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                <p className="text-md">{new Date(client.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
             {client.updatedAt && (
                <div className="py-2">
                    <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                    <p className="text-md">{new Date(client.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
             )}
            <div className="py-2 md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Orçamentos Vinculados</p>
                {client.budgetIds && client.budgetIds.length > 0 ? (
                   client.budgetIds.map(budgetId => <Badge key={budgetId} variant="secondary" className="mr-1 mt-1">{budgetId.substring(0,8)}...</Badge>)
                ) : (
                    <p className="text-md">Nenhum orçamento vinculado.</p>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
