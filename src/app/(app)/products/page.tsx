
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { ProductList } from '@/components/products/product-list';
import { PlusCircle, FileDown, Loader2 } from 'lucide-react';
import type { Product, ProductCategory } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const categoryTranslations: Record<ProductCategory, string> = {
    produto: 'Produto',
    serviço: 'Serviço',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar produtos:", error);
      toast({ title: "Erro ao buscar produtos", description: "Não foi possível carregar a lista de produtos.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleGenerateAllProductsPdf = () => {
    if (products.length === 0) {
      toast({
          title: "Nenhum produto para listar",
          description: "Não há produtos cadastrados para gerar o PDF.",
          variant: "default"
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let currentY = 22;

    doc.setFontSize(18);
    doc.text('Lista de Produtos Cadastrados', margin, currentY);
    currentY += 8;
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, currentY);
    currentY += 10;
    
    const tableColumn = ["Nome", "Descrição", "Categoria", "Preço Venda", "Preço Custo"];
    const tableRows: (string | number)[][] = [];

    products.forEach(product => {
      const productData = [
        product.name,
        product.description || '-',
        categoryTranslations[product.category] || product.category,
        product.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        product.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
      tableRows.push(productData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      headStyles: { fillColor: [22, 160, 133] }, // Cor verde para cabeçalho
      columnStyles: {
        0: { cellWidth: 40 }, // Nome
        1: { cellWidth: 'auto' }, // Descrição
        2: { cellWidth: 25 }, // Categoria
        3: { cellWidth: 30, halign: 'right' }, // Preço Venda
        4: { cellWidth: 30, halign: 'right' }, // Preço Custo
      },
      didDrawPage: function (_data) {
        // Placeholder for potential footer content on each page
      }
    });
    
    doc.save('lista_de_produtos.pdf');
    toast({ title: 'PDF Gerado', description: 'A lista de produtos foi gerada em PDF.' });
  };


  return (
    <>
      <PageHeader title="Produtos" description="Gerencie seu catálogo de produtos e serviços.">
        <Button onClick={handleGenerateAllProductsPdf} variant="outline" disabled={isLoading || products.length === 0}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          Gerar PDF
        </Button>
        <Link href="/products/new">
          <Button disabled={isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        </Link>
      </PageHeader>
      <ProductList products={products} isLoading={isLoading} />
    </>
  );
}
