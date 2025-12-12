import { InventoryItem, Transaction, User } from '../types';

// Initial Mock Data to populate the app if empty
const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin',
    category: 'Antibiotics',
    quantity: 45,
    unit: 'capsules',
    price: 12.50,
    expiryDate: '2025-12-01',
    minStockLevel: 50,
    batchNumber: 'AMX-2023-001',
    manufacturer: 'PharmaCore'
  },
  {
    id: '2',
    name: 'Lipitor 20mg',
    genericName: 'Atorvastatin',
    category: 'Cardiovascular',
    quantity: 120,
    unit: 'tablets',
    price: 25.00,
    expiryDate: '2024-06-15',
    minStockLevel: 30,
    batchNumber: 'LPT-2023-089',
    manufacturer: 'Pfizer'
  },
  {
    id: '3',
    name: 'Panadol Extra',
    genericName: 'Paracetamol',
    category: 'Pain Relief',
    quantity: 500,
    unit: 'tablets',
    price: 5.50,
    expiryDate: '2026-01-20',
    minStockLevel: 100,
    batchNumber: 'PAN-2024-002',
    manufacturer: 'GSK'
  },
  {
    id: '4',
    name: 'Ventolin Inhaler',
    genericName: 'Salbutamol',
    category: 'Respiratory',
    quantity: 8,
    unit: 'units',
    price: 18.75,
    expiryDate: '2024-11-30',
    minStockLevel: 15,
    batchNumber: 'VEN-2023-555',
    manufacturer: 'GSK'
  },
  {
    id: '5',
    name: 'Metformin 500mg',
    genericName: 'Metformin',
    category: 'Diabetes',
    quantity: 200,
    unit: 'tablets',
    price: 8.00,
    expiryDate: '2024-02-01', // Expired/Expiring soon
    minStockLevel: 100,
    batchNumber: 'MET-2022-999',
    manufacturer: 'Sandoz'
  }
];

const STORAGE_KEYS = {
  INVENTORY: 'pharma_inventory_v1',
  TRANSACTIONS: 'pharma_transactions_v1',
  USER: 'pharma_user_session'
};

// Simulate Async API calls
export const storageService = {
  // Mock Auth
  login: async (username: string, password: string): Promise<User | null> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (username === 'admin' && password === 'admin123') {
                const user: User = { id: 'u1', username: 'admin', name: 'Dr. Smith', role: 'ADMIN' };
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
                resolve(user);
            } else if (username === 'staff' && password === 'staff123') {
                const user: User = { id: 'u2', username: 'staff', name: 'John Doe', role: 'STAFF' };
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
                resolve(user);
            } else {
                resolve(null);
            }
        }, 800);
    });
  },

  logout: async () => {
      localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getCurrentUser: (): User | null => {
      const u = localStorage.getItem(STORAGE_KEYS.USER);
      return u ? JSON.parse(u) : null;
  },

  getInventory: async (): Promise<InventoryItem[]> => {
    return new Promise((resolve) => {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (data) {
        resolve(JSON.parse(data));
      } else {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
        resolve(INITIAL_INVENTORY);
      }
    });
  },

  saveInventoryItem: async (item: InventoryItem): Promise<InventoryItem> => {
    const items = await storageService.getInventory();
    const existingIndex = items.findIndex(i => i.id === item.id);
    
    let newItems;
    if (existingIndex >= 0) {
      newItems = [...items];
      newItems[existingIndex] = item;
    } else {
      newItems = [...items, item];
    }
    
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(newItems));
    return item;
  },

  deleteInventoryItem: async (id: string): Promise<void> => {
    const items = await storageService.getInventory();
    const newItems = items.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(newItems));
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  addTransaction: async (transaction: Transaction): Promise<void> => {
    const transactions = await storageService.getTransactions();
    const newTransactions = [transaction, ...transactions];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTransactions));
  },
  
  // Helper to process stock movement
  processStockMovement: async (itemId: string, quantity: number, type: 'IN' | 'OUT' | 'SALE', notes: string = ''): Promise<void> => {
    const items = await storageService.getInventory();
    const itemIndex = items.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) throw new Error("Item not found");
    
    const item = items[itemIndex];
    let newQuantity = item.quantity;
    
    if (type === 'IN') {
      newQuantity += quantity;
    } else {
      if (item.quantity < quantity) throw new Error("Insufficient stock");
      newQuantity -= quantity;
    }
    
    const updatedItem = { ...item, quantity: newQuantity };
    await storageService.saveInventoryItem(updatedItem);
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      itemId: item.id,
      itemName: item.name,
      type,
      quantity,
      date: new Date().toISOString(),
      notes
    };
    
    await storageService.addTransaction(transaction);
  },

  // Process a batch of sales from the POS
  processMultiItemSale: async (cartItems: {item: InventoryItem, quantity: number}[]): Promise<void> => {
    const items = await storageService.getInventory();
    const now = new Date().toISOString();
    const newTransactions: Transaction[] = [];
    const updatedItems = [...items];

    // 1. Validation Phase
    for (const cartItem of cartItems) {
        const stockItem = updatedItems.find(i => i.id === cartItem.item.id);
        if (!stockItem) throw new Error(`Item ${cartItem.item.name} not found`);
        if (stockItem.quantity < cartItem.quantity) {
            throw new Error(`Insufficient stock for ${stockItem.name}. Available: ${stockItem.quantity}`);
        }
    }

    // 2. Execution Phase
    for (const cartItem of cartItems) {
        const index = updatedItems.findIndex(i => i.id === cartItem.item.id);
        const stockItem = updatedItems[index];
        
        // Update stock
        updatedItems[index] = {
            ...stockItem,
            quantity: stockItem.quantity - cartItem.quantity
        };

        // Create transaction
        newTransactions.push({
            id: Math.random().toString(36).substr(2, 9),
            itemId: stockItem.id,
            itemName: stockItem.name,
            type: 'SALE',
            quantity: cartItem.quantity,
            date: now,
            notes: 'Point of Sale Transaction',
            totalPrice: stockItem.price * cartItem.quantity
        });
    }

    // 3. Commit
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updatedItems));
    
    const existingTransactions = await storageService.getTransactions();
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([...newTransactions, ...existingTransactions]));
  }
};