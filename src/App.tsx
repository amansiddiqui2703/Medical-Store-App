import React, { useState, useEffect } from 'react';
import { RefreshCw, CloudOff, Cloud } from 'lucide-react';
import {
  ActiveTab,
  Customer,
  StockItem,
  Order,
  OrderStatus,
  CreditTransaction,
  DistributorReturn,
  MessageLog,
  StoreSettings,
  MedicalStore,
  SubscriptionInvoice,
  SubscriptionPlanTier,
} from './types';
import { StorageService } from './services/storage';
import { getSyncConfig, saveSyncConfig, syncNow } from './services/sync';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { RefillDueView } from './components/RefillDueView';
import { OrdersView } from './components/OrdersView';
import { OrderHistoryView } from './components/OrderHistoryView';
import { CustomersView } from './components/CustomersView';
import { ExpiryView } from './components/ExpiryView';
import { UdhaarView } from './components/UdhaarView';
import { MessageLogsView } from './components/MessageLogsView';
import { StoreNetworkView } from './components/StoreNetworkView';
import { SubscriptionView } from './components/SubscriptionView';
import { PrescriptionModal } from './components/PrescriptionModal';
import { NewOrderModal } from './components/NewOrderModal';
import { CustomerModal } from './components/CustomerModal';
import { NewStockModal } from './components/NewStockModal';
import { SettleUdhaarModal } from './components/SettleUdhaarModal';
import { BulkReminderModal } from './components/BulkReminderModal';
import { SettingsModal } from './components/SettingsModal';
import { AutomindzBrandingModal } from './components/AutomindzBrandingModal';
import { AddStoreModal } from './components/AddStoreModal';
import { SubscribeModal } from './components/SubscribeModal';
import { TaxInvoiceModal } from './components/TaxInvoiceModal';
import { BottomNav } from './components/BottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { daysDifference, cleanPhone, buildWhatsAppUrl, exportToCSV } from './utils/formatters';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core Data Stores
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [stock, setStock] = useState<StockItem[]>(() => StorageService.getStock());
  const [orders, setOrders] = useState<Order[]>(() => StorageService.getOrders());
  const [transactions, setTransactions] = useState<CreditTransaction[]>(() => StorageService.getTransactions());
  const [returns, setReturns] = useState<DistributorReturn[]>(() => StorageService.getReturns());
  const [logs, setLogs] = useState<MessageLog[]>(() => StorageService.getLogs());
  const [settings, setSettings] = useState<StoreSettings>(() => StorageService.getSettings());

  // Cron Simulation state
  const [isCronRunning, setIsCronRunning] = useState<boolean>(false);

  // Modals
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isNewStockOpen, setIsNewStockOpen] = useState(false);
  const [selectedPrescriptionOrder, setSelectedPrescriptionOrder] = useState<Order | null>(null);
  const [settleUdhaarCustomer, setSettleUdhaarCustomer] = useState<Customer | null>(null);
  const [settleUdhaarMode, setSettleUdhaarMode] = useState<'settle' | 'add'>('settle');
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState(false);
  const [targetBulkCustomers, setTargetBulkCustomers] = useState<Customer[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);

  // Multi-Store Client Network States
  const [stores, setStores] = useState<MedicalStore[]>(() => StorageService.getStores());
  const [activeStoreId, setActiveStoreId] = useState<string>(() => StorageService.getActiveStoreId());

  // Subscription and Invoices state
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>(() => StorageService.getInvoices());
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [subscribeModalPlan, setSubscribeModalPlan] = useState<SubscriptionPlanTier>('Annual VIP');
  const [subscribeModalStoreId, setSubscribeModalStoreId] = useState<string>('');
  const [selectedTaxInvoice, setSelectedTaxInvoice] = useState<SubscriptionInvoice | null>(null);

  // Mobile navigation drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Offline-first, private sync status. Data remains local when the server is unreachable.
  const [syncStatus, setSyncStatus] = useState('Not connected');
  const [isSyncing, setIsSyncing] = useState(false);

  const runSync = async () => {
    if (isSyncing) return;
    if (!getSyncConfig()) {
      const serverUrl = window.prompt('Enter your private sync server URL (HTTPS recommended, e.g. your Tailscale HTTPS URL):');
      if (!serverUrl) return;
      const token = window.prompt('Enter the SYNC_TOKEN configured on your Windows PC (at least 24 characters):');
      if (!token) return;
      try {
        saveSyncConfig(serverUrl, token);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Could not save sync configuration.');
        return;
      }
    }
    setIsSyncing(true);
    try {
      const result = await syncNow();
      setSyncStatus(result.message);
      if (result.status === 'conflict') {
        showToast('Sync conflict: nothing was overwritten. Export a backup before resolving.');
      } else if (result.status === 'synced') {
        showToast('Sync check complete.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const refreshFromLocalStorage = () => {
      setCustomers(StorageService.getCustomers());
      setStock(StorageService.getStock());
      setOrders(StorageService.getOrders());
      setTransactions(StorageService.getTransactions());
      setReturns(StorageService.getReturns());
      setLogs(StorageService.getLogs());
      setSettings(StorageService.getSettings());
      setStores(StorageService.getStores());
      setInvoices(StorageService.getInvoices());
      setActiveStoreId(StorageService.getActiveStoreId());
    };
    window.addEventListener('medical-store-sync-applied', refreshFromLocalStorage);
    return () => window.removeEventListener('medical-store-sync-applied', refreshFromLocalStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const attemptSync = async () => {
      if (!getSyncConfig() || document.visibilityState === 'hidden') return;
      const result = await syncNow();
      if (!cancelled) setSyncStatus(result.message);
    };
    const timer = window.setInterval(attemptSync, 30000);
    window.addEventListener('online', attemptSync);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('online', attemptSync);
    };
  }, []);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenSubscribeModal = (plan: SubscriptionPlanTier = 'Annual VIP', targetStoreId?: string) => {
    setSubscribeModalPlan(plan);
    setSubscribeModalStoreId(targetStoreId || activeStoreId);
    setIsSubscribeModalOpen(true);
  };

  const handleActivateSubscription = (params: {
    storeId: string;
    plan: SubscriptionPlanTier;
    billingPeriod: 'Monthly' | 'Annual';
    paymentMethod: 'UPI' | 'NetBanking' | 'Card' | 'Cash/Bank Transfer';
    transactionRef: string;
  }) => {
    try {
      const { updatedStore, newInvoice } = StorageService.activateSubscription(params);
      const updatedStores = stores.map(s => (s.id === updatedStore.id ? updatedStore : s));
      setStores(updatedStores);
      setInvoices([newInvoice, ...invoices]);
      setIsSubscribeModalOpen(false);

      showToast(
        `License for "${updatedStore.name}" updated to ${updatedStore.plan}! Valid till ${updatedStore.subscriptionExpiresAt}`
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to activate subscription');
    }
  };

  const handleSelectStore = (storeId: string) => {
    setActiveStoreId(storeId);
    StorageService.setActiveStoreId(storeId);
    const selected = stores.find(s => s.id === storeId);
    if (selected) {
      setSettings(prev => ({
        ...prev,
        storeName: selected.name,
        tagline: selected.tagline,
        ownerName: selected.ownerName,
        phone: selected.phone,
        address: selected.address,
        licenseNumber: selected.licenseNumber,
        reminderDaysBefore: selected.reminderDaysBefore,
        autoCronEnabled: selected.autoCronEnabled,
        reminderTemplate: selected.reminderTemplate,
        readyTemplate: selected.readyTemplate,
      }));
      showToast(`Switched workspace to "${selected.name}" (${selected.city})`);
    }
  };

  const handleAddStore = (
    newStoreData: Omit<MedicalStore, 'id' | 'createdAt'>,
    switchToNew: boolean
  ) => {
    const newStore: MedicalStore = {
      ...newStoreData,
      id: `store_${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const updated = [...stores, newStore];
    setStores(updated);
    StorageService.saveStores(updated);

    if (switchToNew) {
      handleSelectStore(newStore.id);
    }
    showToast(`Medical store "${newStore.name}" added to Automindz network!`);
  };

  const handleDeleteStore = (storeId: string) => {
    if (stores.length <= 1) {
      alert('You must keep at least one active medical store in the system.');
      return;
    }
    const storeToDelete = stores.find(s => s.id === storeId);
    if (window.confirm(`Remove "${storeToDelete?.name}" from your network?`)) {
      const remaining = stores.filter(s => s.id !== storeId);
      setStores(remaining);
      StorageService.saveStores(remaining);
      if (activeStoreId === storeId) {
        handleSelectStore(remaining[0].id);
      }
      showToast('Store removed from client network.');
    }
  };

  // Sync back to storage on updates
  useEffect(() => {
    StorageService.saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    StorageService.saveStock(stock);
  }, [stock]);

  useEffect(() => {
    StorageService.saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    StorageService.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    StorageService.saveReturns(returns);
  }, [returns]);

  useEffect(() => {
    StorageService.saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  // Counts for sidebar badges
  const dueThisWeekCount = customers.filter(c => {
    const d = daysDifference(c.refillDate);
    return d >= 0 && d <= 7;
  }).length;

  const ordersCount = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;
  const completedOrdersCount = orders.filter(o => o.status === 'Completed').length;
  const expiringCount = stock.filter(s => daysDifference(s.expiry) <= 60).length;
  const udhaarCount = customers.filter(c => (c.credit || 0) > 0).length;
  const returnIds = new Set(returns.map(r => r.stockId));

  // Cron Simulation Handler
  const handleTriggerCron = () => {
    setIsCronRunning(true);
    setTimeout(() => {
      const result = StorageService.runDailyCronScan();
      setLogs(StorageService.getLogs());
      setIsCronRunning(false);
      showToast(
        result.count > 0
          ? `Reminder scan found ${result.count} due customers. Messages were not sent; WhatsApp API integration is not configured.`
          : 'Reminder scan complete: no customers due today. No WhatsApp messages were sent.'
      );
    }, 900);
  };

  // Order Handlers
  const handleCreateOrder = (newOrderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'time'>) => {
    // Order completion is intentionally blocked until structured sale lines and
    // batch-wise stock deduction are implemented. Never create a completed sale
    // from a free-text prescription description.
    if (newOrderData.status === 'Completed') {
      showToast('Order completion is disabled until reliable billing and stock deduction are implemented.');
      return;
    }
    const nextId = Date.now();
    const orderNumber = `ORD-${String(nextId).slice(-4)}`;
    const now = new Date();
    const newOrder: Order = {
      ...newOrderData,
      id: nextId,
      orderNumber,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setOrders(prev => [newOrder, ...prev]);
    showToast(`Order #${orderNumber} registered successfully!`);

    // Log message if quote or review
    const logText = `Prescription order #${orderNumber} received for ${newOrder.customerName}. Status: ${newOrder.status}`;
    const log = StorageService.addLog({
      phone: cleanPhone(newOrder.phone),
      name: newOrder.customerName,
      message: logText,
      status: 'simulated',
      triggerType: 'order_update',
    });
    setLogs(prev => [log, ...prev]);
  };

  const handleUpdateOrderStatus = (orderId: number, newStatus: OrderStatus) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;
    // Do not mark an order as sold/fulfilled while it has no structured bill lines
    // and the app cannot atomically deduct the correct stock batches.
    if (newStatus === 'Completed') {
      showToast('Completion is temporarily disabled until billing and batch-wise stock deduction are ready.');
      return;
    }
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
    showToast('Order status updated to ' + newStatus);
  };

  const handleUpdateOrderAmount = (orderId: number, amount: number) => {
    // Guard persisted values as well as the input control: never store NaN, Infinity,
    // or a negative amount that could corrupt totals/reports.
    if (!Number.isFinite(amount) || amount < 0) {
      showToast('Bill amount must be a valid number greater than or equal to ₹0.');
      return;
    }
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, amount: Math.round(amount * 100) / 100 } : o))
    );
  };

  const handleDeleteOrder = (orderId: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      showToast('Order removed from queue.');
    }
  };

  const handleVerifyPrescription = (orderId: number, isVerified: boolean) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, isVerified } : o))
    );
    if (selectedPrescriptionOrder && selectedPrescriptionOrder.id === orderId) {
      setSelectedPrescriptionOrder(prev => (prev ? { ...prev, isVerified } : null));
    }
    showToast(isVerified ? 'Prescription verified by pharmacist.' : 'Verification unflagged.');
  };

  // Customer Handlers
  const handleSaveCustomer = (
    customerData: Omit<Customer, 'id' | 'lastVisit'>,
    editId?: number
  ) => {
    if (editId) {
      setCustomers(prev =>
        prev.map(c =>
          c.id === editId
            ? { ...c, ...customerData }
            : c
        )
      );
      showToast('Patient card updated.');
    } else {
      const newCust: Customer = {
        ...customerData,
        id: Date.now(),
        lastVisit: new Date().toISOString().slice(0, 10),
      };
      setCustomers([newCust, ...customers]);
      showToast('New patient card created.');
    }
  };

  const handleDeleteCustomer = (id: number) => {
    if (window.confirm('Delete this patient card?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast('Patient card deleted.');
    }
  };

  // Stock & Return Handlers
  const handleSaveStock = (stockData: Omit<StockItem, 'id'>) => {
    const newStock: StockItem = {
      ...stockData,
      id: Date.now(),
    };
    setStock([newStock, ...stock]);
    showToast(`Batch ${newStock.batch} added to inventory.`);
  };

  const handleDeleteStock = (id: number) => {
    if (window.confirm('Remove this batch from stock?')) {
      setStock(prev => prev.filter(s => s.id !== id));
      showToast('Batch removed.');
    }
  };

  const handleAddToReturns = (item: StockItem) => {
    if (returnIds.has(item.id)) return;

    const newReturn: DistributorReturn = {
      id: Date.now(),
      stockId: item.id,
      name: item.name,
      batch: item.batch,
      supplier: item.supplier,
      qty: item.qty,
      cost: item.cost,
      expiry: item.expiry,
      reason: 'Near Expiry Return for Credit Note',
      addedAt: new Date().toISOString(),
      status: 'pending',
    };

    setReturns([newReturn, ...returns]);
    showToast(`Added ${item.name} (Batch ${item.batch}) to return claims.`);
  };

  const handleRemoveReturn = (id: number) => {
    setReturns(prev => prev.filter(r => r.id !== id));
    showToast('Item removed from return claim.');
  };

  const handleSubmitReturns = (supplier: string) => {
    setReturns(prev =>
      prev.map(r => (r.supplier === supplier ? { ...r, status: 'submitted' } : r))
    );
    showToast(`Return claim sheet submitted to ${supplier}.`);
  };

  // Udhaar Settle / Add Credit Handlers
  const handleSettleOrAddCredit = (
    customerId: number,
    amount: number,
    note: string,
    type: 'payment' | 'debit'
  ) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Enter a payment/debit amount greater than ₹0.');
      return;
    }

    const currentBal = Math.max(0, cust.credit || 0);
    // Do not record a larger payment than the outstanding balance as if it were fully applied.
    const recordedAmount = type === 'payment' ? Math.min(amount, currentBal) : amount;
    if (type === 'payment' && recordedAmount <= 0) {
      showToast('This customer has no outstanding udhaar balance.');
      return;
    }
    const newBalance = type === 'payment' ? currentBal - recordedAmount : currentBal + recordedAmount;

    // Update customer credit balance
    setCustomers(prev =>
      prev.map(c => (c.id === customerId ? { ...c, credit: newBalance } : c))
    );

    // Create transaction entry using the amount actually applied to the balance.
    const newTx: CreditTransaction = {
      id: Date.now(),
      customerId,
      customerName: cust.name,
      amount: recordedAmount,
      type,
      date: new Date().toISOString().slice(0, 10),
      note: type === 'payment' && recordedAmount < amount
        ? `${note} (₹${amount - recordedAmount} not applied: balance was lower)`.trim()
        : note,
      balanceAfter: newBalance,
    };
    setTransactions(prev => [newTx, ...prev]);

    showToast(
      type === 'payment'
        ? `Payment of ₹${recordedAmount} applied for ${cust.name}.`
        : `Debit of ₹${amount} added for ${cust.name}.`
    );
  };

  // Bulk WhatsApp Dispatch
  const handleConfirmBulkDispatch = (selected: Customer[]) => {
    const newLogs: MessageLog[] = [];
    selected.forEach(c => {
      const text = settings.reminderTemplate
        .replace('{name}', c.name)
        .replace('{store}', settings.storeName)
        .replace('{meds}', c.meds)
        .replace('{refill_date}', c.refillDate);

      const log = StorageService.addLog({
        phone: cleanPhone(c.phone),
        name: c.name,
        message: text,
        status: 'simulated',
        triggerType: 'refill_reminder',
      });
      newLogs.push(log);
    });

    setLogs([...newLogs, ...logs]);
    showToast(`Prepared ${selected.length} WhatsApp reminder log(s). No messages were sent automatically.`);
  };

  // Direct custom WhatsApp send
  const handleSendDirectMessage = (phone: string, name: string, message: string) => {
    const log = StorageService.addLog({
      phone: cleanPhone(phone),
      name,
      message,
      status: 'simulated',
      triggerType: 'custom',
    });
    setLogs([log, ...logs]);
    showToast(`Message draft logged for ${name}. No message was sent automatically.`);
  };

  // Data Export / Import / Reset. Backups include every locally stored business record.
  const handleExportAllJSON = () => {
    const backup = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      store: settings,
      stores,
      activeStoreId,
      customers,
      stock,
      orders,
      transactions,
      returns,
      logs,
      invoices,
      madeBy: 'M.S. Medical Store',
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ms-medical-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Backup downloaded. Keep a second copy outside this device.');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Backup is too large (maximum 20 MB).');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed: unknown = JSON.parse(String(ev.target?.result || ''));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Backup must be a JSON object.');
        const data = parsed as Record<string, unknown>;
        const arrayKeys = ['customers', 'stock', 'orders', 'transactions', 'returns', 'logs', 'stores', 'invoices'] as const;
        for (const key of arrayKeys) {
          if (data[key] !== undefined && !Array.isArray(data[key])) {
            throw new Error(`Invalid backup: "${key}" must be a list.`);
          }
        }
        if (!Array.isArray(data.customers) || !Array.isArray(data.stock) || !Array.isArray(data.orders)) {
          throw new Error('This backup is missing required customers, stock or orders lists.');
        }
        if (!window.confirm('Restore this backup? Current local records will be replaced. Export a backup of current data first.')) return;

        setCustomers(data.customers as Customer[]);
        setStock(data.stock as StockItem[]);
        setOrders(data.orders as Order[]);
        setTransactions(Array.isArray(data.transactions) ? data.transactions as CreditTransaction[] : []);
        setReturns(Array.isArray(data.returns) ? data.returns as DistributorReturn[] : []);
        setLogs(Array.isArray(data.logs) ? data.logs as MessageLog[] : []);
        if (data.store && typeof data.store === 'object' && !Array.isArray(data.store)) setSettings({ ...StorageService.getSettings(), ...(data.store as Partial<StoreSettings>) });
        if (Array.isArray(data.stores) && data.stores.length) {
          setStores(data.stores as MedicalStore[]);
          StorageService.saveStores(data.stores as MedicalStore[]);
        }
        if (typeof data.activeStoreId === 'string') {
          setActiveStoreId(data.activeStoreId);
          StorageService.setActiveStoreId(data.activeStoreId);
        }
        setInvoices(Array.isArray(data.invoices) ? data.invoices as SubscriptionInvoice[] : []);
        showToast('Backup restored locally. Verify stock, balances and invoice totals before use.');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Invalid backup JSON file.');
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      alert('Could not read this backup file.');
      input.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Permanently clear all local store records on this device? Export a backup first. This cannot be undone.')) {
      StorageService.resetToDefaults();
      setCustomers(StorageService.getCustomers());
      setStock(StorageService.getStock());
      setOrders(StorageService.getOrders());
      setTransactions(StorageService.getTransactions());
      setReturns(StorageService.getReturns());
      setLogs(StorageService.getLogs());
      setSettings(StorageService.getSettings());
      setInvoices(StorageService.getInvoices());
      showToast('Local records cleared on this device.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
      {/* Top Navigation Bar with Multi-Store Switcher */}
      <Header
        settings={settings}
        stores={stores}
        activeStoreId={activeStoreId}
        onSelectStore={handleSelectStore}
        onOpenAddStore={() => setIsAddStoreOpen(true)}
        onNavigate={tab => setActiveTab(tab)}
        onOpenMenu={() => setIsMobileDrawerOpen(true)}
        onNewOrder={() => setIsNewOrderOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBranding={() => setIsBrandingOpen(true)}
        onTriggerCron={handleTriggerCron}
        isCronRunning={isCronRunning}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sidebar (Desktop) */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={tab => setActiveTab(tab)}
          dueCount={dueThisWeekCount}
          ordersCount={ordersCount}
          completedCount={completedOrdersCount}
          expiringCount={expiringCount}
          udhaarCount={udhaarCount}
          storesCount={stores.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-24 md:pb-8 overflow-x-hidden min-w-0">
          {activeTab === 'network' && (
            <StoreNetworkView
              stores={stores}
              activeStoreId={activeStoreId}
              onSelectStore={handleSelectStore}
              onOpenAddStore={() => setIsAddStoreOpen(true)}
              onDeleteStore={handleDeleteStore}
              onManageSubscription={storeId => handleOpenSubscribeModal('Annual VIP', storeId)}
            />
          )}
          {activeTab === 'dashboard' && (
            <DashboardView
              customers={customers}
              stock={stock}
              orders={orders}
              transactions={transactions}
              onNavigate={tab => setActiveTab(tab)}
              onOpenOrder={() => setIsNewOrderOpen(true)}
              onOpenNewCustomer={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              onViewPrescription={order => setSelectedPrescriptionOrder(order)}
              onAddToReturns={handleAddToReturns}
              returnIds={returnIds}
            />
          )}

          {activeTab === 'refill' && (
            <RefillDueView
              customers={customers}
              settings={settings}
              onOpenCustomerModal={customer => {
                setEditingCustomer(customer || null);
                setIsCustomerModalOpen(true);
              }}
              onTriggerCron={handleTriggerCron}
              isCronRunning={isCronRunning}
              onSendBulkReminders={targetCusts => {
                setTargetBulkCustomers(targetCusts);
                setIsBulkReminderOpen(true);
              }}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              settings={settings}
              onOpenNewOrder={() => setIsNewOrderOpen(true)}
              onViewPrescription={order => setSelectedPrescriptionOrder(order)}
              onUpdateStatus={handleUpdateOrderStatus}
              onUpdateAmount={handleUpdateOrderAmount}
              onDeleteOrder={handleDeleteOrder}
              onNavigateToHistory={() => setActiveTab('history')}
            />
          )}

          {activeTab === 'history' && (
            <OrderHistoryView
              orders={orders}
              settings={settings}
              onViewPrescription={order => setSelectedPrescriptionOrder(order)}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              settings={settings}
              onOpenCustomerModal={customer => {
                setEditingCustomer(customer || null);
                setIsCustomerModalOpen(true);
              }}
              onDeleteCustomer={handleDeleteCustomer}
              onOpenUdhaarSettle={cust => {
                setSettleUdhaarCustomer(cust);
                setSettleUdhaarMode('settle');
              }}
            />
          )}

          {activeTab === 'expiry' && (
            <ExpiryView
              stock={stock}
              returns={returns}
              settings={settings}
              onOpenNewStock={() => setIsNewStockOpen(true)}
              onAddToReturns={handleAddToReturns}
              onRemoveReturn={handleRemoveReturn}
              onSubmitReturns={handleSubmitReturns}
              onDeleteStock={handleDeleteStock}
            />
          )}

          {activeTab === 'udhaar' && (
            <UdhaarView
              customers={customers}
              transactions={transactions}
              settings={settings}
              onOpenSettleModal={cust => {
                setSettleUdhaarCustomer(cust);
                setSettleUdhaarMode('settle');
              }}
              onOpenAddCreditModal={cust => {
                setSettleUdhaarCustomer(cust);
                setSettleUdhaarMode('add');
              }}
            />
          )}

          {activeTab === 'messages' && (
            <MessageLogsView
              logs={logs}
              settings={settings}
              onSendDirect={handleSendDirectMessage}
            />
          )}

          {activeTab === 'subscription' && (
            <SubscriptionView
              stores={stores}
              activeStoreId={activeStoreId}
              invoices={invoices}
              customersCount={customers.length}
              onOpenSubscribeModal={(plan, storeId) => handleOpenSubscribeModal(plan, storeId)}
              onViewInvoice={inv => setSelectedTaxInvoice(inv)}
            />
          )}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <PrescriptionModal
        order={selectedPrescriptionOrder}
        onClose={() => setSelectedPrescriptionOrder(null)}
        onVerify={handleVerifyPrescription}
      />

      <NewOrderModal
        isOpen={isNewOrderOpen}
        customers={customers}
        onClose={() => setIsNewOrderOpen(false)}
        onSubmit={handleCreateOrder}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        customer={editingCustomer}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSaveCustomer}
      />

      <NewStockModal
        isOpen={isNewStockOpen}
        onClose={() => setIsNewStockOpen(false)}
        onSubmit={handleSaveStock}
      />

      <SettleUdhaarModal
        isOpen={!!settleUdhaarCustomer}
        customer={settleUdhaarCustomer}
        mode={settleUdhaarMode}
        settings={settings}
        onClose={() => setSettleUdhaarCustomer(null)}
        onSubmit={handleSettleOrAddCredit}
      />

      <BulkReminderModal
        isOpen={isBulkReminderOpen}
        targetCustomers={targetBulkCustomers}
        settings={settings}
        onClose={() => setIsBulkReminderOpen(false)}
        onConfirmDispatch={handleConfirmBulkDispatch}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={updated => {
          setSettings(updated);
          showToast('Settings saved successfully!');
        }}
        onResetData={handleResetData}
        onExportData={handleExportAllJSON}
        onImportData={handleImportJSON}
      />

      <AutomindzBrandingModal
        isOpen={isBrandingOpen}
        onClose={() => setIsBrandingOpen(false)}
      />

      <AddStoreModal
        isOpen={isAddStoreOpen}
        onClose={() => setIsAddStoreOpen(false)}
        onSubmit={handleAddStore}
      />

      <SubscribeModal
        isOpen={isSubscribeModalOpen}
        stores={stores}
        activeStoreId={subscribeModalStoreId || activeStoreId}
        initialSelectedPlan={subscribeModalPlan}
        onClose={() => setIsSubscribeModalOpen(false)}
        onSubmit={handleActivateSubscription}
      />

      <TaxInvoiceModal
        invoice={selectedTaxInvoice}
        store={stores.find(s => s.id === selectedTaxInvoice?.storeId)}
        onClose={() => setSelectedTaxInvoice(null)}
      />

      {/* Mobile Bottom Navigation Bar (iOS & Android) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        onOpenMenu={() => setIsMobileDrawerOpen(true)}
        dueCount={dueThisWeekCount}
        ordersCount={ordersCount}
        udhaarCount={udhaarCount}
      />

      {/* Mobile Slide-Over Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        stores={stores}
        activeStoreId={activeStoreId}
        onSelectStore={handleSelectStore}
        onOpenAddStore={() => setIsAddStoreOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBranding={() => setIsBrandingOpen(true)}
        onTriggerCron={handleTriggerCron}
        isCronRunning={isCronRunning}
        dueCount={dueThisWeekCount}
        ordersCount={ordersCount}
        completedCount={completedOrdersCount}
        expiringCount={expiringCount}
        udhaarCount={udhaarCount}
        storesCount={stores.length}
      />

      {/* Private sync control. The app continues working locally if the PC/server is off. */}
      <div className="fixed bottom-24 md:bottom-5 left-3 md:left-auto md:right-5 z-40 max-w-[min(92vw,360px)]">
        <button
          type="button"
          onClick={runSync}
          disabled={isSyncing}
          title="Sync with your private Windows server"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-lg disabled:opacity-60"
        >
          {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : getSyncConfig() ? <Cloud size={16} /> : <CloudOff size={16} />}
          {isSyncing ? 'Syncing…' : 'Private Sync'}
        </button>
        <p className="mt-1 rounded-lg bg-white/95 px-2 py-1 text-[10px] leading-4 text-slate-500 shadow">{syncStatus}</p>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-5 right-3 md:right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-800 transition-all animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
