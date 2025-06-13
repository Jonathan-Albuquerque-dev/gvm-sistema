import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { ProductList } from '@/components/products/product-list';
import { PlusCircle } from 'lucide-react';

export default function ProductsPage() {
  return (
    <>
      <PageHeader title="Produtos" description="Gerencie seu catálogo de produtos e serviços.">
        <Link href="/products/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        </Link>
      </PageHeader>
      <ProductList />
    </>
  );
}
