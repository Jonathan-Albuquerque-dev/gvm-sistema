
'use client';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
// import { ProductForm } from '@/components/products/product-form';
// import { db } from '@/lib/firebase';
// import { doc, getDoc } from 'firebase/firestore';
// import type { Product } from '@/types';
// import { useEffect, useState } from 'react';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  // const [product, setProduct] = useState<Product | null>(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   if (productId) {
  //     const fetchProduct = async () => {
  //       setLoading(true);
  //       const productDoc = await getDoc(doc(db, 'products', productId));
  //       if (productDoc.exists()) {
  //         setProduct({ id: productDoc.id, ...productDoc.data() } as Product);
  //       } else {
  //         console.error("Produto não encontrado para edição.");
  //       }
  //       setLoading(false);
  //     };
  //     fetchProduct();
  //   }
  // }, [productId]);

  // if (loading) return <p>Carregando dados do produto para edição...</p>;
  // if (!product && !loading) return <p>Produto não encontrado.</p>;

  return (
    <>
      <PageHeader 
        title="Editar Produto" 
        description={`Modificando dados do produto ID: ${productId}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>
      <div className="bg-card p-6 rounded-lg shadow">
        <p className="text-lg">ID do Produto para Edição: <span className="font-mono">{productId}</span></p>
        {/* {product && <ProductForm product={product} onSubmitSuccess={() => router.push('/products')} />} */}
        <p className="mt-4 text-muted-foreground">
          Esta é uma página de placeholder para a edição do produto.
          O formulário de edição preenchido com os dados do produto será implementado aqui.
        </p>
      </div>
    </>
  );
}
