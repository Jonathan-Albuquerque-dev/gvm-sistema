
export interface Client {
  id: string;
  name: string;
  companyName?: string;
  document: string; // CNPJ or CPF
  address: string;
  email: string;
  phone: string;
  budgetIds: string[];
  createdAt: string;
}

export type ProductCategory = 'electrical' | 'hydraulic' | 'carpentry' | 'other';

export interface Product {
  id: string;
  name: string;
  description: string;
  salePrice: number;
  costPrice: number; // Internal
  category: ProductCategory;
  createdAt: string;
}

export interface BudgetItem {
  productId: string;
  productName: string; // Denormalized for display
  quantity: number;
  unitPrice: number; // Sale price at the time of budget creation
  totalPrice: number;
}

export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export interface Budget {
  id: string;
  clientName: string; // Denormalized for display
  clientId: string;
  items: BudgetItem[];
  materialCostInternal: number;
  totalAmount: number;
  status: BudgetStatus;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

// For dashboard sales chart
export interface SalesData {
  month: string;
  totalSales: number;
}

export interface Employee {
  id: string;
  name: string;
  position: string; // Cargo
  admissionDate: string; // Data de Admissão
  createdAt: string;
}

export type CostCategory = 'food' | 'transport' | 'salary' | 'rent' | 'utilities' | 'marketing' | 'office_supplies' | 'other' | 'benefits';


export interface VariableCost {
  id: string;
  description: string;
  amount: number;
  date: string;
  employeeId?: string; 
  employeeName?: string; 
  category: CostCategory | string; 
  createdAt: string;
}

export interface FixedCost {
  id: string;
  description: string;
  amount: number;
  category: CostCategory | string;
  // recurringDayOfMonth: number; // Example: 1 for 1st of month - for future implementation
  createdAt: string;
}
