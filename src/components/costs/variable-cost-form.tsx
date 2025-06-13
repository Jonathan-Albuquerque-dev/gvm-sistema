
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COST_CATEGORIES, type CostCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useState } from 'react';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const variableCostFormSchema = z.object({
  description: z.string().min(3, { message: 'Descrição deve ter pelo menos 3 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'Valor deve ser positivo.' }),
  date: z.date({ required_error: 'Data é obrigatória.' }),
  category: z.enum(COST_CATEGORIES, { required_error: 'Selecione uma categoria.' }),
});

type VariableCostFormValues = z.infer<typeof variableCostFormSchema>;

interface VariableCostFormProps {
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

export function VariableCostForm({ onSubmitSuccess }: VariableCostFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<VariableCostFormValues>({
    resolver: zodResolver(variableCostFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date(),
      category: undefined,
    },
  });

  async function onSubmit(values: VariableCostFormValues) {
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'variableCosts'), {
        ...values,
        date: values.date.toISOString(), 
        createdAt: new Date().toISOString(),
      });
      toast({
        title: 'Custo Variável Adicionado!',
        description: 'O novo custo variável foi salvo com sucesso.',
      });
      form.reset();
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao salvar custo variável:", error);
      toast({
        title: 'Erro ao Salvar',
        description: `Não foi possível salvar o custo variável. Detalhe: ${error.message}`,
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
                <Input placeholder="Ex: Almoço com cliente XPTO" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)*</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 75.50" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Custo*</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2000-01-01")
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
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
            {isLoading ? 'Salvando...' : 'Adicionar Custo Variável'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    