import { Customer, StockItem, Order, CreditTransaction, StoreSettings, MedicalStore, SubscriptionInvoice } from '../types';

const today = new Date();
today.setHours(0, 0, 0, 0);
const addDays = (days: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const reminderTemplate = 'Namaste {name}, this is a reminder from {store}. Your refill ({meds}) is scheduled for {refill_date}. Please contact the store if you need assistance.';
const readyTemplate = 'Namaste {name}, your order #{order_id} is ready at {store}. Total: {amount}.';

export const defaultSettings: StoreSettings = {
  storeName: 'M.S. Medical Store',
  tagline: 'Your trusted local pharmacy',
  ownerName: '',
  phone: '',
  address: 'Una, Gujarat, India',
  licenseNumber: '',
  reminderDaysBefore: 3,
  autoCronEnabled: false,
  whatsappAccessToken: '',
  whatsappPhoneNumberId: '',
  reminderTemplate,
  readyTemplate,
};

export const initialStores: MedicalStore[] = [
  {
    id: 'store_1',
    name: 'M.S. Medical Store',
    tagline: 'Your trusted local pharmacy',
    ownerName: '',
    phone: '',
    address: 'Una, Gujarat, India',
    city: 'Una',
    licenseNumber: '',
    plan: 'Trial',
    status: 'Trial',
    createdAt: addDays(0),
    subscriptionExpiresAt: addDays(14),
    reminderDaysBefore: 3,
    autoCronEnabled: false,
    reminderTemplate,
    readyTemplate,
  },
];

// Never pre-populate real-world medical, customer, stock, order, or payment data with fake records.
export const initialInvoices: SubscriptionInvoice[] = [];
export const initialCustomers: Customer[] = [];
export const initialStock: StockItem[] = [];
export const initialOrders: Order[] = [];
export const initialTransactions: CreditTransaction[] = [];
