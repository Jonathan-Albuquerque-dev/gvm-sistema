
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
  createdAt: string;
  updatedAt: string;
}

// For dashboard sales chart
export interface SalesData {
  month: string;
  totalSales: number;
}

// New types for Employees and Variable Costs
export interface Employee {
  id: string;
  name: string;
  position: string; // Cargo
  admissionDate: string; // Data de Admissão
  createdAt: string;
  // Future: contact (email, phone), salary, etc.
}

export type CostCategory = 'food' | 'transport' | 'benefits' | 'office_supplies' | 'other';

export interface VariableCost {
  id: string;
  description: string;
  amount: number;
  date: string;
  employeeId?: string; // Optional: link to an employee
  employeeName?: string; // Denormalized for display
  category: CostCategory | string; // Allow predefined or custom categories
  createdAt: string;
}
