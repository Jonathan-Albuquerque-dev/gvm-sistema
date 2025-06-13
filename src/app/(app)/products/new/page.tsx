'use client';
import { ProductForm } from '@/components/products/product-form';
import { PageHeader } from '@/components/layout/page-header';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/products');
  };
  return (
    <>
      <PageHeader title="Novo Produto" description="Adicione um novo item ao seu catálogo." />
      <ProductForm onSubmitSuccess={handleSuccess} />
    </>
  );
}
