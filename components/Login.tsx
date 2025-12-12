import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await storageService.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                 <i className="fas fa-prescription-bottle-alt text-white text-3xl"></i>
            </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">PharmaFlow AI</h2>
        <p className="text-center text-slate-500 mb-8">Sign in to manage inventory</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              placeholder="Enter password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium transition-colors shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
             <p className="text-xs text-center text-slate-400">Demo Credentials:</p>
             <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500">
                 <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">admin / admin123</span>
                 <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">staff / staff123</span>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Login;