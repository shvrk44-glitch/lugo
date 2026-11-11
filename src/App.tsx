import React, { useState, useEffect } from 'react';
import { UserRole, Account, Order, Invoice, Payment, StockMovement, Delivery, Alert, PnLEntry, Product } from './types';
import { MOCK_ACCOUNTS, MOCK_ORDERS, MOCK_INVOICES, MOCK_PAYMENTS, MOCK_PRODUCTS, MOCK_STOCK_MOVEMENTS, MOCK_DELIVERIES, MOCK_ALERTS, MOCK_PNL } from './fixtures/kanoMobilFixtures';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { AccountsView } from './components/AccountsView';
import { OrdersView } from './components/OrdersView';
import { PaymentsView } from './components/PaymentsView';
import { StockView } from './components/StockView';
import { DeliveriesView } from './components/DeliveriesView';
import { AlertsView } from './components/AlertsView';
import { ReportsView } from './components/ReportsView';
import { WifiOff, RefreshCw, Layers } from 'lucide-react';

export type ComponentStateMode = 'populated' | 'loading' | 'empty' | 'error';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [currentRole, setCurrentRole] = useState<UserRole>('CEO');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [syncQueueCount, setSyncQueueCount] = useState<number>(0);
  const [componentStateMode, setComponentStateMode] = useState<ComponentStateMode>('populated');

  // Persistent state with localStorage using MOCK FIXTURES
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('kano_mobil_accounts');
    return saved ? JSON.parse(saved) : MOCK_ACCOUNTS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('kano_mobil_products');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('kano_mobil_orders');
    return saved ? JSON.parse(saved) : MOCK_ORDERS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('kano_mobil_invoices');
    return saved ? JSON.parse(saved) : MOCK_INVOICES;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('kano_mobil_payments');
    return saved ? JSON.parse(saved) : MOCK_PAYMENTS;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('kano_mobil_stock_movements');
    return saved ? JSON.parse(saved) : MOCK_STOCK_MOVEMENTS;
  });

  const [deliveries, setDeliveries] = useState<Delivery[]>(() => {
    const saved = localStorage.getItem('kano_mobil_deliveries');
    return saved ? JSON.parse(saved) : MOCK_DELIVERIES;
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('kano_mobil_alerts');
    return saved ? JSON.parse(saved) : MOCK_ALERTS;
  });

  const [pnlData, setPnLData] = useState<PnLEntry[]>(() => {
    const saved = localStorage.getItem('kano_mobil_pnl');
    return saved ? JSON.parse(saved) : MOCK_PNL;
  });

  // Save to localStorage whenever state updates
  useEffect(() => {
    localStorage.setItem('kano_mobil_accounts', JSON.stringify(accounts));
    localStorage.setItem('kano_mobil_products', JSON.stringify(products));
    localStorage.setItem('kano_mobil_orders', JSON.stringify(orders));
    localStorage.setItem('kano_mobil_invoices', JSON.stringify(invoices));
    localStorage.setItem('kano_mobil_payments', JSON.stringify(payments));
    localStorage.setItem('kano_mobil_stock_movements', JSON.stringify(stockMovements));
    localStorage.setItem('kano_mobil_deliveries', JSON.stringify(deliveries));
    localStorage.setItem('kano_mobil_alerts', JSON.stringify(alerts));
    localStorage.setItem('kano_mobil_pnl', JSON.stringify(pnlData));
  }, [accounts, products, orders, invoices, payments, stockMovements, deliveries, alerts, pnlData]);

  useEffect(() => {
    if (isOffline) {
      setSyncQueueCount(prev => prev + 1);
    }
  }, [orders, payments, accounts]);

  const handleSyncNow = () => {
    setIsOffline(false);
    setSyncQueueCount(0);
    alert('All offline orders, payments, and accounts successfully synced to Kano depot server!');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        alerts={alerts}
      />

      {/* 4-State Component Testing Simulator Bar (Rule 2 requirement) */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-white">[MOCK FIXTURE] Component 4-State Testing:</span>
        </div>
        <div className="flex items-center space-x-1.5">
          {(['populated', 'loading', 'empty', 'error'] as ComponentStateMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setComponentStateMode(mode)}
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-colors cursor-pointer ${
                componentStateMode === mode
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Offline sync banner if offline */}
      {isOffline && (
        <div className="bg-amber-600 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center space-x-2 shadow-inner">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode Active. {syncQueueCount} action(s) queued for sync when signal returns.</span>
          <button
            onClick={handleSyncNow}
            className="ml-4 bg-slate-950 text-amber-300 px-3 py-1 rounded text-[11px] hover:bg-slate-900 inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Sync Now</span>
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'overview' && (
          <OverviewDashboard
            accounts={accounts}
            orders={orders}
            invoices={invoices}
            payments={payments}
            products={products}
            alerts={alerts}
            setCurrentTab={setCurrentTab}
            stateMode={componentStateMode}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            setAccounts={setAccounts}
            orders={orders}
            invoices={invoices}
            payments={payments}
            currentRole={currentRole}
            stateMode={componentStateMode}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersView
            orders={orders}
            setOrders={setOrders}
            accounts={accounts}
            products={products}
            invoices={invoices}
            setInvoices={setInvoices}
            currentRole={currentRole}
            stateMode={componentStateMode}
          />
        )}

        {currentTab === 'payments' && (
          <PaymentsView
            payments={payments}
            setPayments={setPayments}
            invoices={invoices}
            setInvoices={setInvoices}
            accounts={accounts}
            currentRole={currentRole}
            stateMode={componentStateMode}
          />
        )}

        {currentTab === 'stock' && (
          <StockView
            products={products}
            setProducts={setProducts}
            stockMovements={stockMovements}
            setStockMovements={setStockMovements}
            currentRole={currentRole}
            stateMode={componentStateMode}
          />
        )}

        {currentTab === 'deliveries' && (
          <DeliveriesView
            deliveries={deliveries}
            setDeliveries={setDeliveries}
            currentRole={currentRole}
            stateMode={componentStateMode}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            currentRole={currentRole}
            stateMode={componentStateMode}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            accounts={accounts}
            orders={orders}
            invoices={invoices}
            payments={payments}
            products={products}
            pnlData={pnlData}
            setPnLData={setPnLData}
            currentRole={currentRole}
            stateMode={componentStateMode}
          />
        )}
      </main>
    </div>
  );
}
