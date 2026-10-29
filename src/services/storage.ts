import { Customer, StockItem, Order, CreditTransaction, DistributorReturn, MessageLog, StoreSettings, MedicalStore, SubscriptionInvoice, SubscriptionPlanTier } from '../types';
import { initialCustomers, initialStock, initialOrders, initialTransactions, defaultSettings, initialStores, initialInvoices } from '../data/seedData';
import { daysDifference, cleanPhone } from '../utils/formatters';

const STORAGE_KEYS = {
  STORES: 'refilldesk_stores_v1',
  ACTIVE_STORE_ID: 'refilldesk_active_store_id_v1',
  CUSTOMERS: 'refilldesk_customers_v1',
  STOCK: 'refilldesk_stock_v1',
  ORDERS: 'refilldesk_orders_v1',
  TRANSACTIONS: 'refilldesk_transactions_v1',
  RETURNS: 'refilldesk_returns_v1',
  LOGS: 'refilldesk_logs_v1',
  SETTINGS: 'refilldesk_settings_v1',
  INVOICES: 'refilldesk_invoices_v1',
  LAST_CRON_RUN: 'refilldesk_last_cron_run',
};

export class StorageService {
  static getStores(): MedicalStore[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STORES);
      return data ? JSON.parse(data) : initialStores;
    } catch {
      return initialStores;
    }
  }

  static saveStores(stores: MedicalStore[]) {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
  }

  static getActiveStoreId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_STORE_ID) || 'store_1';
  }

  static setActiveStoreId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_STORE_ID, id);
  }

  static addStore(newStore: MedicalStore): MedicalStore[] {
    const stores = this.getStores();
    const updated = [...stores, newStore];
    this.saveStores(updated);
    return updated;
  }

  static deleteStore(id: string): MedicalStore[] {
    const stores = this.getStores().filter(s => s.id !== id);
    this.saveStores(stores);
    if (this.getActiveStoreId() === id && stores.length > 0) {
      this.setActiveStoreId(stores[0].id);
    }
    return stores;
  }
  static getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (!data) return [];
      const parsed: unknown = JSON.parse(data);
      return Array.isArray(parsed) ? parsed as Customer[] : [];
    } catch {
      return [];
    }
  }

  static saveCustomers(customers: Customer[]) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  static getStock(): StockItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STOCK);
      if (!data) return [];
      const parsed: unknown = JSON.parse(data);
      return Array.isArray(parsed) ? parsed as StockItem[] : [];
    } catch {
      return [];
    }
  }

  static saveStock(stock: StockItem[]) {
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
  }

  static getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!data) return [];
      const parsed: unknown = JSON.parse(data);
      return Array.isArray(parsed) ? parsed as Order[] : [];
    } catch {
      return [];
    }
  }

  static saveOrders(orders: Order[]) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  static getTransactions(): CreditTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) return [];
      const parsed: unknown = JSON.parse(data);
      return Array.isArray(parsed) ? parsed as CreditTransaction[] : [];
    } catch {
      return [];
    }
  }

  static saveTransactions(transactions: CreditTransaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static getReturns(): DistributorReturn[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RETURNS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveReturns(returns: DistributorReturn[]) {
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
  }

  static getLogs(): MessageLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveLogs(logs: MessageLog[]) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  static addLog(log: Omit<MessageLog, 'id' | 'createdAt'>) {
    const logs = this.getLogs();
    const newLog: MessageLog = {
      ...log,
      id: Date.now() + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
    };
    const updated = [newLog, ...logs].slice(0, 200);
    this.saveLogs(updated);
    return newLog;
  }

  static getSettings(): StoreSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  static saveSettings(settings: StoreSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  /**
   * Run the 9:00 AM Cron Simulator for automatic WhatsApp reminders
   */
  static runDailyCronScan(): { count: number; recipients: string[] } {
    const customers = this.getCustomers();
    const settings = this.getSettings();
    const targetDays = settings.reminderDaysBefore || 3;
    const recipients: string[] = [];

    customers.forEach(customer => {
      const days = daysDifference(customer.refillDate);
      if (days === targetDays || days === 0) {
        recipients.push(customer.name);
        const text = settings.reminderTemplate
          .replace('{name}', customer.name)
          .replace('{store}', settings.storeName)
          .replace('{meds}', customer.meds)
          .replace('{refill_date}', customer.refillDate);

        this.addLog({
          phone: cleanPhone(customer.phone),
          name: customer.name,
          message: text,
          status: 'simulated', // No WhatsApp API request is made by this local scan.
          triggerType: 'refill_reminder',
        });
      }
    });

    localStorage.setItem(STORAGE_KEYS.LAST_CRON_RUN, new Date().toISOString());
    return { count: recipients.length, recipients };
  }

  static getInvoices(): SubscriptionInvoice[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (!data) return [];
      const parsed: unknown = JSON.parse(data);
      return Array.isArray(parsed) ? parsed as SubscriptionInvoice[] : [];
    } catch {
      return [];
    }
  }

  static saveInvoices(invoices: SubscriptionInvoice[]) {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }

  static activateSubscription(params: {
    storeId: string;
    plan: SubscriptionPlanTier;
    billingPeriod: 'Monthly' | 'Annual';
    paymentMethod: 'UPI' | 'NetBanking' | 'Card' | 'Cash/Bank Transfer';
    transactionRef: string;
  }): { updatedStore: MedicalStore; newInvoice: SubscriptionInvoice } {
    const stores = this.getStores();
    const store = stores.find(s => s.id === params.storeId);
    if (!store) {
      throw new Error(`Store ${params.storeId} not found`);
    }

    // Pricing calculation with 18% GST (CGST 9% + SGST 9%)
    let baseAmount = 0;
    let gstAmount = 0;
    let totalAmount = 0;
    let daysToAdd = 30;

    if (params.plan === 'Trial') {
      baseAmount = 0;
      gstAmount = 0;
      totalAmount = 0;
      daysToAdd = 14;
    } else if (params.plan === 'Monthly') {
      totalAmount = 999;
      baseAmount = Math.round(totalAmount / 1.18);
      gstAmount = totalAmount - baseAmount;
      daysToAdd = 30;
    } else if (params.plan === 'Annual VIP') {
      totalAmount = 9999;
      baseAmount = Math.round(totalAmount / 1.18);
      gstAmount = totalAmount - baseAmount;
      daysToAdd = 365;
    } else if (params.plan === 'Enterprise') {
      totalAmount = 24999;
      baseAmount = Math.round(totalAmount / 1.18);
      gstAmount = totalAmount - baseAmount;
      daysToAdd = 365;
    }

    // Compute new expiry date
    const currentExpiry = new Date(store.subscriptionExpiresAt || Date.now());
    const baseDate = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const newExpiresAt = baseDate.toISOString().slice(0, 10);

    // Update store
    const updatedStore: MedicalStore = {
      ...store,
      plan: params.plan,
      status: params.plan === 'Trial' ? 'Trial' : 'Active',
      subscriptionExpiresAt: newExpiresAt,
    };

    const updatedStores = stores.map(s => (s.id === store.id ? updatedStore : s));
    this.saveStores(updatedStores);

    // Generate Invoice
    const currentInvoices = this.getInvoices();
    const invoiceNum = `ADL-INV-2026-${String(currentInvoices.length + 101).padStart(3, '0')}`;
    const newInvoice: SubscriptionInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invoiceNum,
      storeId: store.id,
      storeName: store.name,
      plan: params.plan,
      amount: baseAmount,
      gstAmount: gstAmount,
      totalAmount: totalAmount,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: params.paymentMethod,
      transactionRef: params.transactionRef || `TXN-${Date.now().toString().slice(-8)}`,
      status: 'Paid',
    };

    this.saveInvoices([newInvoice, ...currentInvoices]);

    return { updatedStore, newInvoice };
  }

  static resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.STOCK);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.RETURNS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.LAST_CRON_RUN);
  }
}

