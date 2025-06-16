
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, Loader2, AlertTriangle, UserSquare2, Percent, CheckCircle, XCircle, DollarSign, Utensils, Bus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Employee } from '@/types';
import { format, isWeekend, getDaysInMonth } from 'date-fns';
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

  const DetailItem = ({ label, value, currency = false, isBoolean = false, isNegative = false, Icon }: { label: string; value?: string | number | boolean | null, currency?: boolean, isBoolean?: boolean, isNegative?: boolean, Icon?: React.ElementType }) => {
    if (value === undefined || value === null) return null;

    let displayValue: React.ReactNode = value;
    if (isBoolean) {
      displayValue = value ? 
        <span className="flex items-center text-green-600"><CheckCircle className="mr-1 h-4 w-4" /> Sim</span> : 
        <span className="flex items-center text-red-600"><XCircle className="mr-1 h-4 w-4" /> Não</span>;
    } else if (currency && typeof value === 'number') {
      displayValue = (isNegative && value > 0 ? -value : value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    
    return (
      <div className="py-1">
        <div className="text-sm font-medium text-muted-foreground flex items-center">
          {Icon && <Icon className="mr-1.5 h-4 w-4" />}
          {label}
        </div>
        <div className={`text-md ${isNegative ? 'text-red-600 dark:text-red-400' : ''}`}>{displayValue}</div>
      </div>
    );
  };
  
  const getBusinessDaysInCurrentMonth = (): number => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const daysInMonthCount = getDaysInMonth(new Date(year, month));
    let businessDaysCount = 0;
    for (let day = 1; day <= daysInMonthCount; day++) {
      const currentDate = new Date(year, month, day);
      if (!isWeekend(currentDate)) {
        businessDaysCount++;
      }
    }
    return businessDaysCount;
  };

  const businessDaysInCurrentMonth = useMemo(() => getBusinessDaysInCurrentMonth(), []);


  const calculateEstimatedCharges = (salary: number, hasMealVoucherOpt?: boolean, hasTransportVoucherOpt?: boolean) => {
    if (!salary || salary <= 0) return null;

    const fgts = salary * 0.08;
    const thirteenthSalaryProvision = salary / 12;
    const vacationProvision = (salary + salary / 3) / 12;
    
    const dailyMealVoucherRate = 15;
    const dailyTransportVoucherRate = 9;

    const mealVoucherCost = hasMealVoucherOpt ? businessDaysInCurrentMonth * dailyMealVoucherRate : 0;
    const transportVoucherCost = hasTransportVoucherOpt ? businessDaysInCurrentMonth * dailyTransportVoucherRate : 0;

    const totalMonthlyBenefitCosts = mealVoucherCost + transportVoucherCost;
    const totalMonthlyCharges = fgts + thirteenthSalaryProvision + vacationProvision + totalMonthlyBenefitCosts;
    const totalMonthlyCost = salary + totalMonthlyCharges;

    return {
      fgts,
      thirteenthSalaryProvision,
      vacationProvision,
      mealVoucherCost,
      transportVoucherCost,
      totalMonthlyBenefitCosts,
      totalMonthlyCharges,
      totalMonthlyCost,
    };
  };

  const calculateNetSalary = (salary: number, hasTransportVoucher?: boolean) => {
    if (!salary || salary <= 0) return null;

    const inssDiscountRate = 0.075; // 7.5%
    const transportVoucherDiscountRate = 0.06; // 6%

    const inssAmount = salary * inssDiscountRate;
    let transportVoucherAmount = 0;
    if (hasTransportVoucher) {
      transportVoucherAmount = salary * transportVoucherDiscountRate;
    }

    const totalDeductions = inssAmount + transportVoucherAmount;
    const netSalary = salary - totalDeductions;

    return {
      inssAmount,
      transportVoucherAmount,
      totalDeductions,
      netSalary,
    };
  };

  const estimatedCharges = employee?.salary ? calculateEstimatedCharges(employee.salary, employee.hasMealVoucher, employee.hasTransportVoucher) : null;
  const estimatedNetSalary = employee?.salary ? calculateNetSalary(employee.salary, employee.hasTransportVoucher) : null;


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
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <DetailItem label="Salário Bruto Mensal" value={employee.salary} currency />
                <DetailItem label="Data de Admissão" value={format(new Date(employee.admissionDate), 'PPP', { locale: ptBR })} />
                 <DetailItem label="Vale Alimentação (Optante)" value={employee.hasMealVoucher} isBoolean Icon={Utensils} />
                <DetailItem label="Vale Transporte (Optante)" value={employee.hasTransportVoucher} isBoolean Icon={Bus} />
                <div className="py-1">
                    <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                    <p className="text-md">{new Date(employee.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                {employee.updatedAt && (
                    <div className="py-1">
                        <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                        <p className="text-md">{new Date(employee.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                )}
            </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {estimatedCharges && (
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Percent className="h-6 w-6 text-primary" />
                            <CardTitle>Estimativa de Encargos (Empresa)</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                            <DetailItem label="FGTS (8%)" value={estimatedCharges.fgts} currency />
                            <DetailItem label="Provisão Mensal 13º Salário" value={estimatedCharges.thirteenthSalaryProvision} currency />
                            <DetailItem label="Provisão Mensal Férias + 1/3" value={estimatedCharges.vacationProvision} currency />
                            
                            {employee.hasMealVoucher && estimatedCharges.mealVoucherCost > 0 && (
                                <DetailItem 
                                    label={`Custo Vale Alimentação (${businessDaysInCurrentMonth} dias úteis)`} 
                                    value={estimatedCharges.mealVoucherCost} 
                                    currency 
                                    Icon={Utensils}
                                />
                            )}
                             {employee.hasTransportVoucher && estimatedCharges.transportVoucherCost > 0 && (
                                <DetailItem 
                                    label={`Custo Vale Transporte (${businessDaysInCurrentMonth} dias úteis)`} 
                                    value={estimatedCharges.transportVoucherCost} 
                                    currency 
                                    Icon={Bus}
                                />
                            )}

                            <DetailItem label="Total Encargos Mensais Estimados" value={estimatedCharges.totalMonthlyCharges} currency className="sm:col-span-2 font-semibold" />
                            
                            <div className="sm:col-span-2 pt-2 mt-2 border-t">
                                <p className="text-sm font-medium text-muted-foreground">Custo Total Mensal Estimado (Salário + Encargos)</p>
                                <p className="text-lg font-semibold text-primary">{estimatedCharges.totalMonthlyCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                        </CardContent>
                        <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground">Nota: Encargos da empresa. Não são descontados do funcionário. Inclui estimativa de benefícios com base nos dias úteis do mês corrente ({businessDaysInCurrentMonth} dias). Consulte um contador para valores exatos.</p>
                        </CardContent>
                    </Card>
                )}

                {estimatedNetSalary && employee.salary && estimatedCharges && (
                     <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <DollarSign className="h-6 w-6 text-green-600" />
                            <CardTitle>Estimativa de Salário Líquido (Funcionário)</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                            <DetailItem label="Salário Bruto" value={employee.salary} currency />
                            
                            {employee.hasMealVoucher && estimatedCharges.mealVoucherCost > 0 && (
                                <DetailItem 
                                    label="Vale Alimentação (Benefício)" 
                                    value={estimatedCharges.mealVoucherCost} 
                                    currency 
                                    Icon={Utensils}
                                />
                            )}
                            {employee.hasTransportVoucher && estimatedCharges.transportVoucherCost > 0 && (
                                 <DetailItem 
                                    label="Vale Transporte (Benefício Total)" 
                                    value={estimatedCharges.transportVoucherCost} 
                                    currency 
                                    Icon={Bus}
                                />
                            )}
                            
                            <DetailItem label="Desconto INSS (7.5%)" value={estimatedNetSalary.inssAmount} currency isNegative />
                            {employee.hasTransportVoucher && (
                                <DetailItem label="Desconto Vale Transporte (Co-participação 6%)" value={estimatedNetSalary.transportVoucherAmount} currency isNegative />
                            )}
                             <DetailItem label="Total Descontos Estimados (sobre salário)" value={estimatedNetSalary.totalDeductions} currency isNegative />
                            <div className="sm:col-span-2 pt-2 mt-2 border-t">
                                <p className="text-sm font-medium text-muted-foreground">Salário Líquido Estimado (Bruto - Descontos)</p>
                                <p className="text-lg font-semibold text-green-700 dark:text-green-500">{estimatedNetSalary.netSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                        </CardContent>
                        <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground">Nota: Estimativa simplificada. O Salário Líquido é (Salário Bruto - Desconto INSS - Desconto VT). Os valores de VA e VT (Benefício) são informativos. Outros descontos (IRRF, etc.) ou acréscimos podem se aplicar. Consulte um contador.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      )}
    </>
  );
}

