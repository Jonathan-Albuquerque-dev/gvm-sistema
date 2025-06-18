
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { Boleto, BoletoParcela, Client } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';

const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Selecione um cliente.' }),
  totalAmount: z.coerce.number().positive({ message: 'Valor total deve ser positivo.' }),
  numberOfInstallments: z.coerce.number().min(1, { message: 'Pelo menos uma parcela.' }).max(36, { message: 'Máximo de 36 parcelas.'}),
  initialDueDate: z.date({ required_error: 'Data de vencimento da 1ª parcela é obrigatória.' }),
  observations: z.string().optional(),
});

interface BoletoFormProps {
  boleto?: Boleto | null;
  onSubmitSuccess?: () => void;
}

export function BoletoForm({ boleto, onSubmitSuccess }: BoletoFormProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingClients, setIsFetchingClients] = useState(true);
  const [calculatedInstallments, setCalculatedInstallments] = useState<BoletoParcela[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: boleto ? {
      clientId: boleto.clientId,
      totalAmount: boleto.totalAmount,
      numberOfInstallments: boleto.numberOfInstallments,
      initialDueDate: parseISO(boleto.initialDueDate),
      observations: boleto.observations || '',
    } : {
      clientId: '',
      totalAmount: 0,
      numberOfInstallments: 1,
      initialDueDate: new Date(),
      observations: '',
    },
  });

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
        toast({ title: "Erro ao buscar clientes", description: "Não foi possível carregar a lista.", variant: "destructive" });
      } finally {
        setIsFetchingClients(false);
      }
    };
    fetchClients();
  }, [toast]);

  useEffect(() => {
    if (boleto) {
      form.reset({
        clientId: boleto.clientId,
        totalAmount: boleto.totalAmount,
        numberOfInstallments: boleto.numberOfInstallments,
        initialDueDate: parseISO(boleto.initialDueDate),
        observations: boleto.observations || '',
      });
      setCalculatedInstallments(boleto.installments);
    } else {
       form.reset({ clientId: '', totalAmount: 0, numberOfInstallments: 1, initialDueDate: new Date(), observations: ''});
       setCalculatedInstallments([]);
    }
  }, [boleto, form]);
  
  const watchedValues = form.watch(['totalAmount', 'numberOfInstallments', 'initialDueDate']);

  const calculateAndSetInstallments = useCallback(() => {
    const { totalAmount, numberOfInstallments, initialDueDate } = form.getValues();

    if (totalAmount > 0 && numberOfInstallments > 0 && initialDueDate) {
      const installmentValue = parseFloat((totalAmount / numberOfInstallments).toFixed(2));
      const newInstallments: BoletoParcela[] = [];
      let accumulatedValue = 0;

      for (let i = 0; i < numberOfInstallments; i++) {
        let currentInstallmentValue = installmentValue;
        if (i === numberOfInstallments - 1) { // Last installment adjusts for rounding
          currentInstallmentValue = parseFloat((totalAmount - accumulatedValue).toFixed(2));
        }
        
        newInstallments.push({
          parcelNumber: i + 1,
          value: currentInstallmentValue,
          dueDate: addDays(initialDueDate, i * 30).toISOString(),
          status: 'pendente',
        });
        accumulatedValue += installmentValue; // Use original installmentValue for accumulation tracking before adjustment
      }
      setCalculatedInstallments(newInstallments);
    } else {
      setCalculatedInstallments([]);
    }
  }, [form]);

  useEffect(() => {
    calculateAndSetInstallments();
  }, [watchedValues, calculateAndSetInstallments]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const selectedClient = clients.find(c => c.id === values.clientId);
    if (!selectedClient) {
      toast({ title: "Erro", description: "Cliente não encontrado.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (calculatedInstallments.length === 0) {
      toast({ title: "Erro", description: "Nenhuma parcela calculada. Verifique os valores.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const boletoData: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'> = {
      clientId: values.clientId,
      clientName: selectedClient.name,
      totalAmount: values.totalAmount,
      numberOfInstallments: values.numberOfInstallments,
      initialDueDate: values.initialDueDate.toISOString(),
      installments: calculatedInstallments,
      observations: values.observations || '',
    };

    try {
      if (boleto && boleto.id) {
        await updateDoc(doc(db, 'boletos', boleto.id), {
          ...boletoData,
          updatedAt: new Date().toISOString(),
        });
        toast({ title: 'Boleto Atualizado!', description: `Boleto para ${selectedClient.name} atualizado.` });
      } else {
        await addDoc(collection(db, 'boletos'), {
          ...boletoData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast({ title: 'Boleto Criado!', description: `Boleto para ${selectedClient.name} salvo.` });
        form.reset({ clientId: '', totalAmount: 0, numberOfInstallments: 1, initialDueDate: new Date(), observations: ''});
        setCalculatedInstallments([]);
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao salvar boleto:", error);
      toast({ title: 'Erro ao Salvar Boleto', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>{boleto ? 'Editar Boleto' : 'Novo Boleto'}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isFetchingClients || isLoading}>
                    <FormControl><SelectTrigger>
                      <SelectValue placeholder={isFetchingClients ? "Carregando..." : "Selecione um cliente"} />
                    </SelectTrigger></FormControl>
                    <SelectContent>
                      {!isFetchingClients && clients.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhum cliente.</p>}
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$)*</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="Ex: 1000.00" {...field} disabled={isLoading} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfInstallments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº de Parcelas*</FormLabel>
                    <FormControl><Input type="number" min="1" max="36" placeholder="Ex: 12" {...field} disabled={isLoading} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="initialDueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Vencimento da 1ª Parcela*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isLoading}>
                          {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Textarea placeholder="Observações adicionais sobre os boletos..." {...field} value={field.value ?? ''} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {calculatedInstallments.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Parcelas Calculadas</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium">Nº</th>
                      <th className="p-2 text-left font-medium">Valor (R$)</th>
                      <th className="p-2 text-left font-medium">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedInstallments.map((inst) => (
                      <tr key={inst.parcelNumber} className="border-b">
                        <td className="p-2">{inst.parcelNumber}</td>
                        <td className="p-2">{inst.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-2">{format(parseISO(inst.dueDate), "dd/MM/yyyy", { locale: ptBR })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || isFetchingClients || calculatedInstallments.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {boleto ? 'Salvar Alterações' : 'Criar Boletos'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
