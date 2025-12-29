
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Project, Profile } from '../types';
import { 
  Briefcase, 
  Clock, 
  Users, 
  Search, 
  MessageSquare, 
  DollarSign, 
  Eye,
  CheckCircle,
  RotateCcw,
  UserPlus,
  UserMinus,
  Paperclip,
  Download,
  Upload,
  X,
  Loader2,
  History,
  ClipboardList,
  RefreshCw,
  User as UserIcon,
  Sparkles,
  FileText,
  Tag,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Layers,
  Building,
  Info,
  Archive,
  Mail,
  Phone
} from 'lucide-react';
import { AttachmentGrid } from './AIServices';
import { sendEmailNotification } from '../lib/notifications';

const AdminOverview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'users' | 'completed'>('projects');
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBrandProfile, setSelectedBrandProfile] = useState<Profile | null>(null);
  const [billAmount, setBillAmount] = useState<string>('');
  const [adminResponse, setAdminResponse] = useState('');
  const [tempAttachments, setTempAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: proj } = await supabase.from('projects').select('*, profiles(*)').order('created_at', { ascending: false });
    const { data: cust } = await supabase.from('profiles').select('*').order('email', { ascending: true });
    setProjects(proj || []);
    setCustomers(cust || []);
    setLoading(false);
  };

  const handleFileUpload = async (files: File[]) => {
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const fileName = `solution-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data, error } = await supabase.storage.from('attachments').upload(fileName, file);
      if (!error && data) uploadedPaths.push(data.path);
    }
    return uploadedPaths;
  };

  const handleSubmitSolution = async () => {
    if (!selectedProject) return;
    setUploading(true);
    try {
      const solutionPaths = await handleFileUpload(tempAttachments);
      const existingAttachments = selectedProject.admin_attachments || [];
      const finalAttachments = [...existingAttachments, ...solutionPaths];
      
      const { error } = await supabase.from('projects').update({
        admin_response: adminResponse,
        bill_amount: parseFloat(billAmount) || 0,
        status: 'Customer Review',
        admin_attachments: finalAttachments,
        rework_feedback: null
      }).eq('id', selectedProject.id);

      if (error) throw error;

      // Notify Customer
      const customerEmail = selectedProject.profiles?.contact_email || selectedProject.profiles?.email;
      if (customerEmail) {
        await sendEmailNotification(
          customerEmail,
          `Order Update: Build Dispatch #${selectedProject.project_number}`,
          `Hello, your order for project #${selectedProject.project_number} has been finalized and dispatched by our experts.\n\nPlease log in to your Nexus Dashboard to review the deliverables and settle the invoice.\n\nExpert Comments: ${adminResponse}`
        );
      }

      setSelectedProject(null); setBillAmount(''); setAdminResponse(''); setTempAttachments([]); fetchData();
    } catch (err: any) { alert(err.message); } finally { setUploading(false); }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchData();
  };

  const filteredItems = () => {
    if (activeSubTab === 'users') {
      return customers.filter(c => 
        c.email.toLowerCase().includes(filter.toLowerCase()) || 
        c.brand_name?.toLowerCase().includes(filter.toLowerCase())
      );
    }
    
    const relevantProjects = projects.filter(p => {
      if (activeSubTab === 'projects') {
        return !['Completed', 'Paid'].includes(p.status);
      } else {
        return ['Completed', 'Paid'].includes(p.status);
      }
    });

    return relevantProjects.filter(p => 
      p.project_number.includes(filter) || 
      p.profiles?.brand_name?.toLowerCase().includes(filter.toLowerCase()) ||
      p.category.toLowerCase().includes(filter.toLowerCase()) ||
      p.profiles?.email.toLowerCase().includes(filter.toLowerCase())
    );
  };

  const items = filteredItems();

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Layers, label: 'Global Capacity', value: projects.length, color: 'blue' },
          { icon: Clock, label: 'Action Pipeline', value: projects.filter(p => ['Pending', 'In Progress', 'Rework Requested'].includes(p.status)).length, color: 'amber' },
          { icon: Users, label: 'Active Licenses', value: customers.length, color: 'indigo' },
          { icon: DollarSign, label: 'AUM Projection', value: `$${projects.reduce((sum, p) => sum + (p.bill_amount || 0), 0).toLocaleString()}`, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:translate-y-[-4px]">
            <div className={`flex items-center gap-3 text-${stat.color}-500 mb-4 font-black uppercase tracking-widest text-[9px]`}>
              <stat.icon className="w-4 h-4" /> {stat.label}
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap p-1 bg-slate-100/50 rounded-2xl w-fit gap-1">
        <button onClick={() => setActiveSubTab('projects')} className={`px-8 py-3 rounded-[0.9rem] font-black text-xs uppercase tracking-widest transition-all ${activeSubTab === 'projects' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Operations Feed</button>
        <button onClick={() => setActiveSubTab('completed')} className={`px-8 py-3 rounded-[0.9rem] font-black text-xs uppercase tracking-widest transition-all ${activeSubTab === 'completed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Archive Vault</button>
        <button onClick={() => setActiveSubTab('users')} className={`px-8 py-3 rounded-[0.9rem] font-black text-xs uppercase tracking-widest transition-all ${activeSubTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Identity MGMT</button>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {activeSubTab === 'projects' ? 'Active System Stream' : activeSubTab === 'completed' ? 'Settled Records' : 'Authorized Personnel'}
          </h3>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Filter current view..." className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm w-full md:w-80 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all font-medium" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeSubTab === 'projects' || activeSubTab === 'completed' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                <tr><th className="px-10 py-5">Reference ID</th><th className="px-10 py-5">Origin / Brand</th><th className="px-10 py-5">Process State</th><th className="px-10 py-5 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(items as Project[]).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-8 font-black text-slate-900 text-sm">#{p.project_number}</td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-bold text-slate-800 text-sm leading-none mb-1">{p.profiles?.brand_name || 'Individual'}</div>
                          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{p.profiles?.email}</div>
                        </div>
                        {p.profiles && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedBrandProfile(p.profiles || null); }}
                            className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                            title="View Brand Profile"
                          >
                            <Building className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        p.status === 'Rework Requested' ? 'bg-amber-100 text-amber-600 shadow-sm shadow-amber-50' : 
                        p.status === 'Customer Review' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' :
                        p.status === 'Completed' || p.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button onClick={() => { setSelectedProject(p); setBillAmount(p.bill_amount.toString()); setAdminResponse(p.admin_response || ''); }} className="bg-slate-900 text-white p-3.5 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 group-hover:scale-105 active:scale-95"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                <tr><th className="px-10 py-5">User Identity</th><th className="px-10 py-5">Access Level</th><th className="px-10 py-5 text-right">Privileges</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(items as Profile[]).map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-10 py-8">
                      <div className="font-black text-slate-900">{u.brand_name || u.email}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{u.email}</div>
                    </td>
                    <td className="px-10 py-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500'}`}>{u.role}</span></td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedBrandProfile(u)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Building className="w-4 h-4" /></button>
                        <button onClick={() => handleToggleRole(u.id, u.role)} className="text-[9px] font-black uppercase text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all tracking-widest">Update Permissions</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* BRAND PROFILE MODAL */}
      {selectedBrandProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] max-w-4xl w-full p-10 space-y-10 border border-white animate-in zoom-in-95 duration-400">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-3xl"><Building className="w-7 h-7" /></div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{selectedBrandProfile.brand_name || 'Unnamed Client'}</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-2">{selectedBrandProfile.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBrandProfile(null)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-all"><X className="w-7 h-7 text-slate-400" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="md:col-span-2 space-y-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <label className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1"><Mail className="w-3 h-3" /> Direct Contact</label>
                    <p className="text-sm font-bold text-slate-900">{selectedBrandProfile.contact_email || 'N/A'}</p>
                  </div>
                  <div className="space-y-2 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <label className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1"><Phone className="w-3 h-3" /> Secure Line</label>
                    <p className="text-sm font-bold text-slate-900">{selectedBrandProfile.phone_number || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tagline / Mission</label>
                  <p className="text-xl font-black text-slate-900 italic">"{selectedBrandProfile.tagline || 'No tagline defined'}"</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Brand Narrative</label>
                  <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">{selectedBrandProfile.description || 'No narrative provided.'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Brand Vault Assets</label>
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                   <AttachmentGrid paths={selectedBrandProfile.brand_assets} bucket="brand-assets" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN REVIEW MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-500">
          <div className="bg-white rounded-[4rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] max-w-7xl w-full my-8 animate-in slide-in-from-bottom-10 duration-500 overflow-hidden flex flex-col md:flex-row max-h-[95vh] border border-white">
            
            <div className="flex-1 p-12 space-y-10 overflow-y-auto bg-slate-50/30 border-r border-slate-50">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl"><ClipboardList className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Operational Scope</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Internal Case File #{selectedProject.project_number}</p>
                      <button 
                        onClick={() => setSelectedBrandProfile(selectedProject.profiles || null)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                      >
                        <Building className="w-3 h-3" /> View Client Brand
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-10">
                {selectedProject.status === 'Rework Requested' && selectedProject.rework_feedback && (
                  <div className="bg-amber-600 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-amber-100 animate-in slide-in-from-left duration-700">
                    <div className="flex items-center gap-3 mb-6">
                      <AlertTriangle className="w-7 h-7" />
                      <h4 className="text-xs font-black uppercase tracking-[0.3em]">Critical Change Protocol</h4>
                    </div>
                    <p className="bg-white/10 backdrop-blur-md p-8 rounded-[1.75rem] font-black text-xl border border-white/20 whitespace-pre-wrap leading-relaxed shadow-inner">
                      {selectedProject.rework_feedback}
                    </p>
                  </div>
                )}

                {selectedProject.admin_response && (
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3 mb-8 text-slate-300">
                      <History className="w-5 h-5" />
                      <h4 className="text-xs font-black uppercase tracking-0.2em">Previous Iteration Delivery</h4>
                    </div>
                    <div className="space-y-6">
                      <p className="text-slate-500 font-bold text-lg bg-slate-50/50 p-8 rounded-[1.75rem] border border-slate-50 italic">{selectedProject.admin_response}</p>
                      <AttachmentGrid paths={selectedProject.admin_attachments} />
                    </div>
                  </div>
                )}

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8 text-blue-600">
                    <FileText className="w-5 h-5" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Inbound Transmitted Brief</h4>
                  </div>
                  <p className="text-slate-900 font-black text-xl leading-relaxed mb-8 bg-slate-50/50 p-8 rounded-[1.75rem] border border-slate-50 whitespace-pre-wrap shadow-inner">{selectedProject.description}</p>
                  <AttachmentGrid paths={selectedProject.attachments} />
                </div>
              </div>
            </div>

            <div className="w-full md:w-[500px] p-12 bg-white flex flex-col space-y-10 relative overflow-y-auto shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10 pb-6 border-b border-slate-50">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Sparkles className="text-indigo-600" /> Dispatch
                </h3>
                <button onClick={() => setSelectedProject(null)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-all"><X className="w-7 h-7 text-slate-400" /></button>
              </div>

              <div className="space-y-8 flex-1">
                <div className="space-y-4">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Final Expert Response</label>
                  <textarea className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-8 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-slate-700 text-lg shadow-inner" rows={8} placeholder="Document the delivery parameters or rework resolution..." value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} />
                </div>

                <div className="space-y-4">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Master Artifact Upload</label>
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all group relative overflow-hidden">
                    <Upload className="w-10 h-10 text-slate-200 group-hover:text-blue-500 transition-colors mb-2" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Transmit Assets</p>
                    <input type="file" className="hidden" multiple onChange={(e) => setTempAttachments(Array.from(e.target.files || []))} />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tempAttachments.map((f, i) => (
                      <span key={i} className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl border border-blue-100 animate-in fade-in">{f.name}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-[2rem] border border-indigo-100 shadow-inner">
                  <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 ml-2">Invoiced Fee (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 text-indigo-300" />
                    <input type="number" className="w-full pl-16 pr-6 py-6 bg-white border border-indigo-100 rounded-[1.5rem] font-black text-3xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
                  </div>
                </div>
              </div>

              <button onClick={handleSubmitSolution} disabled={uploading} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-4 group uppercase tracking-[0.2em] disabled:opacity-50">
                {uploading ? <Loader2 className="animate-spin w-6 h-6" /> : <><CheckCircle className="w-7 h-7 transition-transform group-hover:scale-110" /> Finalize Dispatch</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
