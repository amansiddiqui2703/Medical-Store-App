export interface Customer {
  id: number;
  name: string;
  phone: string;
  meds: string;
  dosageNotes?: string;
  refillDate: string; // YYYY-MM-DD
  cycleDays: number;
  lastBill: number;
  credit: number; // Udhaar amount
  lastVisit: string;
  allergies?: string;
  doctorName?: string;
}

export interface StockItem {
  id: number;
  name: string;
  strength?: string;
  batch: string;
  qty: number;
  expiry: string; // YYYY-MM-DD
  supplier: string;
  cost: number;
  mrp: number;
  category?: string;
}

export interface DistributorReturn {
  id: number;
  stockId: number;
  name: string;
  batch: string;
  supplier: string;
  qty: number;
  cost: number;
  expiry: string;
  reason: string;
  addedAt: string;
  status: 'pending' | 'submitted' | 'credited';
}

export type OrderStatus = 'Review needed' | 'Quoted' | 'Ready for pickup' | 'Completed' | 'Cancelled';

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  itemsSummary: string;
  status: OrderStatus;
  time: string;
  date: string;
  amount: number;
  prescriptionUrl?: string;
  prescriptionFileName?: string;
  isVerified?: boolean;
  notes?: string;
}

export interface CreditTransaction {
  id: number;
  customerId: number;
  customerName: string;
  amount: number;
  type: 'debit' | 'payment';
  date: string;
  note: string;
  balanceAfter: number;
}

export interface MessageLog {
  id: number;
  phone: string;
  name: string;
  message: string;
  status: 'delivered' | 'simulated' | 'failed';
  triggerType: 'refill_reminder' | 'order_update' | 'payment_reminder' | 'custom';
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  address: string;
  licenseNumber: string;
  reminderDaysBefore: number;
  autoCronEnabled: boolean;
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
  reminderTemplate: string;
  readyTemplate: string;
}

export type SubscriptionPlanTier = 'Trial' | 'Monthly' | 'Annual VIP' | 'Enterprise';

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  storeId: string;
  storeName: string;
  plan: SubscriptionPlanTier;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  date: string;
  paymentMethod: 'UPI' | 'NetBanking' | 'Card' | 'Cash/Bank Transfer';
  transactionRef: string;
  status: 'Paid' | 'Pending';
}

export interface MedicalStore {
  id: string;
  name: string;
  tagline: string;
  ownerName: string;
  phone: string;
  address: string;
  city: string;
  licenseNumber: string;
  plan: SubscriptionPlanTier;
  status: 'Active' | 'Trial' | 'Expired';
  createdAt: string;
  subscriptionExpiresAt: string; // YYYY-MM-DD
  reminderDaysBefore: number;
  autoCronEnabled: boolean;
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
  reminderTemplate: string;
  readyTemplate: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'refill'
  | 'orders'
  | 'history'
  | 'customers'
  | 'expiry'
  | 'udhaar'
  | 'messages'
  | 'network'
  | 'subscription';
