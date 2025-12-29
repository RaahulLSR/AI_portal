
import React, { useState, useEffect, useCallback } from 'react';
import { Profile } from '../types.ts';
import Sidebar from '../components/Sidebar.tsx';
import AIServices from './AIServices.tsx';
import WebApps from './WebApps.tsx';
import Automations from './Automations.tsx';
import Billing from './Billing.tsx';
import AdminOverview from './AdminOverview.tsx';
import ProfileSettings from './ProfileSettings.tsx';
import ProjectHistory from './ProjectHistory.tsx';
import { Menu, X, CheckCircle2, AlertCircle, Mail, Loader2 } from 'lucide-react';

interface DashboardProps {
  userProfile: Profile | null;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    const handleMailSent = (e: any) => {
      const recipient = e.detail.recipient;
      addToast('success', `Email dispatched to ${recipient}`);
    };

    const handleMailError = (e: any) => {
      addToast('error', `Mail system error: ${e.detail.error}`);
    };

    window.addEventListener('nexus-mail-sent' as any, handleMailSent);
    window.addEventListener('nexus-mail-error' as any, handleMailError);

    return () => {
      window.removeEventListener('nexus-mail-sent' as any, handleMailSent);
      window.removeEventListener('nexus-mail-error' as any, handleMailError);
    };
  }, [addToast]);

  const renderContent = () => {
    const role = userProfile?.role || 'customer';
    switch (activeTab) {
      case 'AI Services': return <AIServices role={role} />;
      case 'Websites & Apps': return <WebApps role={role} />;
      case 'Automations': return <Automations role={role} />;
      case 'Billing': return <Billing userProfile={userProfile} />;
      case 'Archive': return <ProjectHistory userProfile={userProfile} />;
      case 'Settings': return <ProfileSettings profile={userProfile} />;
      case 'Overview':
      default:
        return role === 'admin' ? <AdminOverview /> : <AIServices role="customer" />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] relative">
      {/* Global Toast Container */}
      <div className="fixed top-24 right-6 md:right-12 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-[1.25rem] shadow-2xl border animate-in slide-in-from-right-10 duration-300 ${
              toast.type === 'success' 
                ? 'bg-slate-900 border-slate-800 text-white' 
                : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            <div className={`p-2 rounded-lg ${toast.type === 'success' ? 'bg-blue-600' : 'bg-red-700'}`}>
              {toast.type === 'success' ? <Mail className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {toast.type === 'success' ? 'Nexus Communications' : 'System Alert'}
              </span>
              <p className="text-sm font-bold tracking-tight">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-4 opacity-40 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-72 h-screen sticky top-0 z-50 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={userProfile?.role || 'customer'} />
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-left duration-300">
          <div className="flex justify-end p-6">
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full">
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>
          <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }} role={userProfile?.role || 'customer'} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button className="md:hidden p-2 bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex flex-col">
              <h2 className="font-black text-xl text-slate-900 tracking-tight">{activeTab}</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Live</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <p className="text-sm font-black text-slate-900 leading-none mb-1">{userProfile?.email?.split('@')[0]}</p>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{userProfile?.role}</p>
            </div>
            <div className="relative group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center border-2 border-white shadow-lg shadow-blue-100 transform transition-transform group-hover:scale-105">
                <span className="text-white font-black uppercase text-sm">{userProfile?.email?.charAt(0)}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-12 max-w-[1600px] mx-auto page-enter">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
