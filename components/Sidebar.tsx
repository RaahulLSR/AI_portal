
import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Globe, 
  Zap, 
  CreditCard, 
  Settings, 
  LogOut,
  ChevronRight,
  Archive,
  Menu
} from 'lucide-react';
import { supabase } from '../supabase';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role }) => {
  const primaryItems = [
    ...(role === 'admin' ? [{ id: 'Overview', icon: LayoutDashboard, label: 'Admin Hub' }] : []),
    { id: 'AI Services', icon: Sparkles, label: 'AI Design Lab' },
    { id: 'Websites & Apps', icon: Globe, label: 'Software Hub' },
    { id: 'Automations', icon: Zap, label: 'Flow Forge' },
  ];

  const secondaryItems = [
    { id: 'Billing', icon: CreditCard, label: 'Finances' },
    { id: 'Archive', icon: Archive, label: 'Vault' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-8 pb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center italic justify-center text-white font-black text-xl shadow-lg shadow-blue-200 transition-transform hover:scale-105">N</div>
        <div>
          <h1 className="text-xl font-black tracking-tight italic text-slate-900 leading-none">Nexus</h1>
          <span className="text-[10px] font-semibold italic tracking-[0.15em] text-slate-500 mt-1 block">
  Product of LSR
</span>


        </div>
      </div>

      <nav className="flex-1 px-4 space-y-8">
        <div>
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Development</p>
          <div className="space-y-1">
            {primaryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Account</p>
          <div className="space-y-1">
            {secondaryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mt-auto p-4 border-t border-slate-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span className="uppercase tracking-widest">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
