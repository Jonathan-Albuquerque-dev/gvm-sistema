
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/types';
import { db } from '@/lib/firebase'; 
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres.' }),
  companyName: z.string().optional(),
  document: z.string().min(11, { message: 'Documento (CPF/CNPJ) inválido.' }),
  address: z.string().min(5, { message: 'Endereço muito curto.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(10, { message: 'Telefone inválido.' }),
});

interface ClientFormProps {
  client?: Client | null; // Allow null for initial state before fetch
  onSubmitSuccess?: () => void;
}

export function ClientForm({ client, onSubmitSuccess }: ClientFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: client || {
      name: '',
      companyName: '',
      document: '',
      address: '',
      email: '',
      phone: '',
    },
  });

  // Effect to reset form when client prop changes (e.g., after fetching data for edit)
  React.useEffect(() => {
    if (client) {
      form.reset(client);
    } else {
      form.reset({
        name: '',
        companyName: '',
        document: '',
        address: '',
        email: '',
        phone: '',
      });
    }
  }, [client, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (client && client.id) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ...valuesToUpdate } = values; // 'createdAt' is not in formSchema, so no need to exclude
        await updateDoc(doc(db, 'clients', client.id), {
          ...valuesToUpdate,
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: 'Cliente Atualizado!',
          description: `O cliente ${values.name} foi atualizado com sucesso.`,
        });
      } else {
        const clientData = {
          ...values,
          budgetIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'clients'), clientData);
        toast({
          title: 'Cliente Criado!',
          description: `O cliente ${values.name} foi salvo com sucesso no Firebase.`,
        });
        form.reset({ name: '', companyName: '', document: '', address: '', email: '', phone: '' });
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Erro detalhado ao salvar cliente:", error);
      let descriptionMessage = 'Não foi possível salvar o cliente. Tente novamente.';
      if (error.message) {
        descriptionMessage += ` Detalhe: ${error.message}`;
      }
      if (error.code) {
        descriptionMessage += ` (Código: ${error.code})`;
      }
      toast({
        title: 'Erro ao Salvar',
        description: descriptionMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome / Razão Social*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João Silva" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Silva & Filhos Ltda" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF / CNPJ*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 12.345.678/0001-99" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua das Palmeiras, 123, São Paulo, SP" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email*</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Ex: contato@empresa.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: (11) 98765-4321" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? (client ? 'Salvando...' : 'Cadastrando...') : (client ? 'Salvar Alterações' : 'Cadastrar Cliente')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
