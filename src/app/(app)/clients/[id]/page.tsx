
'use client';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  return (
    <>
      <PageHeader 
        title={`Detalhes do Cliente`} 
        description={`Visualizando dados do cliente ID: ${clientId}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>
      <div className="bg-card p-6 rounded-lg shadow">
        <p className="text-lg">ID do Cliente: <span className="font-mono">{clientId}</span></p>
        <p className="mt-4 text-muted-foreground">
          Esta é uma página de placeholder para os detalhes do cliente.
          A funcionalidade completa de exibição de dados será implementada aqui.
        </p>
        {/* TODO: Fetch e exibir dados detalhados do cliente */}
      </div>
    </>
  );
}
