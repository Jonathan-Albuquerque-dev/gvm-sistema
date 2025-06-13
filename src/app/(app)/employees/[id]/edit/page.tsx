
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { EmployeeForm } from '@/components/employees/employee-form';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Employee } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      const fetchEmployee = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const employeeDocRef = doc(db, 'employees', employeeId);
          const employeeDocSnap = await getDoc(employeeDocRef);

          if (employeeDocSnap.exists()) {
            setEmployee({ id: employeeDocSnap.id, ...employeeDocSnap.data() } as Employee);
          } else {
            setError("Funcionário não encontrado para edição.");
          }
        } catch (err) {
          console.error("Erro ao buscar funcionário para edição:", err);
          setError("Falha ao carregar dados do funcionário para edição.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchEmployee();
    } else {
        setError("ID do funcionário não fornecido.");
        setIsLoading(false);
    }
  }, [employeeId]);

  const handleSuccess = () => {
    router.push('/employees');
  };

  return (
    <>
      <PageHeader 
        title={employee ? `Editar Funcionário: ${employee.name}` : "Editar Funcionário"}
        description={employee ? `Modificando dados do funcionário ID: ${employeeId.substring(0,8)}...` : "Carregando..."}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do funcionário para edição...</p>
        </div>
      )}

      {error && !isLoading && (
         <Card className="shadow-lg border-destructive">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Erro ao Carregar Edição</CardTitle>
              <CardDescription className="text-destructive">{error}</CardDescription>
            </div>
          </CardHeader>
           <CardContent>
             <Button onClick={() => router.push('/employees')}>Voltar para Funcionários</Button>
           </CardContent>
        </Card>
      )}

      {!isLoading && !error && employee && (
        <EmployeeForm employee={employee} onSubmitSuccess={handleSuccess} />
      )}
      
      {!isLoading && !error && !employee && !employeeId && ( 
         <Card className="shadow-lg border-destructive">
          <CardHeader>
              <CardTitle className="text-destructive">Erro</CardTitle>
              <CardDescription className="text-destructive">ID do funcionário não fornecido na URL.</CardDescription>
          </CardHeader>
           <CardContent>
             <Button onClick={() => router.push('/employees')}>Voltar para Funcionários</Button>
           </CardContent>
        </Card>
      )}
    </>
  );
}
