import { Customer, StockItem, Order, CreditTransaction, DistributorReturn, MessageLog, StoreSettings, MedicalStore, SubscriptionInvoice, SubscriptionPlanTier } from '../types';
import { defaultSettings, initialStores } from '../data/seedData';
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

/**
 * Preserve malformed local data before falling back to an empty view. Without this,
 * a later React save effect could overwrite the only copy of corrupted records.
 * Recovery keys deliberately do not use the sync prefix.
 */
function preserveCorruptValue(key: string, raw: string | null): void {
  if (raw === null) return;
  try {
    const recoveryKey = `medical_store_recovery_${key}_${Date.now()}`;
    localStorage.setItem(recoveryKey, raw);
    console.error(`Invalid local data for ${key} was preserved as ${recoveryKey}. Export it before clearing browser data.`);
  } catch (error) {
    console.error(`Could not preserve invalid local data for ${key}:`, error);
  }
}

function readStoredArray<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    // Preserve raw value below before returning an empty view.
  }
  preserveCorruptValue(key, raw);
  return [];
}

export class StorageService {
  static getStores(): MedicalStore[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STORES);
    if (!raw) return initialStores;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as MedicalStore[];
    } catch {
      // Preserve raw value below before falling back to the default store profile.
    }
    preserveCorruptValue(STORAGE_KEYS.STORES, raw);
    return initialStores;
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
      return readStoredArray<Customer>(STORAGE_KEYS.CUSTOMERS);
    } catch (error) {
      console.error('Could not read local customers data:', error);
      return [];
    }
  }

  static saveCustomers(customers: Customer[]) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  static getStock(): StockItem[] {
    try {
      return readStoredArray<StockItem>(STORAGE_KEYS.STOCK);
    } catch (error) {
      console.error('Could not read local stock data:', error);
      return [];
    }
  }

  static saveStock(stock: StockItem[]) {
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
  }

  static getOrders(): Order[] {
    try {
      return readStoredArray<Order>(STORAGE_KEYS.ORDERS);
    } catch (error) {
      console.error('Could not read local orders data:', error);
      return [];
    }
  }

  static saveOrders(orders: Order[]) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  static getTransactions(): CreditTransaction[] {
    try {
      return readStoredArray<CreditTransaction>(STORAGE_KEYS.TRANSACTIONS);
    } catch (error) {
      console.error('Could not read local transactions data:', error);
      return [];
    }
  }

  static saveTransactions(transactions: CreditTransaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static getReturns(): DistributorReturn[] {
    try {
      return readStoredArray<DistributorReturn>(STORAGE_KEYS.RETURNS);
    } catch (error) {
      console.error('Could not read local returns data:', error);
      return [];
    }
  }

  static saveReturns(returns: DistributorReturn[]) {
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
  }

  static getLogs(): MessageLog[] {
    try {
      return readStoredArray<MessageLog>(STORAGE_KEYS.LOGS);
    } catch (error) {
      console.error('Could not read local logs data:', error);
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
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return defaultSettings;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...defaultSettings, ...parsed as Partial<StoreSettings> };
      }
    } catch {
      // Preserve raw value below before using defaults.
    }
    preserveCorruptValue(STORAGE_KEYS.SETTINGS, raw);
    return defaultSettings;
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
      return readStoredArray<SubscriptionInvoice>(STORAGE_KEYS.INVOICES);
    } catch (error) {
      console.error('Could not read local invoices data:', error);
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
    // Paid activation must wait for a verified server-side payment callback.
    if (params.plan !== 'Trial') {
      throw new Error('Paid subscription activation is disabled until a verified payment gateway is integrated.');
    }
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
      status: params.plan === 'Trial' ? 'Trial' : 'Paid',
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

