
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
export type DiscountType = 'fixed' | 'percentage';
export const PAYMENT_METHODS = ['À vista', 'Crédito', 'Boletos'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export interface Budget {
  id: string;
  clientName: string; 
  clientId: string;
  items: BudgetItem[];
  materialCostInternal: number;
  totalAmount: number; // Este será o valor final após descontos, fretes e impostos
  status: BudgetStatus;
  observations?: string;
  deliveryTime?: string; 
  paymentMethod?: PaymentMethod;
  
  appliedDiscountAmount?: number; // Valor monetário do desconto efetivamente aplicado
  discountType?: DiscountType;    // Tipo de desconto ('fixed' ou 'percentage')
  discountInput?: number;         // Valor inserido pelo usuário (R$ ou %)

  shippingCost?: number; 
  taxAmount?: number; 
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
  hasMealVoucher?: boolean;
  hasTransportVoucher?: boolean;
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

export type BoletoParcelaStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado';

export interface BoletoParcela {
  parcelNumber: number;
  value: number;
  dueDate: string; // ISO Date String
  status: BoletoParcelaStatus;
  paymentDate?: string; // ISO Date String, when it was paid
}

export interface Boleto {
  id: string; // Firestore document ID
  clientId: string;
  clientName: string;
  totalAmount: number;
  numberOfInstallments: number;
  initialDueDate: string; // ISO Date String for the first installment
  installments: BoletoParcela[];
  observations?: string;
  createdAt: string; // ISO Date String
  updatedAt?: string; // ISO Date String
  // userId?: string;
}
