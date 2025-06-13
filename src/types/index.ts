
export interface Client {
  id: string; // Firestore document ID
  name: string;
  companyName?: string;
  document: string; // CNPJ or CPF
  address: string;
  email: string;
  phone: string;
  budgetIds: string[]; // Will be initialized as empty array
  createdAt: string; // ISO Date String
  updatedAt?: string; // ISO Date String
  // userId?: string; // Optional: for multi-user apps
}

export type ProductCategory = 'produto' | 'serviço';
export const PRODUCT_CATEGORIES: ProductCategory[] = ['produto', 'serviço'];


export interface Product {
  id: string;
  name: string;
  description: string;
  salePrice: number;
  costPrice: number; // Internal
  category: ProductCategory;
  createdAt: string;
  updatedAt?: string; // ISO Date String
  // userId?: string; 
}

export interface BudgetItem {
  productId: string;
  productName: string; 
  quantity: number;
  unitPrice: number; 
  totalPrice: number;
}

export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export interface Budget {
  id: string;
  clientName: string; 
  clientId: string;
  items: BudgetItem[];
  materialCostInternal: number;
  totalAmount: number;
  status: BudgetStatus;
  observations?: string;
  createdAt: string;
  updatedAt: string;
  // userId?: string; 
}

export interface SalesData {
  month: string;
  totalSales: number;
}

export interface Employee {
  id: string;
  name: string;
  position: string; 
  salary: number; // Salário Bruto Mensal
  admissionDate: string; 
  createdAt: string;
  updatedAt?: string; // ISO Date String
  // userId?: string;
}

export const COST_CATEGORIES = ['food', 'transport', 'salary', 'rent', 'utilities', 'marketing', 'office_supplies', 'other', 'benefits'] as const;
export type CostCategory = typeof COST_CATEGORIES[number];


export interface VariableCost {
  id: string;
  description: string;
  amount: number;
  date: string; // Should be ISO string from Date object
  employeeId?: string; 
  employeeName?: string; 
  category: CostCategory | string; // Allow string for flexibility if categories might expand beyond the defined set
  createdAt: string;
  updatedAt?: string; // ISO Date String
  // userId?: string;
}

export interface FixedCost {
  id: string;
  description: string;
  amount: number;
  category: CostCategory | string; // Allow string
  createdAt: string;
  updatedAt?: string; // ISO Date String
  // userId?: string;
}

