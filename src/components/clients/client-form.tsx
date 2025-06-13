'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres.' }),
  companyName: z.string().optional(),
  document: z.string().min(11, { message: 'Documento (CPF/CNPJ) inválido.' }), // Basic validation
  address: z.string().min(5, { message: 'Endereço muito curto.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(10, { message: 'Telefone inválido.' }),
});

interface ClientFormProps {
  client?: Client; // For editing
  onSubmitSuccess?: () => void;
}

export function ClientForm({ client, onSubmitSuccess }: ClientFormProps) {
  const { toast } = useToast();
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, you'd call an API here.
    console.log(values);
    toast({
      title: client ? 'Cliente Atualizado!' : 'Cliente Criado!',
      description: `O cliente ${values.name} foi ${client ? 'atualizado' : 'salvo'} com sucesso.`,
    });
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
    if (!client) { // Reset form if creating new
        form.reset();
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
                      <Input placeholder="Ex: João Silva" {...field} />
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
                      <Input placeholder="Ex: Silva & Filhos Ltda" {...field} />
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
                    <Input placeholder="Ex: 12.345.678/0001-99" {...field} />
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
                    <Input placeholder="Ex: Rua das Palmeiras, 123, São Paulo, SP" {...field} />
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
                      <Input type="email" placeholder="Ex: contato@empresa.com" {...field} />
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
                      <Input placeholder="Ex: (11) 98765-4321" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full md:w-auto">
              {client ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
