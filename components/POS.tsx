import React, { useState } from 'react';
import { InventoryItem } from '../types';

interface POSProps {
  inventory: InventoryItem[];
  onProcessSale: (items: { item: InventoryItem; quantity: number }[]) => Promise<void>;
}

interface CartItem {
  item: InventoryItem;
  quantity: number;
}

const POS: React.FC<POSProps> = ({ inventory, onProcessSale }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter inventory based on search
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (item: InventoryItem) => {
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      if (existing.quantity < item.quantity) {
        setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      } else {
        alert("Cannot add more than available stock.");
      }
    } else {
      if (item.quantity > 0) {
        setCart([...cart, { item, quantity: 1 }]);
      } else {
        alert("Item is out of stock.");
      }
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.item.id === itemId) {
        const newQty = c.quantity + delta;
        if (newQty > 0 && newQty <= c.item.quantity) {
          return { ...c, quantity: newQty };
        }
      }
      return c;
    }));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      await onProcessSale(cart);
      setCart([]);
      alert("Sale processed successfully!");
    } catch (error: any) {
      alert("Sale failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full flex-col md:flex-row bg-slate-100 overflow-hidden">
      {/* Left Panel: Product Catalog */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <header className="mb-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Product Catalog</h2>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Search by name or generic name..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {filteredInventory.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-block bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded font-medium">{item.category}</span>
                  <span className="font-bold text-slate-800">${item.price.toFixed(2)}</span>
                </div>
                <h3 className="font-bold text-slate-800 truncate" title={item.name}>{item.name}</h3>
                <p className="text-sm text-slate-500 mb-2 truncate" title={item.genericName}>{item.genericName}</p>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs font-medium ${item.quantity > item.minStockLevel ? 'text-green-600' : 'text-orange-600'}`}>
                   {item.quantity} {item.unit} available
                </span>
                <button
                  onClick={() => addToCart(item)}
                  disabled={item.quantity === 0}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>
          ))}
          {filteredInventory.length === 0 && (
            <div className="col-span-full text-center text-slate-400 py-10">
              No products found.
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Cart */}
      <div className="w-full md:w-96 bg-white shadow-xl flex flex-col h-[40vh] md:h-full border-t md:border-t-0 md:border-l border-slate-200 z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <i className="fas fa-shopping-cart mr-2 text-teal-600"></i> Current Sale
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <i className="fas fa-basket-shopping text-4xl mb-3 opacity-30"></i>
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((cartItem) => (
              <div key={cartItem.item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0 mr-2">
                  <h4 className="font-medium text-slate-800 truncate">{cartItem.item.name}</h4>
                  <p className="text-xs text-slate-500">${cartItem.item.price.toFixed(2)} / {cartItem.item.unit}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center bg-white rounded-md border border-slate-200">
                        <button onClick={() => updateQuantity(cartItem.item.id, -1)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-l">-</button>
                        <span className="px-2 text-sm font-medium w-8 text-center">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(cartItem.item.id, 1)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-r">+</button>
                    </div>
                    <div className="text-right min-w-[60px]">
                        <div className="font-bold text-slate-800">${(cartItem.item.price * cartItem.quantity).toFixed(2)}</div>
                    </div>
                    <button onClick={() => removeFromCart(cartItem.item.id)} className="text-red-400 hover:text-red-600">
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold text-slate-800">
            <span>Total</span>
            <span className="text-2xl text-teal-700">${cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center"
          >
            {isProcessing ? (
               <i className="fas fa-circle-notch fa-spin"></i>
            ) : (
               <>
                 <i className="fas fa-check-circle mr-2"></i> Complete Sale
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;