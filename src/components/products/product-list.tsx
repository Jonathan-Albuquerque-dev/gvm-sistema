
'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, MoreVertical, Eye, Loader2 } from 'lucide-react';
import type { Product, ProductCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase'; // Still needed for deleteDoc
import { doc, deleteDoc } from 'firebase/firestore'; // Still needed for deleteDoc
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const categoryLabels: Record<ProductCategory, string> = {
  produto: 'Produto',
  serviço: 'Serviço',
};

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
}

export function ProductList({ products, isLoading }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const { toast } = useToast();
  const router = useRouter();

  const handleEdit = (productId: string) => {
    router.push(`/products/${productId}/edit`);
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o item "${productName}"? Esta ação não pode ser desfeita.`)) {
        return;
    }
    try {
      await deleteDoc(doc(db, 'products', productId));
      toast({
        title: 'Item Excluído!',
        description: `O item "${productName}" foi excluído com sucesso.`,
      });
      // A lista será atualizada automaticamente pela página pai via onSnapshot
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      toast({
        title: 'Erro ao Excluir',
        description: `Não foi possível excluir o item "${productName}". Tente novamente.`,
        variant: 'destructive',
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearchTerm && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando itens...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
            placeholder="Buscar produtos ou serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={(value: ProductCategory | 'all') => setCategoryFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value as ProductCategory}>{label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead>Preço Venda</TableHead>
              <TableHead className="hidden lg:table-cell">Preço Custo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground hidden sm:block truncate max-w-xs">{product.description}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{categoryLabels[product.category] || product.category}</Badge>
                  </TableCell>
                  <TableCell>{product.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell className="hidden lg:table-cell">{product.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(product.id)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(product.id, product.name)} className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
               <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum item encontrado. {products.length === 0 && !searchTerm && categoryFilter === 'all' && !isLoading ? "Cadastre o primeiro item." : ""}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
           {filteredProducts.length === 0 && (products.length > 0 || searchTerm || categoryFilter !== 'all') && !isLoading && (
             <TableCaption>Nenhum item encontrado para os filtros aplicados.</TableCaption>
           )}
        </Table>
      </div>
    </div>
  );
}
