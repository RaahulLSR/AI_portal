
import React, { useState } from 'react';
import { Profile, ProjectCategory } from '../types';
import Sidebar from '../components/Sidebar';
import AIServices from './AIServices';
import WebApps from './WebApps';
import Automations from './Automations';
import Billing from './Billing';
import AdminOverview from './AdminOverview';
import ProfileSettings from './ProfileSettings';
import ProjectHistory from './ProjectHistory';
import { Menu, X } from 'lucide-react';

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
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-72 h-screen sticky top-0 border-r border-slate-200 bg-white no-print">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={userProfile?.role || 'customer'} />
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white no-print">
          <div className="flex justify-end p-4">
            <button onClick={() => setMobileMenuOpen(false)}><X className="w-8 h-8" /></button>
          </div>
          <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }} role={userProfile?.role || 'customer'} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-40 no-print">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-bold text-xl text-slate-800">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{userProfile?.email}</p>
              <p className="text-xs text-slate-500 capitalize">{userProfile?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-blue-700 font-bold uppercase">{userProfile?.email?.charAt(0)}</span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;