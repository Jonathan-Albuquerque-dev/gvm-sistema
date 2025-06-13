
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, Loader2, AlertTriangle, UserSquare2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Employee } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function EmployeeDetailPage() {
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
            setError("Funcionário não encontrado.");
          }
        } catch (err) {
          console.error("Erro ao buscar funcionário:", err);
          setError("Falha ao carregar dados do funcionário.");
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

  const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
    value ? (
      <div className="py-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-md">{value}</p>
      </div>
    ) : null
  );

  return (
    <>
      <PageHeader 
        title={employee ? `Detalhes de ${employee.name}` : "Detalhes do Funcionário"}
        description={employee ? `Visualizando dados do funcionário ID: ${employeeId.substring(0,8)}...` : "Carregando..."}
      >
        <div className="flex items-center gap-2">
            {employee && (
                 <Link href={`/employees/${employeeId}/edit`}>
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" /> Editar
                    </Button>
                 </Link>
            )}
            <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
        </div>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do funcionário...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="shadow-lg border-destructive">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Erro ao Carregar Funcionário</CardTitle>
              <CardDescription className="text-destructive">{error}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && employee && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <UserSquare2 className="h-12 w-12 text-primary" />
            <div>
                <CardTitle className="text-2xl">{employee.name}</CardTitle>
                <CardDescription>{employee.position}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <DetailItem label="Data de Admissão" value={format(new Date(employee.admissionDate), 'PPP', { locale: ptBR })} />
            <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                <p className="text-md">{new Date(employee.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
             {employee.updatedAt && (
                <div className="py-2">
                    <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                    <p className="text-md">{new Date(employee.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
             )}
            {/* Futuramente, podemos adicionar campos como: Salário, Contato, etc. */}
          </CardContent>
        </Card>
      )}
    </>
  );
}
