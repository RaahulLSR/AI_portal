
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
  Archive
} from 'lucide-react';
import { supabase } from '../supabase';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role }) => {
  const menuItems = [
    ...(role === 'admin' ? [{ id: 'Overview', icon: LayoutDashboard, label: 'Admin Overview' }] : []),
    { id: 'AI Services', icon: Sparkles, label: 'AI Services' },
    { id: 'Websites & Apps', icon: Globe, label: 'Websites & Apps' },
    { id: 'Automations', icon: Zap, label: 'Automations' },
    { id: 'Billing', icon: CreditCard, label: 'Billing' },
    { id: 'Archive', icon: Archive, label: 'Project Archive' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">N</div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Nexus Hub</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg font-semibold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
            <span className="flex-1 text-left">{item.label}</span>
            {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-semibold"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
