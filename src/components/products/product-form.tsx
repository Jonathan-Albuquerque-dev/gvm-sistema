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

const productCategories: ProductCategory[] = ['electrical', 'hydraulic', 'carpentry', 'other'];

const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome do produto deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'Descrição muito curta.' }).optional(),
  salePrice: z.coerce.number().positive({ message: 'Preço de venda deve ser positivo.' }),
  costPrice: z.coerce.number().positive({ message: 'Preço de custo deve ser positivo.' }),
  category: z.enum(productCategories, { required_error: 'Selecione uma categoria.' }),
});

interface ProductFormProps {
  product?: Product; // For editing
  onSubmitSuccess?: () => void;
}

export function ProductForm({ product, onSubmitSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: product || {
      name: '',
      description: '',
      salePrice: 0,
      costPrice: 0,
      category: undefined, // Will be set by Select
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: product ? 'Produto Atualizado!' : 'Produto Criado!',
      description: `O produto ${values.name} foi ${product ? 'atualizado' : 'salvo'} com sucesso.`,
    });
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
     if (!product) { // Reset form if creating new
        form.reset({ name: '', description: '', salePrice: 0, costPrice: 0, category: undefined });
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
                    <Input placeholder="Ex: Disjuntor Bipolar 40A" {...field} />
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
                    <Textarea placeholder="Detalhes sobre o produto..." {...field} />
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
                      <Input type="number" step="0.01" placeholder="Ex: 45.90" {...field} />
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
                      <Input type="number" step="0.01" placeholder="Ex: 22.50" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto">
              {product ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
