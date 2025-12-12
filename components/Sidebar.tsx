import React from 'react';
import { User, ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, user, onLogout }) => {
  const menuItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: 'fa-chart-line' },
    { id: ViewState.POS, label: 'Point of Sale', icon: 'fa-cash-register' },
    { id: ViewState.INVENTORY, label: 'Inventory', icon: 'fa-pills' },
    { id: ViewState.TRANSACTIONS, label: 'Transactions', icon: 'fa-exchange-alt' },
    { id: ViewState.AI_ASSISTANT, label: 'AI Assistant', icon: 'fa-robot' },
  ];

  return (
    <div className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen transition-all duration-300 shadow-xl z-20">
      <div className="p-6 flex items-center justify-center md:justify-start space-x-3 border-b border-slate-700">
        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shrink-0">
          <i className="fas fa-prescription-bottle-alt text-white"></i>
        </div>
        <span className="text-xl font-bold hidden md:block tracking-tight text-teal-100">PharmaFlow</span>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 group ${
              currentView === item.id
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} w-6 text-center text-lg ${currentView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-teal-400'}`}></i>
            <span className="ml-3 font-medium hidden md:block">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-3 overflow-hidden">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${user.role === 'ADMIN' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    <i className={`fas ${user.role === 'ADMIN' ? 'fa-user-shield' : 'fa-user'} text-white`}></i>
                </div>
                <div className="hidden md:block overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider text-[10px]">{user.role}</p>
                </div>
            </div>
            <button 
                onClick={onLogout}
                className="text-slate-500 hover:text-red-400 transition-colors p-2 hidden md:block"
                title="Logout"
            >
                <i className="fas fa-sign-out-alt"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;