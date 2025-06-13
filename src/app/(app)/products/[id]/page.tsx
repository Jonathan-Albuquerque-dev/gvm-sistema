
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertTriangle, Package } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Product, ProductCategory } from '@/types';
import { Badge } from '@/components/ui/badge';

const categoryTranslations: Record<ProductCategory, string> = {
    produto: 'Produto',
    serviço: 'Serviço',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const productDocRef = doc(db, 'products', productId);
          const productDocSnap = await getDoc(productDocRef);

          if (productDocSnap.exists()) {
            setProduct({ id: productDocSnap.id, ...productDocSnap.data() } as Product);
          } else {
            setError("Produto/Serviço não encontrado.");
          }
        } catch (err) {
          console.error("Erro ao buscar produto/serviço:", err);
          setError("Falha ao carregar dados do produto/serviço.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    } else {
        setError("ID do produto/serviço não fornecido.");
        setIsLoading(false);
    }
  }, [productId]);

  const DetailItem = ({ label, value, currency = false }: { label: string; value?: string | number | null, currency?: boolean }) => (
    value !== undefined && value !== null ? (
      <div className="py-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-md">{currency && typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value}</p>
      </div>
    ) : null
  );

  return (
    <>
      <PageHeader 
        title={product ? `Detalhes de ${product.name}` : "Detalhes do Item"}
        description={product ? `Visualizando dados do item ID: ${productId.substring(0,8)}...` : "Carregando..."}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do item...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="shadow-lg border-destructive">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Erro ao Carregar Item</CardTitle>
              <CardDescription className="text-destructive">{error}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && product && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <Package className="h-12 w-12 text-primary" />
            <div>
                <CardTitle className="text-2xl">{product.name}</CardTitle>
                <Badge variant="outline">{categoryTranslations[product.category] || product.category}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {product.description && (
                <div className="mb-4 py-2 border-b">
                    <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                    <p className="text-md whitespace-pre-wrap">{product.description}</p>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <DetailItem label="Preço de Venda" value={product.salePrice} currency />
                <DetailItem label="Preço de Custo (Interno)" value={product.costPrice} currency />
                <div className="py-2">
                    <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                    <p className="text-md">{new Date(product.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                {product.updatedAt && (
                    <div className="py-2">
                        <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                        <p className="text-md">{new Date(product.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

