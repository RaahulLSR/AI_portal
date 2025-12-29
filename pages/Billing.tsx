
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
  Loader2
} from 'lucide-react';
import { sendEmailNotification } from '../lib/notifications';

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
  const qrCodeUrl = "https://ewgzwwumjimlrimiavld.supabase.co/storage/v1/object/public/payment-proofs/WhatsApp%20Image%202025-12-29%20at%203.57.20%20PM.jpeg";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth session expired.");

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

      // Notify Admin of Payment Proof
      await sendEmailNotification(
        'admin',
        `PAYMENT ALERT: Settlement Proof Uploaded ($${amount})`,
        `Customer ${user.email} has uploaded a proof of payment for the following projects: ${projectIds.map(id => projects.find(p => p.id === id)?.project_number).join(', ')}.\n\nTotal Amount: $${amount}\nStatus: Pending Verification`
      );

      setShowPayModal(false);
      setSelectedProject(null);
      setSelectedForBulk([]);
      fetchData();
    } catch (err: any) {
      console.error('Payment upload error:', err);
      alert(`Payment verification failed: ${err.message}.`);
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

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500 rounded-lg"><CreditCard className="w-6 h-6" /></div>
            <TrendingUp className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-blue-100 text-sm font-medium">Total Pending Amount</p>
          <h3 className="text-3xl font-bold mt-1">${totalPending.toFixed(2)}</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-lg"><Receipt className="w-6 h-6 text-slate-600" /></div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Pending Bills</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900">{projects.filter(p => p.status !== 'Completed').length}</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
          <button 
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
            onClick={() => window.print()}
          >
            <Printer className="w-5 h-5" />
            Print All Pending Bills
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Project Invoices</h3>
            {!isAdmin && selectedForBulk.length > 0 && (
              <button 
                onClick={() => setShowPayModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-green-700 transition-all text-sm"
              >
                Pay Bulk ({selectedForBulk.length})
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl text-center border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No Billing History</p>
              </div>
            ) : projects.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  {!isAdmin && p.status !== 'Completed' && (
                    <input 
                      type="checkbox" 
                      checked={selectedForBulk.includes(p.id)}
                      onChange={() => toggleBulk(p.id)}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600"
                    />
                  )}
                  <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                    <FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Project #{p.project_number}</h4>
                    <p className="text-xs text-slate-500">{p.profiles?.brand_name || 'Personal'} • {p.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">${p.bill_amount}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'Completed' ? 'text-green-600' : 'text-amber-600'}`}>
                      {p.status}
                    </span>
                  </div>
                  {!isAdmin && p.status !== 'Completed' && (
                    <button 
                      onClick={() => { setSelectedProject(p); setShowPayModal(true); }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition-all"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Payment Status</h3>
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl text-center border-slate-100 border">
                <p className="text-slate-400 text-[10px] font-black uppercase">No Recent Payments</p>
              </div>
            ) : payments.map(pay => (
              <div key={pay.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">{new Date(pay.created_at).toLocaleDateString()}</p>
                    <p className="text-lg font-bold text-slate-900">${pay.amount}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
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
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold shadow-md shadow-green-100"
                    >
                      Verify
                    </button>
                    <button 
                      onClick={() => handleVerifyPayment(pay, false)}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold"
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
                    className="flex items-center justify-between text-xs text-blue-600 font-bold hover:underline bg-blue-50 p-2 rounded-lg"
                  >
                    View Proof <Download className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Secure Payment</h3>
              <button onClick={() => { setShowPayModal(false); setSelectedProject(null); setSelectedForBulk([]); }}><X /></button>
            </div>
            <div className="p-8 text-center space-y-6">
              <p className="text-slate-600">Scan the QR code below and transfer the total amount:</p>
              <div className="text-3xl font-black text-blue-600">
                ${selectedProject ? selectedProject.bill_amount : projects.filter(p => selectedForBulk.includes(p.id)).reduce((sum, p) => sum + p.bill_amount, 0)}
              </div>
              <div className="flex justify-center">
                <div className="p-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 group transition-all hover:border-blue-400">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 object-cover rounded-xl" />
                </div>
              </div>
              <div className="space-y-4">
                <label className={`block w-full cursor-pointer bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-center gap-2">
                    {uploading ? <Loader2 className="animate-spin" /> : <><Upload className="w-5 h-5" /> Upload Payment Proof</>}
                  </div>
                  <input type="file" className="hidden" onChange={handlePaymentProofUpload} accept="image/*,.pdf" disabled={uploading} />
                </label>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Screenshots or PDFs are accepted. Verification within 24h.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
