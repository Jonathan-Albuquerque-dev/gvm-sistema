
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Budget, BudgetStatus, Client, Product, BudgetItem } from '@/types';
import { MOCK_CLIENTS, MOCK_PRODUCTS } from '@/lib/mock-data';
import { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Trash2, FileDown } from 'lucide-react';

const budgetItemSchema = z.object({
  productId: z.string().min(1, "Selecione um produto."),
  quantity: z.coerce.number().min(1, "Quantidade deve ser pelo menos 1."),
  unitPrice: z.coerce.number(), // Will be set from product
  productName: z.string(), // Will be set from product
});

const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Selecione um cliente.' }),
  items: z.array(budgetItemSchema).min(1, "Adicione pelo menos um item ao orçamento."),
  status: z.enum(['draft', 'sent', 'approved', 'rejected'] as [BudgetStatus, ...BudgetStatus[]], { required_error: 'Selecione um status.' }),
});

interface BudgetFormProps {
  budget?: Budget;
  onSubmitSuccess?: () => void;
}

export function BudgetForm({ budget, onSubmitSuccess }: BudgetFormProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    setClients(MOCK_CLIENTS);
    setProducts(MOCK_PRODUCTS);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: budget ? {
      clientId: budget.clientId,
      items: budget.items.map(item => ({ ...item, unitPrice: item.unitPrice, productName: item.productName })),
      status: budget.status,
    } : {
      clientId: '',
      items: [],
      status: 'draft',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const selectedProducts = form.watch('items');

  const calculateTotals = useCallback(() => {
    const itemsTotal = selectedProducts.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.salePrice * item.quantity : 0);
    }, 0);
    const materialCostInternal = selectedProducts.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.costPrice * item.quantity : 0);
    }, 0);
    return { itemsTotal, materialCostInternal };
  }, [selectedProducts, products]);


  const [totalAmount, setTotalAmount] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);

  useEffect(() => {
    const { itemsTotal, materialCostInternal } = calculateTotals();
    setTotalAmount(itemsTotal); 
    setMaterialCost(materialCostInternal);
  }, [selectedProducts, products, form, calculateTotals]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const clientName = clients.find(c => c.id === values.clientId)?.name || 'Cliente Desconhecido';
    const budgetToSave: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'materialCostInternal' | 'clientName'> & Partial<Pick<Budget, 'id'>> = {
      clientId: values.clientId,
      items: values.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
              ...item,
              unitPrice: product?.salePrice || 0,
              productName: product?.name || 'Produto Desconhecido',
              totalPrice: (product?.salePrice || 0) * item.quantity
          };
      }),
      status: values.status,
    };
    
    console.log({ ...budgetToSave, totalAmount, materialCostInternal: materialCost, clientName });
    
    toast({
      title: budget ? 'Orçamento Atualizado!' : 'Orçamento Criado!',
      description: `O orçamento para ${clientName} foi ${budget ? 'atualizado' : 'salvo'} com sucesso.`,
    });
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
     if (!budget) { 
        form.reset({ clientId: '', items: [], status: 'draft' }); 
    }
  }

  const handleAddProduct = () => {
    append({ productId: '', quantity: 1, unitPrice: 0, productName: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{budget ? 'Editar Orçamento' : 'Novo Orçamento'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name} ({client.companyName || client.document})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(['draft', 'sent', 'approved', 'rejected'] as BudgetStatus[]).map(s => (
                          <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Itens do Orçamento</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddProduct}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start p-4 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field: formField }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Produto*</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              formField.onChange(value);
                              const product = products.find(p => p.id === value);
                              form.setValue(`items.${index}.unitPrice`, product?.salePrice || 0);
                              form.setValue(`items.${index}.productName`, product?.name || '');
                            }} 
                            defaultValue={formField.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name} (R$ {p.salePrice.toFixed(2)})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="w-full md:w-32">
                          <FormLabel>Qtd*</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="w-full md:w-auto pt-0 md:pt-7">
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="mt-1 md:mt-0">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remover item</span>
                        </Button>
                    </div>
                  </div>
                ))}
                {form.formState.errors.items && typeof form.formState.errors.items === 'object' && !Array.isArray(form.formState.errors.items) && (
                    <FormMessage>{form.formState.errors.items.message}</FormMessage>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6"> 
               <div>
                  <FormLabel>Custo dos Materiais (Interno)</FormLabel>
                  <Input value={materialCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} readOnly disabled className="mt-2 bg-muted" />
                  <FormDescription>Calculado automaticamente. Não visível ao cliente.</FormDescription>
              </div>
            </div>
            
            <div className="text-right font-bold text-xl">
                Total do Orçamento: {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                 <Button type="button" variant="outline" onClick={() => console.log("Gerar PDF")} className="w-full sm:w-auto">
                    <FileDown className="mr-2 h-4 w-4" /> Gerar PDF (placeholder)
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                {budget ? 'Salvar Alterações' : 'Criar Orçamento'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

