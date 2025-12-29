
import React, { useState } from 'react';
import { Profile } from '../types';
import Sidebar from '../components/Sidebar';
import AIServices from './AIServices';
import WebApps from './WebApps';
import Automations from './Automations';
import Billing from './Billing';
import AdminOverview from './AdminOverview';
import ProfileSettings from './ProfileSettings';
import ProjectHistory from './ProjectHistory';
import { Menu, X, Bell, User } from 'lucide-react';

interface DashboardProps {
  userProfile: Profile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen flex bg-[#f8fafc]">
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
