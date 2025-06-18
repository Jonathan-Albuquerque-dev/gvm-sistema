
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { BoletoForm } from '@/components/boletos/boleto-form';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Boleto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EditBoletoPage() {
  const params = useParams();
  const router = useRouter();
  const boletoId = params.id as string;

  const [boleto, setBoleto] = useState<Boleto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (boletoId) {
      const fetchBoleto = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const boletoDocRef = doc(db, 'boletos', boletoId);
          const boletoDocSnap = await getDoc(boletoDocRef);

          if (boletoDocSnap.exists()) {
            setBoleto({ id: boletoDocSnap.id, ...boletoDocSnap.data() } as Boleto);
          } else {
            setError("Conjunto de boletos não encontrado para edição.");
          }
        } catch (err) {
          console.error("Erro ao buscar boletos para edição:", err);
          setError("Falha ao carregar dados dos boletos para edição.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchBoleto();
    } else {
        setError("ID do boleto não fornecido.");
        setIsLoading(false);
    }
  }, [boletoId]);

  const handleSuccess = () => {
    router.push('/boletos');
  };

  return (
    <>
      <PageHeader 
        title={boleto ? `Editar Boletos de ${boleto.clientName}` : "Editar Boletos"}
        description={boleto ? `Modificando boletos ID: ${boletoId.substring(0,8)}...` : "Carregando..."}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados para edição...</p>
        </div>
      )}

      {error && !isLoading && (
         <Card className="shadow-lg border-destructive">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Erro ao Carregar</CardTitle>
              <CardDescription className="text-destructive">{error}</CardDescription>
            </div>
          </CardHeader>
           <CardContent>
             <Button onClick={() => router.push('/boletos')}>Voltar para Boletos</Button>
           </CardContent>
        </Card>
      )}

      {!isLoading && !error && boleto && (
        <BoletoForm boleto={boleto} onSubmitSuccess={handleSuccess} />
      )}
      
      {!isLoading && !error && !boleto && !boletoId && ( 
         <Card className="shadow-lg border-destructive">
          <CardHeader>
              <CardTitle className="text-destructive">Erro</CardTitle>
              <CardDescription className="text-destructive">ID do boleto não fornecido na URL.</CardDescription>
          </CardHeader>
           <CardContent>
             <Button onClick={() => router.push('/boletos')}>Voltar para Boletos</Button>
           </CardContent>
        </Card>
      )}
    </>
  );
}
