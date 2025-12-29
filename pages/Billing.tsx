
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
  Check
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

  const isAdmin = userProfile?.role === 'admin';
  const qrCodeUrl = "https://wibenyzdzvpvwjpecmne.supabase.co/storage/v1/object/public/attachments/WhatsApp%20Image%202025-12-29%20at%203.57.20%20PM.jpeg";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let projectQuery = supabase.from('projects')
      .select('*, profiles(email, brand_name)')
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

  const handlePaymentProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || (!selectedProject && selectedForBulk.length === 0)) return;

    setUploading(true);
    try {
      const fileName = `proof-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (error) throw error;

      const projectIds = selectedProject ? [selectedProject.id] : selectedForBulk;
      const amount = selectedProject 
        ? selectedProject.bill_amount 
        : projects.filter(p => selectedForBulk.includes(p.id)).reduce((sum, p) => sum + p.bill_amount, 0);

      const { error: paymentError } = await supabase.from('payments').insert({
        customer_id: userProfile?.id,
        project_ids: projectIds,
        amount: amount,
        proof_url: data.path,
        status: 'Pending Verification'
      });

      if (paymentError) throw paymentError;

      setShowPayModal(false);
      setSelectedProject(null);
      setSelectedForBulk([]);
      fetchData();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}. Ensure 'payment-proofs' bucket exists in Supabase Storage.`);
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
    setSelectedForBulk(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp className="w-32 h-32" /></div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Total Outstanding</p>
          <h3 className="text-4xl font-black">${totalPending.toFixed(2)}</h3>
          <p className="text-xs text-slate-500 mt-4 uppercase font-bold tracking-tight">Active Invoices across projects</p>
        </div>
        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Pending Bills</p>
          <h3 className="text-4xl font-black text-slate-900">{projects.filter(p => p.status !== 'Completed').length}</h3>
          <p className="text-xs text-slate-500 mt-4 uppercase font-bold tracking-tight">Requires your attention</p>
        </div>
        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col justify-center gap-4">
          <button onClick={handlePrint} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">
            <Printer className="w-5 h-5" /> Print All Bills
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Project Invoices</h3>
            {!isAdmin && selectedForBulk.length > 0 && (
              <button onClick={() => setShowPayModal(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black shadow-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest">
                Bulk Pay ({selectedForBulk.length})
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Zero Billing History</p>
              </div>
            ) : projects.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-[32px] p-6 flex items-center justify-between group hover:shadow-xl transition-all">
                <div className="flex items-center gap-6">
                  {!isAdmin && p.status !== 'Completed' && p.status !== 'Paid' && (
                    <button 
                      onClick={() => toggleBulk(p.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedForBulk.includes(p.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 hover:border-blue-400'}`}
                    >
                      {selectedForBulk.includes(p.id) && <Check className="w-5 h-5" />}
                    </button>
                  )}
                  <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                    <FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">Project #{p.project_number}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {p.profiles?.brand_name || 'Personal'} • {p.category}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">${p.bill_amount}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'Completed' || p.status === 'Paid' ? 'text-green-600' : 'text-amber-600'}`}>
                      {p.status}
                    </span>
                  </div>
                  {!isAdmin && p.status !== 'Completed' && p.status !== 'Paid' && (
                    <button 
                      onClick={() => { setSelectedProject(p); setShowPayModal(true); }}
                      className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Payment Tracker</h3>
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="bg-white p-10 rounded-[40px] text-center border border-slate-100">
                <p className="text-slate-400 text-[10px] font-black uppercase">Archive Empty</p>
              </div>
            ) : payments.map(pay => (
              <div key={pay.id} className="bg-white p-6 rounded-[32px] border border-slate-200 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(pay.created_at).toLocaleDateString()}</p>
                    <p className="text-2xl font-black text-slate-900">${pay.amount}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    pay.status === 'Verified' ? 'bg-green-100 text-green-700' : 
                    pay.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {pay.status}
                  </span>
                </div>
                
                {isAdmin && pay.status === 'Pending Verification' && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleVerifyPayment(pay, true)} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-100">Verify</button>
                    <button onClick={() => handleVerifyPayment(pay, false)} className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Reject</button>
                  </div>
                )}
                
                {pay.proof_url && (
                  <a href={`${supabase.storage.from('payment-proofs').getPublicUrl(pay.proof_url).data.publicUrl}`} target="_blank" rel="noreferrer" className="flex items-center justify-between text-[10px] text-blue-600 font-black uppercase bg-blue-50 p-3 rounded-xl hover:bg-blue-100 transition-all">
                    Proof of Transfer <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-[48px] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tight">Secure Checkout</h3>
              <button onClick={() => { setShowPayModal(false); setSelectedProject(null); setSelectedForBulk([]); }} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X /></button>
            </div>
            <div className="p-10 text-center space-y-8">
              <div className="space-y-1">
                <p className="text-slate-500 font-medium">Total Payable Amount</p>
                <div className="text-5xl font-black text-slate-900">
                  ${selectedProject ? selectedProject.bill_amount : projects.filter(p => selectedForBulk.includes(p.id)).reduce((sum, p) => sum + p.bill_amount, 0)}
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="p-6 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                  <img src={qrCodeUrl} alt="Payment QR" className="w-56 h-56 object-cover rounded-2xl shadow-inner" />
                </div>
              </div>

              <div className="space-y-4">
                <label className={`block w-full cursor-pointer bg-blue-600 text-white py-5 rounded-2xl font-black shadow-2xl hover:bg-blue-700 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-center gap-3">
                    {uploading ? <Loader2 className="animate-spin" /> : <><Upload className="w-6 h-6" /> Upload Payment Proof</>}
                  </div>
                  <input type="file" className="hidden" onChange={handlePaymentProofUpload} accept="image/*,.pdf" disabled={uploading} />
                </label>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em]">Bank screenshots or transfer receipts accepted</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
