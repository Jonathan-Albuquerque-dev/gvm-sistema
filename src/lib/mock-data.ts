
import type { Client, Product, Budget, BudgetStatus, ProductCategory, SalesData, Employee, VariableCost, FixedCost } from '@/types';

const today = new Date();
const oneMonthAgo = new Date(new Date().setDate(today.getDate() - 30));
const twoMonthsAgo = new Date(new Date().setDate(today.getDate() - 60));
const threeDaysAgo = new Date(new Date().setDate(today.getDate() - 3));
const tenDaysAgo = new Date(new Date().setDate(today.getDate() - 10));
const fifteenDaysAgo = new Date(new Date().setDate(today.getDate() - 15));


export const MOCK_CLIENTS: Client[] = [
  { id: 'client-1', name: 'João Silva', companyName: 'Silva & Filhos Ltda', document: '12.345.678/0001-99', address: 'Rua das Palmeiras, 123, São Paulo, SP', email: 'joao.silva@example.com', phone: '(11) 98765-4321', budgetIds: ['budget-1', 'budget-3'], createdAt: oneMonthAgo.toISOString() },
  { id: 'client-2', name: 'Maria Oliveira', document: '987.654.321-00', address: 'Av. Principal, 456, Rio de Janeiro, RJ', email: 'maria.oliveira@example.com', phone: '(21) 91234-5678', budgetIds: ['budget-2'], createdAt: twoMonthsAgo.toISOString() },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Disjuntor Bipolar 40A', description: 'Disjuntor termomagnético bipolar 40A', salePrice: 45.90, costPrice: 22.50, category: 'electrical', createdAt: oneMonthAgo.toISOString() },
  { id: 'prod-2', name: 'Tubo PVC Esgoto 100mm', description: 'Barra com 6m de tubo PVC para esgoto DN100', salePrice: 89.00, costPrice: 45.00, category: 'hydraulic', createdAt: twoMonthsAgo.toISOString() },
  { id: 'prod-3', name: 'MDF Branco 18mm', description: 'Chapa de MDF Branco TX 18mm 275x183cm', salePrice: 250.00, costPrice: 150.00, category: 'carpentry', createdAt: today.toISOString() },
  { id: 'prod-4', name: 'Luminária LED Sobrepor 18W', description: 'Luminária LED quadrada de sobrepor 18W Bivolt', salePrice: 35.50, costPrice: 18.00, category: 'electrical', createdAt: oneMonthAgo.toISOString() },
];

export const MOCK_BUDGETS: Budget[] = [
  {
    id: 'budget-1',
    clientId: 'client-1',
    clientName: 'João Silva',
    items: [
      { productId: 'prod-1', productName: 'Disjuntor Bipolar 40A', quantity: 2, unitPrice: 45.90, totalPrice: 91.80 },
      { productId: 'prod-4', productName: 'Luminária LED Sobrepor 18W', quantity: 5, unitPrice: 35.50, totalPrice: 177.50 },
    ],
    materialCostInternal: (2 * 22.50) + (5 * 18.00), // 45 + 90 = 135.00
    totalAmount: 91.80 + 177.50, // 269.30
    status: 'approved',
    createdAt: oneMonthAgo.toISOString(),
    updatedAt: oneMonthAgo.toISOString(),
  },
  {
    id: 'budget-2',
    clientId: 'client-2',
    clientName: 'Maria Oliveira',
    items: [
      { productId: 'prod-2', productName: 'Tubo PVC Esgoto 100mm', quantity: 3, unitPrice: 89.00, totalPrice: 267.00 },
    ],
    materialCostInternal: 3 * 45.00, // 135.00
    totalAmount: 267.00,
    status: 'sent',
    createdAt: twoMonthsAgo.toISOString(),
    updatedAt: twoMonthsAgo.toISOString(),
  },
  {
    id: 'budget-3',
    clientId: 'client-1',
    clientName: 'João Silva',
    items: [
      { productId: 'prod-3', productName: 'MDF Branco 18mm', quantity: 1, unitPrice: 250.00, totalPrice: 250.00 },
    ],
    materialCostInternal: 1 * 150.00, // 150.00
    totalAmount: 250.00,
    status: 'draft',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
   {
    id: 'budget-4',
    clientId: 'client-2',
    clientName: 'Maria Oliveira',
    items: [
      { productId: 'prod-1', productName: 'Disjuntor Bipolar 40A', quantity: 10, unitPrice: 45.90, totalPrice: 459.00 },
    ],
    materialCostInternal: 10 * 22.50, // 225.00
    totalAmount: 459.00,
    status: 'approved',
    createdAt: fifteenDaysAgo.toISOString(),
    updatedAt: fifteenDaysAgo.toISOString(),
  }
];

export const MOCK_SALES_DATA: SalesData[] = [
  { month: 'Jan', totalSales: 1200 },
  { month: 'Fev', totalSales: 1900 },
  { month: 'Mar', totalSales: 1500 },
  { month: 'Abr', totalSales: 2800 },
  { month: 'Mai', totalSales: 1300 },
  { month: 'Jun', totalSales: MOCK_BUDGETS.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.totalAmount, 0) },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Carlos Pereira', position: 'Eletricista Chefe', admissionDate: new Date(2022, 0, 15).toISOString(), createdAt: new Date(2022, 0, 15).toISOString() },
  { id: 'emp-2', name: 'Ana Souza', position: 'Auxiliar Administrativo', admissionDate: new Date(2023, 5, 10).toISOString(), createdAt: new Date(2023, 5, 10).toISOString() },
  { id: 'emp-3', name: 'Roberto Lima', position: 'Marceneiro Pleno', admissionDate: new Date(2021, 8, 1).toISOString(), createdAt: new Date(2021, 8, 1).toISOString() },
];

export const MOCK_VARIABLE_COSTS: VariableCost[] = [
  { id: 'cost-1', description: 'Almoço equipe Carlos', amount: 75.50, date: threeDaysAgo.toISOString(), employeeId: 'emp-1', employeeName: 'Carlos Pereira', category: 'food', createdAt: threeDaysAgo.toISOString()},
  { id: 'cost-2', description: 'Vale transporte Ana', amount: 180.00, date: oneMonthAgo.toISOString(), employeeId: 'emp-2', employeeName: 'Ana Souza', category: 'transport', createdAt: oneMonthAgo.toISOString()},
  { id: 'cost-3', description: 'Compra de parafusos e buchas', amount: 45.20, date: tenDaysAgo.toISOString(), category: 'office_supplies', createdAt: tenDaysAgo.toISOString()},
  { id: 'cost-4', description: 'Gasolina para visita técnica', amount: 60.00, date: new Date(new Date().setDate(today.getDate() - 5)).toISOString(), employeeId: 'emp-1', employeeName: 'Carlos Pereira', category: 'transport', createdAt: new Date(new Date().setDate(today.getDate() - 5)).toISOString()},
];

export const MOCK_FIXED_COSTS: FixedCost[] = [
  { id: 'fixed-1', description: 'Aluguel do Escritório', amount: 1200.00, category: 'rent', createdAt: oneMonthAgo.toISOString()},
  { id: 'fixed-2', description: 'Salário Carlos Pereira', amount: 3500.00, category: 'salary', createdAt: oneMonthAgo.toISOString()},
  { id: 'fixed-3', description: 'Salário Ana Souza', amount: 2200.00, category: 'salary', createdAt: oneMonthAgo.toISOString()},
  { id: 'fixed-4', description: 'Conta de Luz Escritório', amount: 150.00, category: 'utilities', createdAt: oneMonthAgo.toISOString()},
  { id: 'fixed-5', description: 'Internet Escritório', amount: 99.00, category: 'utilities', createdAt: oneMonthAgo.toISOString()},
];
