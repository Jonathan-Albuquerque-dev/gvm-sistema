
'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit3, Trash2, MoreVertical, Eye, Loader2 } from 'lucide-react';
import type { Employee } from '@/types';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const employeesData: Employee[] = [];
      querySnapshot.forEach((doc) => {
        employeesData.push({ id: doc.id, ...doc.data() } as Employee);
      });
      setEmployees(employeesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar funcionários:", error);
      toast({ title: "Erro ao buscar funcionários", description: "Não foi possível carregar a lista.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleEdit = (employeeId: string) => {
    router.push(`/employees/${employeeId}/edit`);
  };

  const handleDelete = async (employeeId: string, employeeName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o funcionário "${employeeName}"?`)) {
        return;
    }
    try {
      await deleteDoc(doc(db, 'employees', employeeId));
      toast({
        title: 'Funcionário Excluído!',
        description: `O funcionário "${employeeName}" foi excluído com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao excluir funcionário:", error);
      toast({
        title: 'Erro ao Excluir',
        description: `Não foi possível excluir o funcionário. Tente novamente.`,
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (employeeId: string) => {
    router.push(`/employees/${employeeId}`);
  };
  
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando funcionários...</p>
      </div>
    );
  }

  return (
     <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
            placeholder="Buscar por nome ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="hidden md:table-cell">Data de Admissão</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(employee.admissionDate), 'P', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(employee.id)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(employee.id)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(employee.id, employee.name)} className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhum funcionário encontrado. {employees.length === 0 && !searchTerm ? "Cadastre o primeiro funcionário." : ""}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
            {filteredEmployees.length === 0 && (employees.length > 0 || searchTerm) && (
             <TableCaption>Nenhum funcionário encontrado para "{searchTerm}".</TableCaption>
           )}
        </Table>
      </div>
    </div>
  );
}
