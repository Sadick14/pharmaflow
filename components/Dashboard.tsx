import React, { useMemo } from 'react';
import { InventoryItem, Transaction, UserRole } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface DashboardProps {
  inventory: InventoryItem[];
  transactions: Transaction[];
  onNavigate: (view: any) => void;
  userRole: UserRole;
}

const COLORS = ['#14b8a6', '#f59e0b', '#ef4444', '#3b82f6'];

const Dashboard: React.FC<DashboardProps> = ({ inventory, transactions, onNavigate, userRole }) => {
  
  // Calculate Stats
  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalStock = inventory.reduce((acc, item) => acc + item.quantity, 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.minStockLevel);
    
    const today = new Date();
    const expiredItems = inventory.filter(item => new Date(item.expiryDate) < today);
    const expiringSoonItems = inventory.filter(item => {
        const expDate = new Date(item.expiryDate);
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 90;
    });
    
    const totalRevenue = transactions
        .filter(t => t.type === 'SALE')
        .reduce((acc, t) => acc + (t.totalPrice || 0), 0);

    return {
      totalItems,
      totalStock,
      lowStockCount: lowStockItems.length,
      expiredCount: expiredItems.length,
      expiringSoonCount: expiringSoonItems.length,
      totalRevenue,
      value: inventory.reduce((acc, item) => acc + (item.quantity * item.price), 0)
    };
  }, [inventory, transactions]);

  // Chart Data: Stock by Category
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    inventory.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + item.quantity;
    });
    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  }, [inventory]);

  // Chart Data: Recent Activity
  const activityData = useMemo(() => {
    // Group transactions by date (last 7 days mock)
    return transactions.slice(0, 7).map(t => ({
      name: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}),
      Amount: t.quantity,
      Revenue: t.type === 'SALE' ? (t.totalPrice || 0) : 0,
      Type: t.type
    })).reverse();
  }, [transactions]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-24">
      <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500">Overview of inventory status{userRole === 'ADMIN' ? ' and financials' : ''}.</p>
        </div>
        <button onClick={() => onNavigate('POS')} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors">
            <i className="fas fa-cash-register mr-2"></i> New Sale
        </button>
      </header>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${userRole === 'ADMIN' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        {/* Financials only for ADMIN */}
        {userRole === 'ADMIN' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-teal-600">${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center">
                        <i className="fas fa-coins"></i>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-red-300 transition-colors" onClick={() => onNavigate('INVENTORY')}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
                    <h3 className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-slate-800'}`}>{stats.lowStockCount}</h3>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.lowStockCount > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
            </div>
            {stats.lowStockCount > 0 && <p className="text-xs text-red-500 mt-2 font-medium">Action Needed</p>}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Expiring Soon (90d)</p>
                    <h3 className="text-2xl font-bold text-orange-500">{stats.expiringSoonCount}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                    <i className="fas fa-clock"></i>
                </div>
            </div>
        </div>

        {/* Stock Value only for ADMIN */}
        {userRole === 'ADMIN' ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Inventory Value</p>
                        <h3 className="text-2xl font-bold text-slate-800">${stats.value.toLocaleString()}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                        <i className="fas fa-warehouse"></i>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Items</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.totalItems}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                        <i className="fas fa-cubes"></i>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Inventory by Category</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Sales & Moves</h3>
             {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#64748b" />
                        <YAxis tick={{fontSize: 12}} stroke="#64748b" />
                        <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="Amount" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Quantity" />
                        {userRole === 'ADMIN' && (
                             <Bar dataKey="Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                        )}
                    </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                    No transactions yet.
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;