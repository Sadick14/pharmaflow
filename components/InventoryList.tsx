import React, { useState, useMemo } from 'react';
import { InventoryItem, UserRole } from '../types';

interface InventoryListProps {
  items: InventoryItem[];
  onAdd: (item: Omit<InventoryItem, 'id'>) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (id: string, qty: number, type: 'IN' | 'OUT') => void;
  userRole: UserRole;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, onAdd, onEdit, onDelete, onAdjustStock, userRole }) => {
  // Original State
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Compute Unique Categories
  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category));
    return ['All', ...Array.from(cats).sort()];
  }, [items]);

  // Filter Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Search Term
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.genericName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Category
      if (filterCategory !== 'All' && item.category !== filterCategory) return false;

      // 3. Status Logic
      const today = new Date();
      today.setHours(0,0,0,0);
      const expDate = new Date(item.expiryDate);
      const isExpired = expDate < today;
      const isOutOfStock = item.quantity === 0;
      const isLowStock = item.quantity <= item.minStockLevel;

      if (filterStatus === 'Expired' && !isExpired) return false;
      
      // For stock statuses, we generally exclude expired items to avoid double counting, 
      // unless user specifically checks "Expired"
      if (filterStatus === 'Out of Stock' && (isExpired || !isOutOfStock)) return false; 
      if (filterStatus === 'Low Stock' && (isExpired || !isLowStock)) return false; 
      if (filterStatus === 'In Stock' && (isExpired || isLowStock)) return false;
      
      if (filterStatus === 'Expiring Soon') {
         const diffTime = expDate.getTime() - today.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         if (isExpired || diffDays > 90) return false;
      }

      // 4. Date Range
      if (dateRange.start && expDate < new Date(dateRange.start)) return false;
      if (dateRange.end && expDate > new Date(dateRange.end)) return false;

      return true;
    });
  }, [items, searchTerm, filterCategory, filterStatus, dateRange]);

  const clearFilters = () => {
    setFilterCategory('All');
    setFilterStatus('All');
    setDateRange({ start: '', end: '' });
    setSearchTerm('');
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (userRole === 'STAFF') return; // Double protection

    const formData = new FormData(e.currentTarget);
    const itemData: any = {
      name: formData.get('name') as string,
      genericName: formData.get('genericName') as string,
      category: formData.get('category') as string,
      quantity: Number(formData.get('quantity')),
      unit: formData.get('unit') as string,
      price: Number(formData.get('price')),
      expiryDate: formData.get('expiryDate') as string,
      minStockLevel: Number(formData.get('minStockLevel')),
      batchNumber: formData.get('batchNumber') as string,
      manufacturer: formData.get('manufacturer') as string,
    };

    if (editingItem) {
      onEdit({ ...editingItem, ...itemData });
    } else {
      onAdd(itemData);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setShowAddModal(true);
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Inventory</h1>
              <p className="text-slate-500">Manage your drug stock levels and details.</p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                title="Toggle Filters"
              >
                <i className="fas fa-filter"></i>
              </button>
              {userRole === 'ADMIN' && (
                <button 
                    onClick={openAdd}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm whitespace-nowrap"
                >
                    <i className="fas fa-plus md:mr-2"></i> <span className="hidden md:inline">Add Item</span>
                </button>
              )}
            </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                    <select 
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Stock Status</label>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                        <option value="All">All Statuses</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                        <option value="Expiring Soon">Expiring Soon (90d)</option>
                        <option value="Expired">Expired</option>
                    </select>
                </div>
                <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Expiry From</label>
                     <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                     />
                </div>
                <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Expiry To</label>
                     <div className="flex gap-2">
                         <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                         />
                         {(filterCategory !== 'All' || filterStatus !== 'All' || dateRange.start || dateRange.end) && (
                             <button 
                                onClick={clearFilters}
                                className="px-3 text-slate-400 hover:text-red-500 transition-colors border border-slate-200 rounded-lg hover:bg-red-50"
                                title="Clear All Filters"
                             >
                                <i className="fas fa-times"></i>
                             </button>
                         )}
                     </div>
                </div>
            </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="p-4 font-semibold text-slate-600 border-b border-slate-200">Name</th>
              <th className="p-4 font-semibold text-slate-600 border-b border-slate-200 hidden md:table-cell">Category</th>
              <th className="p-4 font-semibold text-slate-600 border-b border-slate-200">Stock</th>
              <th className="p-4 font-semibold text-slate-600 border-b border-slate-200 hidden sm:table-cell">Expiry</th>
              <th className="p-4 font-semibold text-slate-600 border-b border-slate-200 hidden lg:table-cell">Status</th>
              <th className="p-4 font-semibold text-slate-600 border-b border-slate-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
               const isLowStock = item.quantity <= item.minStockLevel;
               const isExpired = new Date(item.expiryDate) < new Date();
               
               return (
                <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.genericName}</div>
                  </td>
                  <td className="p-4 text-slate-600 hidden md:table-cell">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                            {item.quantity}
                        </span>
                        <span className="text-xs text-slate-400">{item.unit}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 hidden sm:table-cell text-sm">
                    {new Date(item.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    {isExpired ? (
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">Expired</span>
                    ) : isLowStock ? (
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Low Stock</span>
                    ) : (
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">In Stock</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button title="Restock" onClick={() => onAdjustStock(item.id, 1, 'IN')} className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors">
                             <i className="fas fa-arrow-up"></i>
                        </button>
                        <button title="Dispense" onClick={() => onAdjustStock(item.id, 1, 'OUT')} className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors">
                             <i className="fas fa-arrow-down"></i>
                        </button>
                        <button 
                            title={userRole === 'ADMIN' ? 'Edit' : 'View Details'} 
                            onClick={() => openEdit(item)} 
                            className={`p-2 rounded transition-colors ${userRole === 'ADMIN' ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            <i className={`fas ${userRole === 'ADMIN' ? 'fa-edit' : 'fa-eye'}`}></i>
                        </button>
                        {userRole === 'ADMIN' && (
                            <button title="Delete" onClick={() => { if(confirm('Are you sure?')) onDelete(item.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                                <i className="fas fa-trash"></i>
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
               );
            })}
            {filteredItems.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                        No items found matching your filters.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {editingItem ? (userRole === 'ADMIN' ? 'Edit Medication' : 'Medication Details') : 'Add New Medication'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset disabled={userRole === 'STAFF'} className="contents">
                  <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Commercial Name</label>
                      <input required name="name" defaultValue={editingItem?.name} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Generic Name</label>
                      <input required name="genericName" defaultValue={editingItem?.genericName} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                      <select name="category" defaultValue={editingItem?.category || 'General'} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500">
                          <option value="Antibiotics">Antibiotics</option>
                          <option value="Pain Relief">Pain Relief</option>
                          <option value="Cardiovascular">Cardiovascular</option>
                          <option value="Respiratory">Respiratory</option>
                          <option value="Diabetes">Diabetes</option>
                          <option value="General">General</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                      <input required type="number" min="0" name="quantity" defaultValue={editingItem?.quantity} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                      <input required name="unit" defaultValue={editingItem?.unit || 'tablets'} placeholder="e.g. tablets, ml" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock Level</label>
                      <input required type="number" min="0" name="minStockLevel" defaultValue={editingItem?.minStockLevel} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                      <input required type="number" step="0.01" min="0" name="price" defaultValue={editingItem?.price} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                      <input required type="date" name="expiryDate" defaultValue={editingItem?.expiryDate} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
                      <input required name="batchNumber" defaultValue={editingItem?.batchNumber} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                  </div>
                  <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                      <input required name="manufacturer" defaultValue={editingItem?.manufacturer} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                  </div>
              </fieldset>
              
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
                  {userRole === 'ADMIN' && (
                    <button type="submit" className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm font-medium">Save Item</button>
                  )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;