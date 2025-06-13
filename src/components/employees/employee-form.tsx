
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
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  position: z.string().min(3, { message: 'Cargo deve ter pelo menos 3 caracteres.' }),
  admissionDate: z.date({ required_error: 'Data de admissão é obrigatória.' }),
});

interface EmployeeFormProps {
  employee?: Employee; // For editing
  onSubmitSuccess?: () => void;
}

export function EmployeeForm({ employee, onSubmitSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: employee ? {
      ...employee,
      admissionDate: new Date(employee.admissionDate),
    } : {
      name: '',
      position: '',
      admissionDate: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const employeeToSave = {
        ...values,
        admissionDate: values.admissionDate.toISOString(),
    }
    console.log('Dados do Funcionário:', employeeToSave);
    toast({
      title: employee ? 'Funcionário Atualizado!' : 'Funcionário Cadastrado!',
      description: `O funcionário ${values.name} foi ${employee ? 'atualizado' : 'salvo'} com sucesso.`,
    });
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
    if (!employee) { 
        form.reset({ name: '', position: '', admissionDate: undefined });
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
                    <Input placeholder="Ex: Carlos Alberto da Silva" {...field} />
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
                      <Input placeholder="Ex: Eletricista" {...field} />
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
            <Button type="submit" className="w-full md:w-auto">
              {employee ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
