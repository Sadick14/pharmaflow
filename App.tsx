import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import POS from './components/POS';
import AIAssistant from './components/AIAssistant';
import Login from './components/Login';
import { ViewState, InventoryItem, Transaction, User } from './types';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Data Load
  useEffect(() => {
    const checkUser = () => {
        const storedUser = storageService.getCurrentUser();
        if (storedUser) {
            setUser(storedUser);
        }
    };
    checkUser();

    const loadData = async () => {
      try {
        const [invData, transData] = await Promise.all([
          storageService.getInventory(),
          storageService.getTransactions()
        ]);
        setInventory(invData);
        setTransactions(transData);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const refreshData = async () => {
    const [invData, transData] = await Promise.all([
      storageService.getInventory(),
      storageService.getTransactions()
    ]);
    setInventory(invData);
    setTransactions(transData);
  };

  const handleAddItem = async (item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    await storageService.saveInventoryItem(newItem);
    await refreshData();
  };

  const handleEditItem = async (item: InventoryItem) => {
    await storageService.saveInventoryItem(item);
    await refreshData();
  };

  const handleDeleteItem = async (id: string) => {
    await storageService.deleteInventoryItem(id);
    await refreshData();
  };

  const handleAdjustStock = async (id: string, qty: number, type: 'IN' | 'OUT') => {
    try {
        await storageService.processStockMovement(id, qty, type, 'Manual adjustment');
        await refreshData();
    } catch (e: any) {
        alert(e.message);
    }
  };

  const handleProcessSale = async (cartItems: { item: InventoryItem; quantity: number }[]) => {
      await storageService.processMultiItemSale(cartItems);
      await refreshData();
  };

  const handleLogin = (loggedInUser: User) => {
      setUser(loggedInUser);
      setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = async () => {
      await storageService.logout();
      setUser(null);
  };

  if (loading) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-teal-600">
            <i className="fas fa-circle-notch fa-spin text-4xl"></i>
        </div>
    );
  }

  if (!user) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 h-full overflow-hidden relative">
        {currentView === ViewState.DASHBOARD && (
          <Dashboard 
            inventory={inventory} 
            transactions={transactions} 
            onNavigate={setCurrentView}
            userRole={user.role}
          />
        )}
        
        {currentView === ViewState.POS && (
            <POS 
                inventory={inventory}
                onProcessSale={handleProcessSale}
            />
        )}
        
        {currentView === ViewState.INVENTORY && (
          <InventoryList 
            items={inventory}
            onAdd={handleAddItem}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onAdjustStock={handleAdjustStock}
            userRole={user.role}
          />
        )}

        {currentView === ViewState.AI_ASSISTANT && (
          <div className="h-full max-w-5xl mx-auto pt-4 md:pt-8 md:px-6">
              <AIAssistant inventory={inventory} />
          </div>
        )}

        {currentView === ViewState.TRANSACTIONS && (
             <div className="p-6 h-full overflow-y-auto">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">Transactions</h1>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Date</th>
                                <th className="p-4 font-semibold text-slate-600">Item</th>
                                <th className="p-4 font-semibold text-slate-600">Type</th>
                                <th className="p-4 font-semibold text-slate-600">Quantity</th>
                                <th className="p-4 font-semibold text-slate-600">Amount</th>
                                <th className="p-4 font-semibold text-slate-600">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id} className="border-b border-slate-100">
                                    <td className="p-4 text-slate-600 text-sm">{new Date(t.date).toLocaleString()}</td>
                                    <td className="p-4 font-medium text-slate-800">{t.itemName}</td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            t.type === 'IN' ? 'bg-green-100 text-green-700' : 
                                            t.type === 'SALE' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium">{t.quantity}</td>
                                    <td className="p-4 font-medium text-slate-600">
                                        {t.totalPrice ? `$${t.totalPrice.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">{t.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        )}
      </main>
    </div>
  );
};

export default App;