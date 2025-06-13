
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  position: z.string().min(3, { message: 'Cargo deve ter pelo menos 3 caracteres.' }),
  salary: z.coerce.number().positive({ message: 'Salário deve ser um valor positivo.' }),
  admissionDate: z.date({ required_error: 'Data de admissão é obrigatória.' }),
});

interface EmployeeFormProps {
  employee?: Employee | null; 
  onSubmitSuccess?: () => void;
}

export function EmployeeForm({ employee, onSubmitSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: employee ? {
      ...employee,
      admissionDate: new Date(employee.admissionDate),
      salary: employee.salary || 0,
    } : {
      name: '',
      position: '',
      salary: 0,
      admissionDate: undefined,
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        ...employee,
        admissionDate: new Date(employee.admissionDate),
        salary: employee.salary || 0,
      });
    } else {
      form.reset({ name: '', position: '', salary: 0, admissionDate: undefined });
    }
  }, [employee, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const employeeData = {
        ...values,
        admissionDate: values.admissionDate.toISOString(), // Store as ISO string
      };

      if (employee && employee.id) {
        await updateDoc(doc(db, 'employees', employee.id), {
          ...employeeData,
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: 'Funcionário Atualizado!',
          description: `Os dados de ${values.name} foram atualizados com sucesso.`,
        });
      } else {
        await addDoc(collection(db, 'employees'), {
          ...employeeData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: 'Funcionário Cadastrado!',
          description: `${values.name} foi salvo com sucesso.`,
        });
        form.reset({ name: '', position: '', salary: 0, admissionDate: undefined });
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao salvar funcionário:", error);
      toast({
        title: 'Erro ao Salvar',
        description: `Não foi possível salvar o funcionário. Detalhe: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{employee ? 'Editar Funcionário' : 'Novo Funcionário'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Carlos Alberto da Silva" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Eletricista" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="admissionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Admissão*</FormLabel>
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
                            date > new Date() || date < new Date("1900-01-01")
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
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Bruto (R$)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 3500.00" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? (employee ? 'Salvando...' : 'Cadastrando...') : (employee ? 'Salvar Alterações' : 'Cadastrar Funcionário')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
