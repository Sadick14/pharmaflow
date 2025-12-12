import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem } from '../types';
import { geminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  inventory: InventoryItem[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ inventory }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your AI Pharmacy Assistant. I can help you analyze your inventory, check drug interactions, or answer pharmaceutical questions.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const responseText = await geminiService.chatWithPharmacist(messages, input);

    const modelMessage: Message = { role: 'model', text: responseText };
    setMessages(prev => [...prev, modelMessage]);
    setIsLoading(false);
  };

  const handleAnalyzeInventory = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: "Analyze my current inventory status." }]);
    const analysis = await geminiService.analyzeInventory(inventory);
    setMessages(prev => [...prev, { role: 'model', text: analysis }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white md:rounded-tl-2xl shadow-inner overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-teal-600 to-teal-800 text-white shadow-md z-10">
        <h2 className="text-xl font-bold flex items-center">
          <i className="fas fa-robot mr-2"></i> PharmaGenius AI
        </h2>
        <p className="text-teal-100 text-sm">Powered by Gemini 2.5 Flash</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm md:text-base ${
                msg.role === 'user' 
                  ? 'bg-teal-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              {msg.role === 'model' ? (
                 <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:text-slate-800 prose-headings:text-sm prose-headings:font-bold prose-strong:text-teal-700">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                 </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-200">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
                onClick={handleAnalyzeInventory}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200 hover:bg-teal-100 transition-colors"
            >
                <i className="fas fa-chart-pie mr-1"></i> Analyze Inventory
            </button>
            <button 
                onClick={() => setInput("What are the side effects of Metformin?")}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200 hover:bg-teal-100 transition-colors"
            >
                <i className="fas fa-question-circle mr-1"></i> Drug Info
            </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Ask about inventory or drugs..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg px-4 py-2 transition-colors"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
