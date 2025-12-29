
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Profile, Project, Payment } from '../types';
import { 
  CreditCard, 
  Download, 
  QrCode, 
  Upload, 
  CheckCircle2, 
  Clock, 
  X, 
  FileText, 
  Printer, 
  ChevronRight,
  TrendingUp,
  Receipt,
  Loader2,
  ExternalLink,
  Info,
  Calendar,
  Building
} from 'lucide-react';

interface BillingProps {
  userProfile: Profile | null;
}

const Billing: React.FC<BillingProps> = ({ userProfile }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState<string[]>([]);
  
  // Print State
  const [printFilter, setPrintFilter] = useState<'all-pending' | string | null>(null);

  const isAdmin = userProfile?.role === 'admin';
  const qrCodeUrl = "https://wibenyzdzvpvwjpecmne.supabase.co/storage/v1/object/public/attachments/WhatsApp%20Image%202025-12-29%20at%203.57.20%20PM.jpeg";

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let projectQuery = supabase.from('projects')
      .select('*, profiles(email, brand_name, tagline, description)')
      .gt('bill_amount', 0)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      projectQuery = projectQuery.eq('customer_id', user?.id);
    }

    const { data: projectData } = await projectQuery;
    setProjects(projectData || []);

    let paymentQuery = supabase.from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      paymentQuery = paymentQuery.eq('customer_id', user?.id);
    }

    const { data: paymentData } = await paymentQuery;
    setPayments(paymentData || []);

    setLoading(false);
  };

  const handlePrint = (filter: 'all-pending' | string) => {
    setPrintFilter(filter);
    // Use a timeout to allow React to re-render the hidden print div with correct data
    setTimeout(() => {
      window.print();
      // Reset filter after a delay so it doesn't flicker while print dialog is open
      setTimeout(() => setPrintFilter(null), 2000);
    }, 500);
  };

  const handlePaymentProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || (!selectedProject && selectedForBulk.length === 0)) return;

    setUploading(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${Date.now()}-${cleanName}`;
      
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const proofUrl = data.path;
      const projectIds = selectedProject ? [selectedProject.id] : selectedForBulk;
      const amount = selectedProject 
        ? selectedProject.bill_amount 
        : projects.filter(p => selectedForBulk.includes(p.id)).reduce((sum, p) => sum + p.bill_amount, 0);

      const { error: paymentError } = await supabase.from('payments').insert({
        customer_id: userProfile?.id,
        project_ids: projectIds,
        amount: amount,
        proof_url: proofUrl,
        status: 'Pending Verification'
      });

      if (paymentError) throw paymentError;

      setShowPayModal(false);
      setSelectedProject(null);
      setSelectedForBulk([]);
      fetchData();
    } catch (err: any) {
      console.error('Payment upload error:', err);
      alert(`Payment verification failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyPayment = async (payment: Payment, verified: boolean) => {
    const status = verified ? 'Verified' : 'Rejected';
    const { error } = await supabase.from('payments').update({ status }).eq('id', payment.id);
    
    if (!error && verified) {
      await supabase.from('projects')
        .update({ status: 'Completed' })
        .in('id', payment.project_ids);
    }
    
    fetchData();
  };

  const totalPending = projects
    .filter(p => p.status !== 'Completed' && p.status !== 'Paid')
    .reduce((sum, p) => sum + p.bill_amount, 0);

  const toggleBulk = (id: string) => {
    setSelectedForBulk(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Determine which projects to show in the printable invoice
  const projectsToPrint = printFilter === 'all-pending' 
    ? projects.filter(p => p.status !== 'Completed' && p.status !== 'Paid')
    : projects.filter(p => p.id === printFilter);

  // Helper to render a single invoice page
  const renderInvoicePage = (project: Project, isBulk: boolean = false) => (
    <div key={project.id} className="invoice-page bg-white">
      {/* Invoice Header */}
      <div className="flex justify-between items-start border-b-8 border-slate-900 pb-10 mb-10">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-slate-900 text-white flex items-center justify-center font-black text-4xl rounded-3xl">N</div>
            <h1 className="text-5xl font-black uppercase tracking-tighter">Nexus Hub</h1>
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Secure Business Solutions</p>
          <div className="space-y-1">
             <p className="text-sm font-bold text-slate-800">Email: accounts@nexushub.ai</p>
             <p className="text-sm font-bold text-slate-800">Date Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-slate-900">Official Invoice</h2>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 inline-block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Identifier</p>
            <p className="font-mono font-black text-slate-900 text-2xl tracking-widest">#{project.project_number}</p>
          </div>
        </div>
      </div>

      {/* Bill To / Summary Row */}
      <div className="grid grid-cols-2 gap-20 mb-16">
        <div>
          <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-2">Client Details</h3>
          <p className="font-black text-3xl text-slate-900 mb-2">{project.profiles?.brand_name || 'Individual Client'}</p>
          <p className="text-slate-600 font-bold text-lg mb-2">{project.profiles?.email}</p>
          {project.profiles?.tagline && (
            <p className="text-sm text-slate-400 italic font-medium">"{project.profiles?.tagline}"</p>
          )}
        </div>
        <div className="text-right">
          <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-2">Financial Summary</h3>
          <div className="space-y-3">
            <p className="text-slate-400 font-black text-xs uppercase">Total Amount Due</p>
            <div className="text-7xl font-black text-slate-900 tracking-tighter">${project.bill_amount.toFixed(2)}</div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">Status: {project.status}</p>
          </div>
        </div>
      </div>

      {/* Itemization Table */}
      <div className="mb-16">
        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-6">Service Itemization</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b-4 border-slate-900">
              <th className="py-6 text-left text-[12px] font-black uppercase tracking-widest text-slate-900">Category</th>
              <th className="py-6 text-left text-[12px] font-black uppercase tracking-widest text-slate-900">Project Name</th>
              <th className="py-6 text-right text-[12px] font-black uppercase tracking-widest text-slate-900">Amount (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            <tr>
              <td className="py-8">
                 <span className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{project.category}</span>
              </td>
              <td className="py-8">
                <p className="font-black text-2xl text-slate-900 mb-1">{project.project_name || 'Custom Request'}</p>
                <p className="text-sm text-slate-500 font-medium">Original Submission Date: {new Date(project.created_at).toLocaleDateString()}</p>
              </td>
              <td className="py-8 text-right font-black text-3xl text-slate-900">${project.bill_amount.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-4 border-slate-900">
              <td colSpan={2} className="py-10 text-right text-[12px] font-black uppercase tracking-widest text-slate-900">Grand Total Amount Due</td>
              <td className="py-10 text-right font-black text-4xl text-slate-900">${project.bill_amount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Block */}
      <div className="bg-slate-50 rounded-[40px] p-12 flex items-center justify-between border-2 border-slate-100 shadow-sm">
        <div className="max-w-md">
          <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-widest mb-6">Payment Instructions</h4>
          <p className="text-sm text-slate-500 leading-relaxed font-bold mb-8">
            To finalize this project and release assets, please settle the outstanding balance. Scan the QR code to make your transfer, then upload the receipt in your Nexus Hub Dashboard.
          </p>
          <div className="flex gap-4">
            <div className="px-6 py-3 bg-white rounded-2xl border-2 border-slate-200 text-[11px] font-black text-slate-900 tracking-[0.2em] uppercase">Transfer Required</div>
          </div>
        </div>
        <div className="text-center">
          <div className="p-4 bg-white rounded-[32px] shadow-2xl border-2 border-slate-100 mb-4">
            <img src={qrCodeUrl} alt="Payment QR" className="w-40 h-40 object-cover rounded-2xl" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Scan for Secure Payment</p>
        </div>
      </div>

      <div className="mt-20 text-center border-t border-slate-100 pt-10">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Nexus AI Digital Hub • No: {project.project_number}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 
          OFFICIAL INVOICE TEMPLATE (Hidden in UI, Visible on Print)
      */}
      <div className="print-only">
        {printFilter === 'all-pending' ? (
          projectsToPrint.map(p => renderInvoicePage(p, true))
        ) : (
          projectsToPrint.length > 0 && renderInvoicePage(projectsToPrint[0], false)
        )}
      </div>

      {/* 
          DASHBOARD UI 
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <CreditCard className="w-32 h-32" />
          </div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-blue-500 rounded-2xl shadow-inner"><CreditCard className="w-6 h-6" /></div>
            <TrendingUp className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-blue-100 text-xs font-black uppercase tracking-widest">Total Pending Amount</p>
          <h3 className="text-4xl font-black mt-2 tracking-tighter">${totalPending.toFixed(2)}</h3>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-600"><Receipt className="w-6 h-6" /></div>
            <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Unsettled Projects</p>
          <h3 className="text-4xl font-black mt-2 text-slate-900 tracking-tighter">
            {projects.filter(p => p.status !== 'Completed' && p.status !== 'Paid').length}
          </h3>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-center shadow-xl hover:bg-slate-800 transition-all cursor-pointer active:scale-95 no-print" onClick={() => handlePrint('all-pending')}>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-2xl"><Printer className="w-8 h-8" /></div>
            <div>
              <p className="font-black uppercase text-xs tracking-widest opacity-70">Bulk Export</p>
              <h4 className="text-xl font-black">Print All Pending Bills</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Project Invoices</h3>
            {!isAdmin && selectedForBulk.length > 0 && (
              <button 
                onClick={() => setShowPayModal(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl hover:bg-green-700 transition-all text-sm animate-in slide-in-from-right-4"
              >
                Pay Grouped ({selectedForBulk.length})
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
            ) : projects.length === 0 ? (
              <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-100">
                <Receipt className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">No Billing Records Available</p>
              </div>
            ) : projects.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-[32px] p-6 flex items-center justify-between group hover:shadow-xl hover:border-blue-100 transition-all">
                <div className="flex items-center gap-6">
                  {!isAdmin && p.status !== 'Completed' && (
                    <input 
                      type="checkbox" 
                      checked={selectedForBulk.includes(p.id)}
                      onChange={() => toggleBulk(p.id)}
                      className="w-6 h-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  )}
                  <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                    <FileText className="w-8 h-8 text-slate-300 group-hover:text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">#{p.project_number}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{p.category} • {p.profiles?.brand_name || 'Individual'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 leading-none">${p.bill_amount.toFixed(2)}</p>
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${p.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      title="Print Official Invoice"
                      onClick={() => handlePrint(p.id)}
                      className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    {!isAdmin && p.status !== 'Completed' && (
                      <button 
                        onClick={() => { setSelectedProject(p); setShowPayModal(true); }}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all hidden sm:block"
                      >
                        Settle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 no-print">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Payment Trail</h3>
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="bg-white p-10 rounded-[32px] text-center border-slate-100 border">
                <Clock className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Awaiting First Payment</p>
              </div>
            ) : payments.map(pay => (
              <div key={pay.id} className="bg-white p-6 rounded-[32px] border border-slate-200 space-y-4 shadow-sm group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{new Date(pay.created_at).toLocaleDateString()}</p>
                    <p className="text-2xl font-black text-slate-900">${pay.amount.toFixed(2)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    pay.status === 'Verified' ? 'bg-green-100 text-green-700' : 
                    pay.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {pay.status}
                  </span>
                </div>
                
                {isAdmin && pay.status === 'Pending Verification' && (
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleVerifyPayment(pay, true)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all"
                    >
                      Verify
                    </button>
                    <button 
                      onClick={() => handleVerifyPayment(pay, false)}
                      className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                )}
                
                {pay.proof_url && (
                  <a 
                    href={`${supabase.storage.from('payment-proofs').getPublicUrl(pay.proof_url).data.publicUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-[10px] text-blue-600 font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white bg-blue-50 p-3 rounded-2xl transition-all"
                  >
                    View Settlement Proof <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 no-print">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-400">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tight">Secure Settlement</h3>
              <button className="p-2 hover:bg-slate-50 rounded-full" onClick={() => { setShowPayModal(false); setSelectedProject(null); setSelectedForBulk([]); }}><X /></button>
            </div>
            <div className="p-10 text-center space-y-8">
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Total Balance to Pay</p>
                <div className="text-5xl font-black text-blue-600 tracking-tighter">
                  ${(selectedProject ? selectedProject.bill_amount : projects.filter(p => selectedForBulk.includes(p.id)).reduce((sum, p) => sum + p.bill_amount, 0)).toFixed(2)}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="p-6 bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-100 relative group transition-all hover:border-blue-200">
                  <img src={qrCodeUrl} alt="QR Code" className="w-56 h-56 object-cover rounded-3xl shadow-xl" />
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[36px] flex items-center justify-center">
                     <QrCode className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className={`block w-full cursor-pointer bg-slate-900 text-white py-5 rounded-[28px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-center gap-3">
                    {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Upload className="w-6 h-6" /> Upload Transaction Proof</>}
                  </div>
                  <input type="file" className="hidden" onChange={handlePaymentProofUpload} accept="image/*,.pdf" disabled={uploading} />
                </label>
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <Info className="w-3.5 h-3.5" />
                  <p className="text-[9px] uppercase font-black tracking-widest">Verification required for project delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
