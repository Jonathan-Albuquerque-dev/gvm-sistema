
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
  // laborCost: number; // Removido
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
