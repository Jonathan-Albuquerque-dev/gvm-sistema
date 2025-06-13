
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
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, addDoc } from 'firebase/firestore';
import { useState } from 'react';
// import { useAuth } from '@/hooks/useAuth'; // If you need userId

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres.' }),
  companyName: z.string().optional(),
  document: z.string().min(11, { message: 'Documento (CPF/CNPJ) inválido.' }),
  address: z.string().min(5, { message: 'Endereço muito curto.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(10, { message: 'Telefone inválido.' }),
});

interface ClientFormProps {
  client?: Client; // For editing (not fully implemented with Firestore yet)
  onSubmitSuccess?: () => void;
}

export function ClientForm({ client, onSubmitSuccess }: ClientFormProps) {
  const { toast } = useToast();
  // const { user } = useAuth(); // Uncomment if you store userId with client
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // if (!user && !client) { // Example check if userId is required
    //   toast({ title: "Erro", description: "Você precisa estar logado para criar um cliente.", variant: "destructive" });
    //   return;
    // }
    setIsLoading(true);
    try {
      if (client) {
        // TODO: Implement update logic for Firestore
        console.log('Update client:', { id: client.id, ...values });
        toast({
          title: 'Funcionalidade em Desenvolvimento',
          description: 'A atualização de clientes no Firebase será implementada em breve.',
        });
      } else {
        const clientData = {
          ...values,
          budgetIds: [], // Initialize with empty budgetIds
          createdAt: new Date().toISOString(),
          // userId: user?.uid, // Optional: associate client with user
        };
        await addDoc(collection(db, 'clients'), clientData);
        toast({
          title: 'Cliente Criado!',
          description: `O cliente ${values.name} foi salvo com sucesso no Firebase.`,
        });
        form.reset(); // Reset form only when creating new
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o cliente. Tente novamente.',
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
              {isLoading ? (client ? 'Salvando...' : 'Cadastrando...') : (client ? 'Salvar Alterações' : 'Cadastrar Cliente')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
