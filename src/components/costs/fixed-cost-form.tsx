
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COST_CATEGORIES, type CostCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const fixedCostFormSchema = z.object({
  description: z.string().min(3, { message: 'Descrição deve ter pelo menos 3 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'Valor deve ser positivo.' }),
  category: z.enum(COST_CATEGORIES, { required_error: 'Selecione uma categoria.' }),
});

type FixedCostFormValues = z.infer<typeof fixedCostFormSchema>;

interface FixedCostFormProps {
  onSubmitSuccess?: () => void;
}

const categoryTranslations: Record<CostCategory, string> = {
  food: 'Alimentação',
  transport: 'Transporte',
  salary: 'Salários',
  rent: 'Aluguel',
  utilities: 'Utilidades',
  marketing: 'Marketing',
  office_supplies: 'Material de Escritório',
  other: 'Outros',
  benefits: 'Benefícios'
};

export function FixedCostForm({ onSubmitSuccess }: FixedCostFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FixedCostFormValues>({
    resolver: zodResolver(fixedCostFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: undefined,
    },
  });

  async function onSubmit(values: FixedCostFormValues) {
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'fixedCosts'), {
        ...values,
        createdAt: new Date().toISOString(),
      });
      toast({
        title: 'Custo Fixo Adicionado!',
        description: 'O novo custo fixo foi salvo com sucesso.',
      });
      form.reset(); 
      if (onSubmitSuccess) {
        onSubmitSuccess(); 
      }
    } catch (error: any) {
      console.error("Erro ao salvar custo fixo:", error);
      toast({
        title: 'Erro ao Salvar',
        description: `Não foi possível salvar o custo fixo. Detalhe: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição*</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Aluguel do Galpão" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Mensal (R$)*</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Ex: 1200.00" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria*</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COST_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {categoryTranslations[cat as CostCategory] || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Salvando...' : 'Adicionar Custo Fixo'}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    