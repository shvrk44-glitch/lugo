export type UserRole = 'CEO' | 'Sales Lead' | 'Depot / Dispatch' | 'Finance / Cashier' | 'Viewer';

export type AccountSegment = 'Fleet' | 'Workshop' | 'Reseller';
export type PaymentType = 'Cash' | 'Credit';
export type AccountStatus = 'Active' | 'On hold' | 'Closed';

export interface Account {
  id: string;
  name: string;
  area: string; // e.g. Sabon Gari, Fagge, Kofar Ruwa, Bompai, Sharada, Wapa, Kantin Kwari
  contact: string;
  phone: string;
  segment: AccountSegment;
  introducedBy: string;
  paymentType: PaymentType;
  creditLimit: number; // in NGN
  status: AccountStatus;
  notes: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  packSize: string; // e.g. '4L', '20L', '210L Drum'
  listPrice: number; // NGN
  landedCost: number; // NGN (for gross margin per litre calculation)
  litresPerUnit: number;
  currentStock: number; // units
  reorderLevel: number; // units
  category: string;
}

export type OrderStatus = 'Draft' | 'Confirmed' | 'Delivered' | 'Cancelled';

export interface OrderLine {
  productId: string;
  productName: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
  landedCost: number;
  discount: number; // NGN
  subtotal: number;
}

export interface Order {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  lines: OrderLine[];
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: OrderStatus;
  priceOverrideReason?: string;
  overCreditOverride?: boolean;
  overCreditReason?: string;
  createdBy: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  accountId: string;
  accountName: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  daysOverdue: number;
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'POS';

export interface Payment {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string; // e.g. Teller ref, transfer UTR, POS auth code
  allocatedInvoices: { invoiceId: string; amount: number }[];
  createdBy: string;
  createdAt: string;
}

export type StockMovementType = 'Received' | 'Dispatched' | 'Adjustment';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  packSize: string;
  type: StockMovementType;
  quantity: number;
  batchNumber?: string;
  referenceId?: string; // orderId or supplier receipt #
  reason?: string;
  date: string;
  createdBy: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  accountId: string;
  accountName: string;
  area: string;
  scheduledDate: string;
  status: 'Pending' | 'Delivered' | 'Failed';
  receiverName?: string;
  failReason?: string;
  dispatchDriver: string;
}

export interface Alert {
  id: string;
  type: 'credit_exceeded' | 'overdue_invoice' | 'quiet_account' | 'low_stock' | 'price_override';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  targetId?: string;
  date: string;
}

export interface PnLEntry {
  month: string;
  revenue: number;
  costOfGoodsSold: number;
  grossMargin: number;
  operatingExpenses: number;
  netProfit: number;
}
