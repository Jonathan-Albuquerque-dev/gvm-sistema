
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, Loader2, AlertTriangle, UserSquare2, TrendingUp, Percent } from 'lucide-react';
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

  const DetailItem = ({ label, value, currency = false }: { label: string; value?: string | number | null, currency?: boolean }) => (
    value !== undefined && value !== null ? (
      <div className="py-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-md">{currency && typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value}</p>
      </div>
    ) : null
  );

  const calculateEstimatedCharges = (salary: number) => {
    if (!salary || salary <= 0) return null;

    const fgts = salary * 0.08;
    const thirteenthSalaryProvision = salary / 12;
    const vacationProvision = (salary + salary / 3) / 12;
    const totalMonthlyCharges = fgts + thirteenthSalaryProvision + vacationProvision;
    const totalMonthlyCost = salary + totalMonthlyCharges;

    return {
      fgts,
      thirteenthSalaryProvision,
      vacationProvision,
      totalMonthlyCharges,
      totalMonthlyCost,
    };
  };

  const estimatedCharges = employee?.salary ? calculateEstimatedCharges(employee.salary) : null;


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
        <div className="space-y-6">
            <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <UserSquare2 className="h-12 w-12 text-primary" />
                <div>
                    <CardTitle className="text-2xl">{employee.name}</CardTitle>
                    <CardDescription>{employee.position}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <DetailItem label="Salário Bruto Mensal" value={employee.salary} currency />
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
            </CardContent>
            </Card>

            {estimatedCharges && (
                 <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Percent className="h-6 w-6 text-primary" />
                        <CardTitle>Estimativa de Encargos Trabalhistas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <DetailItem label="FGTS (8%)" value={estimatedCharges.fgts} currency />
                        <DetailItem label="Provisão Mensal 13º Salário" value={estimatedCharges.thirteenthSalaryProvision} currency />
                        <DetailItem label="Provisão Mensal Férias + 1/3" value={estimatedCharges.vacationProvision} currency />
                        <DetailItem label="Total Encargos Mensais Estimados" value={estimatedCharges.totalMonthlyCharges} currency />
                        <div className="sm:col-span-2 pt-2 mt-2 border-t">
                            <p className="text-sm font-medium text-muted-foreground">Custo Total Mensal Estimado (Salário + Encargos)</p>
                            <p className="text-lg font-semibold text-primary">{estimatedCharges.totalMonthlyCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                    </CardContent>
                    <CardContent className="pt-0">
                         <p className="text-xs text-muted-foreground">Nota: Esta é uma estimativa simplificada. Os encargos reais podem variar. Consulte um contador.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      )}
    </>
  );
}
