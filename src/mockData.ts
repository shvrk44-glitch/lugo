import { Account, Product, Order, Invoice, Payment, StockMovement, Delivery, Alert, PnLEntry } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Mobil Super 20W-50',
    packSize: '4L',
    listPrice: 18500,
    landedCost: 14200,
    litresPerUnit: 4,
    currentStock: 420,
    reorderLevel: 100,
    category: 'Passenger Car Motor Oil'
  },
  {
    id: 'prod-2',
    name: 'Mobil Super 20W-50',
    packSize: '20L',
    listPrice: 87000,
    landedCost: 69000,
    litresPerUnit: 20,
    currentStock: 150,
    reorderLevel: 40,
    category: 'Passenger Car Motor Oil'
  },
  {
    id: 'prod-3',
    name: 'Mobil Delvac MX 15W-40',
    packSize: '4L',
    listPrice: 21000,
    landedCost: 16500,
    litresPerUnit: 4,
    currentStock: 310,
    reorderLevel: 80,
    category: 'Heavy Duty Diesel Engine Oil'
  },
  {
    id: 'prod-4',
    name: 'Mobil Delvac MX 15W-40',
    packSize: '20L',
    listPrice: 98000,
    landedCost: 78000,
    litresPerUnit: 20,
    currentStock: 85,
    reorderLevel: 30,
    category: 'Heavy Duty Diesel Engine Oil'
  },
  {
    id: 'prod-5',
    name: 'Mobil Delvac MX 15W-40',
    packSize: '210L Drum',
    listPrice: 995000,
    landedCost: 810000,
    litresPerUnit: 210,
    currentStock: 14,
    reorderLevel: 5,
    category: 'Heavy Duty Diesel Engine Oil'
  },
  {
    id: 'prod-6',
    name: 'Mobil ATF 220',
    packSize: '4L',
    listPrice: 24000,
    landedCost: 19000,
    litresPerUnit: 4,
    currentStock: 180,
    reorderLevel: 50,
    category: 'Automatic Transmission Fluid'
  }
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Arewa Transporters Fleet Ltd',
    area: 'Bompai Industrial',
    contact: 'Alhaji Sani Bello',
    phone: '+234 803 456 7890',
    segment: 'Fleet',
    introducedBy: 'Al-Amin (CEO)',
    paymentType: 'Credit',
    creditLimit: 5000000,
    status: 'Active',
    notes: 'Major fleet operator with 45 trucks. Pays every 30 days.',
    createdAt: '2025-10-10',
    createdBy: 'Al-Amin',
    updatedAt: '2026-02-10'
  },
  {
    id: 'acc-2',
    name: 'Kano Central Auto Workshop',
    area: 'Fagge Mechanic Village',
    contact: 'Mal. Ibrahim Dan Kano',
    phone: '+234 802 111 2233',
    segment: 'Workshop',
    introducedBy: 'Umar Sales',
    paymentType: 'Credit',
    creditLimit: 1500000,
    status: 'Active',
    notes: 'Busy mechanic hub servicing commercial buses.',
    createdAt: '2025-10-15',
    createdBy: 'Umar Sales',
    updatedAt: '2026-02-12'
  },
  {
    id: 'acc-3',
    name: 'Sabon Gari Lubricants Emporium',
    area: 'Sabon Gari Market',
    contact: 'Chief Emeka Okafor',
    phone: '+234 805 788 9900',
    segment: 'Reseller',
    introducedBy: 'Al-Amin',
    paymentType: 'Cash',
    creditLimit: 0,
    status: 'Active',
    notes: 'Top wholesale retail partner in Sabon Gari.',
    createdAt: '2025-10-20',
    createdBy: 'Al-Amin',
    updatedAt: '2026-02-14'
  },
  {
    id: 'acc-4',
    name: 'Kofar Ruwa Spare Parts Union',
    area: 'Kofar Ruwa',
    contact: 'Alhaji Garba Kofar Ruwa',
    phone: '+234 803 333 4455',
    segment: 'Reseller',
    introducedBy: 'Umar Sales',
    paymentType: 'Credit',
    creditLimit: 2500000,
    status: 'Active',
    notes: 'Cooperative buying group for regional spare parts shops.',
    createdAt: '2025-11-01',
    createdBy: 'Umar Sales',
    updatedAt: '2026-01-10' // Note: quiet account test (>30 days)
  },
  {
    id: 'acc-5',
    name: 'Sharada Haulage & Logistics',
    area: 'Sharada Phase II',
    contact: 'Capt. Danlami Musa',
    phone: '+234 809 666 7788',
    segment: 'Fleet',
    introducedBy: 'Al-Amin',
    paymentType: 'Credit',
    creditLimit: 4000000,
    status: 'Active',
    notes: 'Heavy duty diesel consumers.',
    createdAt: '2025-11-15',
    createdBy: 'Al-Amin',
    updatedAt: '2026-02-15'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-2026-101',
    accountId: 'acc-1',
    accountName: 'Arewa Transporters Fleet Ltd',
    date: '2026-02-18',
    lines: [
      {
        productId: 'prod-5',
        productName: 'Mobil Delvac MX 15W-40',
        packSize: '210L Drum',
        quantity: 3,
        unitPrice: 995000,
        landedCost: 810000,
        discount: 15000,
        subtotal: 2970000
      },
      {
        productId: 'prod-2',
        productName: 'Mobil Super 20W-50',
        packSize: '20L',
        quantity: 10,
        unitPrice: 87000,
        landedCost: 69000,
        discount: 0,
        subtotal: 870000
      }
    ],
    deliveryFee: 15000,
    discount: 15000,
    totalAmount: 3840000,
    status: 'Delivered',
    createdBy: 'Umar Sales',
    createdAt: '2026-02-18'
  },
  {
    id: 'ORD-2026-102',
    accountId: 'acc-2',
    accountName: 'Kano Central Auto Workshop',
    date: '2026-02-20',
    lines: [
      {
        productId: 'prod-1',
        productName: 'Mobil Super 20W-50',
        packSize: '4L',
        quantity: 25,
        unitPrice: 18500,
        landedCost: 14200,
        discount: 0,
        subtotal: 462500
      },
      {
        productId: 'prod-3',
        productName: 'Mobil Delvac MX 15W-40',
        packSize: '4L',
        quantity: 20,
        unitPrice: 21000,
        landedCost: 16500,
        discount: 0,
        subtotal: 420000
      }
    ],
    deliveryFee: 5000,
    discount: 0,
    totalAmount: 887500,
    status: 'Confirmed',
    createdBy: 'Umar Sales',
    createdAt: '2026-02-20'
  },
  {
    id: 'ORD-2026-103',
    accountId: 'acc-3',
    accountName: 'Sabon Gari Lubricants Emporium',
    date: '2026-02-22',
    lines: [
      {
        productId: 'prod-1',
        productName: 'Mobil Super 20W-50',
        packSize: '4L',
        quantity: 60,
        unitPrice: 18500,
        landedCost: 14200,
        discount: 30000,
        subtotal: 1080000
      },
      {
        productId: 'prod-6',
        productName: 'Mobil ATF 220',
        packSize: '4L',
        quantity: 30,
        unitPrice: 24000,
        landedCost: 19000,
        discount: 0,
        subtotal: 720000
      }
    ],
    deliveryFee: 10000,
    discount: 30000,
    totalAmount: 1810000,
    status: 'Delivered',
    createdBy: 'Al-Amin',
    createdAt: '2026-02-22'
  },
  {
    id: 'ORD-2026-104',
    accountId: 'acc-5',
    accountName: 'Sharada Haulage & Logistics',
    date: '2026-01-10', // Older unpaid/overdue invoice for aging test
    lines: [
      {
        productId: 'prod-4',
        productName: 'Mobil Delvac MX 15W-40',
        packSize: '20L',
        quantity: 25,
        unitPrice: 98000,
        landedCost: 78000,
        discount: 20000,
        subtotal: 2430000
      }
    ],
    deliveryFee: 10000,
    discount: 20000,
    totalAmount: 2440000,
    status: 'Delivered',
    createdBy: 'Umar Sales',
    createdAt: '2026-01-10'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-101',
    orderId: 'ORD-2026-101',
    accountId: 'acc-1',
    accountName: 'Arewa Transporters Fleet Ltd',
    issueDate: '2026-02-18',
    dueDate: '2026-03-20',
    totalAmount: 3840000,
    paidAmount: 1500000,
    status: 'Partial',
    daysOverdue: 0
  },
  {
    id: 'INV-2026-102',
    orderId: 'ORD-2026-102',
    accountId: 'acc-2',
    accountName: 'Kano Central Auto Workshop',
    issueDate: '2026-02-20',
    dueDate: '2026-03-22',
    totalAmount: 887500,
    paidAmount: 0,
    status: 'Unpaid',
    daysOverdue: 0
  },
  {
    id: 'INV-2026-103',
    orderId: 'ORD-2026-103',
    accountId: 'acc-3',
    accountName: 'Sabon Gari Lubricants Emporium',
    issueDate: '2026-02-22',
    dueDate: '2026-02-22',
    totalAmount: 1810000,
    paidAmount: 1810000,
    status: 'Paid',
    daysOverdue: 0
  },
  {
    id: 'INV-2026-104',
    orderId: 'ORD-2026-104',
    accountId: 'acc-5',
    accountName: 'Sharada Haulage & Logistics',
    issueDate: '2026-01-10',
    dueDate: '2026-02-10',
    totalAmount: 2440000,
    paidAmount: 440000,
    status: 'Overdue',
    daysOverdue: 34 // >30 days overdue
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'PAY-501',
    accountId: 'acc-3',
    accountName: 'Sabon Gari Lubricants Emporium',
    date: '2026-02-22',
    amount: 1810000,
    method: 'Bank Transfer',
    reference: 'TRF-GTB-9988231',
    allocatedInvoices: [{ invoiceId: 'INV-2026-103', amount: 1810000 }],
    createdBy: 'Finance Clerk',
    createdAt: '2026-02-22'
  },
  {
    id: 'PAY-502',
    accountId: 'acc-1',
    accountName: 'Arewa Transporters Fleet Ltd',
    date: '2026-02-20',
    amount: 1500000,
    method: 'Bank Transfer',
    reference: 'TRF-ZENITH-441122',
    allocatedInvoices: [{ invoiceId: 'INV-2026-101', amount: 1500000 }],
    createdBy: 'Finance Clerk',
    createdAt: '2026-02-20'
  }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'SM-1',
    productId: 'prod-1',
    productName: 'Mobil Super 20W-50',
    packSize: '4L',
    type: 'Received',
    quantity: 500,
    batchNumber: 'MOB-BAT-2026-01',
    referenceId: 'SUP-REC-991',
    reason: 'Container arrival from Apapa port terminal',
    date: '2026-02-01',
    createdBy: 'Store Keeper'
  },
  {
    id: 'SM-2',
    productId: 'prod-5',
    productName: 'Mobil Delvac MX 15W-40',
    packSize: '210L Drum',
    type: 'Received',
    quantity: 20,
    batchNumber: 'MOB-BAT-2026-02',
    referenceId: 'SUP-REC-992',
    reason: 'Direct depot replenishment',
    date: '2026-02-05',
    createdBy: 'Store Keeper'
  },
  {
    id: 'SM-3',
    productId: 'prod-5',
    productName: 'Mobil Delvac MX 15W-40',
    packSize: '210L Drum',
    type: 'Dispatched',
    quantity: 3,
    batchNumber: 'MOB-BAT-2026-02',
    referenceId: 'ORD-2026-101',
    reason: 'Order fulfillment for Arewa Transporters',
    date: '2026-02-18',
    createdBy: 'Store Keeper'
  }
];

export const INITIAL_DELIVERIES: Delivery[] = [
  {
    id: 'DEL-301',
    orderId: 'ORD-2026-101',
    accountId: 'acc-1',
    accountName: 'Arewa Transporters Fleet Ltd',
    area: 'Bompai Industrial',
    scheduledDate: '2026-02-18',
    status: 'Delivered',
    receiverName: 'Alhaji Sani Bello',
    dispatchDriver: 'Mallam Yakubu'
  },
  {
    id: 'DEL-302',
    orderId: 'ORD-2026-102',
    accountId: 'acc-2',
    accountName: 'Kano Central Auto Workshop',
    area: 'Fagge Mechanic Village',
    scheduledDate: '2026-02-21',
    status: 'Pending',
    dispatchDriver: 'Sanusi Driver'
  },
  {
    id: 'DEL-303',
    orderId: 'ORD-2026-103',
    accountId: 'acc-3',
    accountName: 'Sabon Gari Lubricants Emporium',
    area: 'Sabon Gari Market',
    scheduledDate: '2026-02-22',
    status: 'Delivered',
    receiverName: 'Chief Emeka',
    dispatchDriver: 'Mallam Yakubu'
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-1',
    type: 'overdue_invoice',
    severity: 'high',
    title: 'Invoice > 30 Days Overdue',
    message: 'Sharada Haulage & Logistics has invoice INV-2026-104 overdue by 34 days (Balance: ₦2,000,000).',
    targetId: 'acc-5',
    date: '2026-02-22'
  },
  {
    id: 'ALT-2',
    type: 'quiet_account',
    severity: 'medium',
    title: 'Quiet Account (30+ days no order)',
    message: 'Kofar Ruwa Spare Parts Union has not placed an order in over 40 days.',
    targetId: 'acc-4',
    date: '2026-02-21'
  },
  {
    id: 'ALT-3',
    type: 'low_stock',
    severity: 'medium',
    title: 'Stock Near Reorder Level',
    message: 'Mobil Delvac MX 15W-40 (210L Drum) current stock is 14 drums (Reorder level: 5). Monitor closely.',
    targetId: 'prod-5',
    date: '2026-02-22'
  }
];

export const INITIAL_PNL: PnLEntry[] = [
  {
    month: 'November 2025',
    revenue: 34500000,
    costOfGoodsSold: 27100000,
    grossMargin: 7400000,
    operatingExpenses: 2100000,
    netProfit: 5300000
  },
  {
    month: 'December 2025',
    revenue: 42100000,
    costOfGoodsSold: 32800000,
    grossMargin: 9300000,
    operatingExpenses: 2300000,
    netProfit: 7000000
  },
  {
    month: 'January 2026',
    revenue: 38900000,
    costOfGoodsSold: 30200000,
    grossMargin: 8700000,
    operatingExpenses: 2200000,
    netProfit: 6500000
  },
  {
    month: 'February 2026 (MTD)',
    revenue: 28450000,
    costOfGoodsSold: 22100000,
    grossMargin: 6350000,
    operatingExpenses: 1800000,
    netProfit: 4550000
  }
];
