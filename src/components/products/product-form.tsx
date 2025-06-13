
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Product, ProductCategory } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const productCategories: ProductCategory[] = ['electrical', 'hydraulic', 'carpentry', 'other'];

const productCategoryTranslations: Record<ProductCategory, string> = {
    electrical: 'Elétrica',
    hydraulic: 'Hidráulica',
    carpentry: 'Marcenaria',
    other: 'Outros',
};

const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome do produto deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'Descrição muito curta.' }).optional(),
  salePrice: z.coerce.number().positive({ message: 'Preço de venda deve ser positivo.' }),
  costPrice: z.coerce.number().positive({ message: 'Preço de custo deve ser positivo.' }),
  category: z.enum(productCategories, { required_error: 'Selecione uma categoria.' }),
});

interface ProductFormProps {
  product?: Product | null;
  onSubmitSuccess?: () => void;
}

export function ProductForm({ product, onSubmitSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: product || {
      name: '',
      description: '',
      salePrice: 0,
      costPrice: 0,
      category: undefined,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset(product);
    } else {
      form.reset({ name: '', description: '', salePrice: 0, costPrice: 0, category: undefined });
    }
  }, [product, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (product && product.id) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ...valuesToUpdate } = values;
        await updateDoc(doc(db, 'products', product.id), {
          ...valuesToUpdate,
          description: values.description || '', 
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: 'Produto Atualizado!',
          description: `O produto ${values.name} foi atualizado com sucesso.`,
        });
      } else {
        const productData = {
          ...values,
          description: values.description || '', 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'products'), productData);
        toast({
          title: 'Produto Criado!',
          description: `O produto ${values.name} foi salvo com sucesso no Firebase.`,
        });
        form.reset({ name: '', description: '', salePrice: 0, costPrice: 0, category: undefined });
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Erro detalhado ao salvar produto:", error);
      toast({
        title: 'Erro ao Salvar Produto',
        description: `Não foi possível salvar o produto. Detalhe: ${error.message || 'Erro desconhecido.'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? 'Editar Produto' : 'Novo Produto'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Disjuntor Bipolar 40A" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes sobre o produto..." {...field} value={field.value ?? ''} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda (R$)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 45.90" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo (R$)* (Interno)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 22.50" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormDescription>Este valor não aparece para o cliente.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {productCategoryTranslations[cat] || cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? (product ? 'Salvando...' : 'Cadastrando...') : (product ? 'Salvar Alterações' : 'Cadastrar Produto')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    