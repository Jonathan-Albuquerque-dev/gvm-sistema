
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { ProductForm } from '@/components/products/product-form';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EditProductPage() {
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
            setError("Produto não encontrado para edição.");
          }
        } catch (err) {
          console.error("Erro ao buscar produto para edição:", err);
          setError("Falha ao carregar dados do produto para edição.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    } else {
        setError("ID do produto não fornecido.");
        setIsLoading(false);
    }
  }, [productId]);
  
  const handleSuccess = () => {
    router.push('/products');
  };

  return (
    <>
      <PageHeader 
        title={product ? `Editar Produto: ${product.name}` : "Editar Produto"}
        description={product ? `Modificando dados do produto ID: ${productId.substring(0,8)}...` : "Carregando..."}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do produto para edição...</p>
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
             <Button onClick={() => router.push('/products')}>Voltar para Produtos</Button>
           </CardContent>
        </Card>
      )}

      {!isLoading && !error && product && (
        <ProductForm product={product} onSubmitSuccess={handleSuccess} />
      )}
      
      {!isLoading && !error && !product && !productId && (
         <Card className="shadow-lg border-destructive">
          <CardHeader>
              <CardTitle className="text-destructive">Erro</CardTitle>
              <CardDescription className="text-destructive">ID do produto não fornecido na URL.</CardDescription>
          </CardHeader>
           <CardContent>
             <Button onClick={() => router.push('/products')}>Voltar para Produtos</Button>
           </CardContent>
        </Card>
      )}
    </>
  );
}
