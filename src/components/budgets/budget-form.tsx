
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Budget, BudgetStatus, Client, Product, BudgetItem } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Trash2, FileDown, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';

const budgetItemSchema = z.object({
  productId: z.string().min(1, "Selecione um produto."),
  quantity: z.coerce.number().min(1, "Quantidade deve ser pelo menos 1."),
  unitPrice: z.coerce.number(), 
  productName: z.string(), 
});

const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Selecione um cliente.' }),
  items: z.array(budgetItemSchema).min(1, "Adicione pelo menos um item ao orçamento."),
  status: z.enum(['draft', 'sent', 'approved', 'rejected'] as [BudgetStatus, ...BudgetStatus[]], { required_error: 'Selecione um status.' }),
  observations: z.string().optional(),
});

interface BudgetFormProps {
  budget?: Budget | null; 
  onSubmitSuccess?: () => void;
}

export function BudgetForm({ budget, onSubmitSuccess }: BudgetFormProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingClients, setIsFetchingClients] = useState(true);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  
  useEffect(() => {
    const fetchClients = async () => {
      setIsFetchingClients(true);
      try {
        const q = query(collection(db, 'clients'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        setClients(clientsData);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        toast({ title: "Erro ao buscar clientes", description: "Não foi possível carregar a lista de clientes.", variant: "destructive" });
      } finally {
        setIsFetchingClients(false);
      }
    };

    const fetchProducts = async () => {
      setIsFetchingProducts(true);
      try {
        const q = query(collection(db, 'products'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        toast({ title: "Erro ao buscar produtos", description: "Não foi possível carregar a lista de produtos.", variant: "destructive" });
      } finally {
        setIsFetchingProducts(false);
      }
    };

    fetchClients();
    fetchProducts();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: budget ? {
      clientId: budget.clientId,
      items: budget.items.map(item => ({ 
        productId: item.productId, 
        quantity: item.quantity, 
        unitPrice: item.unitPrice, 
        productName: item.productName 
      })),
      status: budget.status,
      observations: budget.observations || '',
    } : {
      clientId: '',
      items: [],
      status: 'draft',
      observations: '',
    },
  });
  
  useEffect(() => {
    if (budget) {
        form.reset({
            clientId: budget.clientId,
            items: budget.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                productName: item.productName
            })),
            status: budget.status,
            observations: budget.observations || '',
        });
    } else {
        form.reset({ clientId: '', items: [], status: 'draft', observations: '' });
    }
  }, [budget, form]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const selectedFormItems = form.watch('items');

  const calculateTotals = useCallback(() => {
    const itemsTotal = selectedFormItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.salePrice * item.quantity : 0);
    }, 0);
    const materialCostInternal = selectedFormItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.costPrice * item.quantity : 0);
    }, 0);
    return { itemsTotal, materialCostInternal };
  }, [selectedFormItems, products]);


  const [totalAmount, setTotalAmount] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);

  useEffect(() => {
    const { itemsTotal, materialCostInternal } = calculateTotals();
    setTotalAmount(itemsTotal); 
    setMaterialCost(materialCostInternal);
  }, [selectedFormItems, products, calculateTotals]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const selectedClient = clients.find(c => c.id === values.clientId);
    if (!selectedClient) {
        toast({ title: "Erro", description: "Cliente selecionado não encontrado.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const budgetItemsData = values.items.map(item => {
        const productDetails = products.find(p => p.id === item.productId);
        return {
            productId: item.productId,
            productName: productDetails?.name || 'Produto Desconhecido',
            quantity: item.quantity,
            unitPrice: productDetails?.salePrice || 0,
            totalPrice: (productDetails?.salePrice || 0) * item.quantity
        };
    });

    try {
        if (budget && budget.id) {
            const budgetDataForUpdate = {
                clientId: values.clientId,
                clientName: selectedClient.name,
                items: budgetItemsData,
                status: values.status,
                observations: values.observations || '',
                totalAmount,
                materialCostInternal: materialCost,
                updatedAt: new Date().toISOString(),
                // createdAt will remain from the original document
            };
            await updateDoc(doc(db, 'budgets', budget.id), budgetDataForUpdate);
            toast({
                title: 'Orçamento Atualizado!',
                description: `O orçamento para ${selectedClient.name} foi atualizado com sucesso.`,
            });
        } else {
            const budgetDataForCreate = {
                clientId: values.clientId,
                clientName: selectedClient.name,
                items: budgetItemsData,
                status: values.status,
                observations: values.observations || '',
                totalAmount,
                materialCostInternal: materialCost,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await addDoc(collection(db, 'budgets'), budgetDataForCreate);
            toast({
                title: 'Orçamento Criado!',
                description: `O orçamento para ${selectedClient.name} foi salvo com sucesso.`,
            });
            form.reset({ clientId: '', items: [], status: 'draft', observations: '' });
        }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
        console.error("Erro ao salvar orçamento:", error);
        toast({
            title: 'Erro ao Salvar Orçamento',
            description: `Não foi possível salvar o orçamento. Detalhe: ${error.message || 'Erro desconhecido.'}`,
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
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
                    <Select 
                        onValueChange={field.onChange} 
                        value={field.value} // Ensure value is controlled
                        disabled={isFetchingClients || isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isFetchingClients ? "Carregando clientes..." : "Selecione um cliente"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!isFetchingClients && clients.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>}
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
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
                  <Button type="button" variant="outline" size="sm" onClick={handleAddProduct} disabled={isFetchingProducts || isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                  </Button>
                </div>
                {isFetchingProducts && <p className="text-sm text-muted-foreground mt-2">Carregando produtos...</p>}
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
                              const productDetails = products.find(p => p.id === value);
                              form.setValue(`items.${index}.unitPrice`, productDetails?.salePrice || 0);
                              form.setValue(`items.${index}.productName`, productDetails?.name || '');
                            }} 
                            value={formField.value} // Ensure value is controlled
                            disabled={isFetchingProducts || isLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={isFetchingProducts ? "Carregando..." :"Selecione um produto"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               {!isFetchingProducts && products.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhum produto cadastrado.</p>}
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
                            <Input type="number" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="w-full md:w-auto pt-0 md:pt-7">
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="mt-1 md:mt-0" disabled={isLoading}>
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

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações relevantes para este orçamento (ex: condições de pagamento, prazos específicos, etc.)"
                      className="resize-y"
                      {...field}
                      value={field.value ?? ''}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="text-right font-bold text-xl">
                Total do Orçamento: {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                 <Button type="button" variant="outline" onClick={() => console.log("Gerar PDF")} className="w-full sm:w-auto" disabled={isLoading}>
                    <FileDown className="mr-2 h-4 w-4" /> Gerar PDF (placeholder)
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isFetchingClients || isFetchingProducts}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {budget ? (isLoading ? 'Salvando...' : 'Salvar Alterações') : (isLoading ? 'Criando...' : 'Criar Orçamento')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
