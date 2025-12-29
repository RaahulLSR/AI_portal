
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
  Shirt,
  Info
} from 'lucide-react';
import { AttachmentGrid } from './AIServices';

const AdminOverview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'users'>('projects');
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [billAmount, setBillAmount] = useState<string>('');
  const [adminResponse, setAdminResponse] = useState('');
  const [tempAttachments, setTempAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `solution-${Date.now()}-${cleanName}`;
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(fileName, file);
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
      
      setSelectedProject(null);
      setBillAmount('');
      setAdminResponse('');
      setTempAttachments([]);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) alert(error.message);
    else fetchData();
  };

  const filteredProjects = projects.filter(p => 
    p.project_number.includes(filter) || 
    p.profiles?.brand_name?.toLowerCase().includes(filter.toLowerCase()) ||
    p.category.toLowerCase().includes(filter.toLowerCase()) ||
    p.profiles?.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium"><Briefcase className="w-5 h-5" /> Total Projects</div>
          <div className="text-2xl font-black">{projects.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-amber-500 mb-2 font-medium"><Clock className="w-5 h-5" /> Pending Actions</div>
          <div className="text-2xl font-black">{projects.filter(p => ['Pending', 'In Progress', 'Rework Requested'].includes(p.status)).length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-blue-500 mb-2 font-medium"><Users className="w-5 h-5" /> Total Users</div>
          <div className="text-2xl font-black">{customers.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-green-600 mb-2 font-medium"><DollarSign className="w-5 h-5" /> Total Billed</div>
          <div className="text-2xl font-black">${projects.reduce((sum, p) => sum + (p.bill_amount || 0), 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
        <button onClick={() => setActiveSubTab('projects')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeSubTab === 'projects' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Project Feed</button>
        <button onClick={() => setActiveSubTab('users')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeSubTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>User Management</button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-black text-slate-900">{activeSubTab === 'projects' ? 'Global Orders' : 'System Users'}</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search orders..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full md:w-64 outline-none focus:ring-2 focus:ring-blue-500" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeSubTab === 'projects' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr><th className="px-8 py-4">Project ID</th><th className="px-8 py-4">Customer / Brand</th><th className="px-8 py-4">Status</th><th className="px-8 py-4 text-right">Review</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="px-8 py-6 font-black text-slate-900">#{p.project_number}</td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-800">{p.profiles?.brand_name || 'Personal'}</div>
                      <div className="text-xs text-slate-400">{p.profiles?.email}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.status === 'Rework Requested' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => { setSelectedProject(p); setBillAmount(p.bill_amount.toString()); setAdminResponse(p.admin_response || ''); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr><th className="px-8 py-4">User</th><th className="px-8 py-4">Role</th><th className="px-8 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-8 py-6"><div className="font-black text-slate-900">{u.email}</div></td>
                    <td className="px-8 py-6"><span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600">{u.role}</span></td>
                    <td className="px-8 py-6 text-right"><button onClick={() => handleToggleRole(u.id, u.role)} className="text-xs font-black uppercase text-blue-600 hover:underline">Toggle Role</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-7xl w-full my-8 animate-in slide-in-from-bottom-4 duration-400 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Left Side: PROJECT DETAILS */}
            <div className="flex-1 p-10 space-y-8 overflow-y-auto bg-slate-50/50 border-r border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl"><ClipboardList /></div>
                  Project Details
                </h3>
              </div>
              
              <div className="space-y-8">
                {/* Brand Identity Section */}
                <div className="bg-white p-6 rounded-[28px] border-2 border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-slate-400">
                    <UserIcon className="w-5 h-5" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Client Brand Context</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Brand Name</p>
                      <p className="font-black text-slate-900">{selectedProject.profiles?.brand_name || 'Individual'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Email</p>
                      <p className="font-black text-slate-900">{selectedProject.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Brand Assets Vault</p>
                    <AttachmentGrid paths={selectedProject.profiles?.brand_assets} bucket="brand-assets" />
                  </div>
                </div>

                {/* Garment Specifications (If AI Services) */}
                {selectedProject.category === 'AI Services' && (
                  <div className="bg-blue-600 text-white p-8 rounded-[32px] shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <Shirt className="w-6 h-6" />
                      <h4 className="text-sm font-black uppercase tracking-widest">Garment Specifications</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase opacity-70">Style Number</p>
                        <p className="font-black text-lg">{selectedProject.spec_style_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase opacity-70">Apparel Type</p>
                        <p className="font-black text-lg">{selectedProject.spec_apparel_type || 'Custom'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase opacity-70">Gender / Age</p>
                        <p className="font-black text-lg">{selectedProject.spec_gender} / {selectedProject.spec_age_group}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <p className="text-[10px] font-black uppercase opacity-70 mb-2">Requested Deliverables</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.wants_new_style && <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-bold">NEW STYLE</span>}
                        {selectedProject.wants_tag_creation && <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-bold">TAG/LABEL</span>}
                        {selectedProject.wants_color_variations && <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-bold">COLOR VARIANTS</span>}
                        {selectedProject.wants_style_variations && <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-bold">STYLE VARIANTS</span>}
                        {selectedProject.wants_marketing_poster && <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-bold">POSTER</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rework Instructions */}
                {selectedProject.status === 'Rework Requested' && selectedProject.rework_feedback && (
                  <div className="bg-orange-600 text-white p-8 rounded-[32px] shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-6 h-6" />
                      <h4 className="text-sm font-black uppercase tracking-widest">Rework Feedback</h4>
                    </div>
                    <p className="bg-white/10 p-6 rounded-2xl font-black text-lg border border-white/20 whitespace-pre-wrap">
                      {selectedProject.rework_feedback}
                    </p>
                  </div>
                )}

                {/* Client Brief */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 text-blue-600">
                    <FileText className="w-5 h-5" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Full Requirements</h4>
                  </div>
                  <p className="text-slate-700 font-bold leading-relaxed mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 whitespace-pre-wrap">{selectedProject.description}</p>
                  <AttachmentGrid paths={selectedProject.attachments} />
                </div>
              </div>
            </div>

            {/* Right Side: ADMIN ACTION */}
            <div className="w-full md:w-[450px] p-10 bg-white flex flex-col space-y-8 relative overflow-y-auto">
              <div className="flex justify-between items-center sticky top-0 bg-white z-10 pb-4 border-b">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="text-indigo-600" /> Upload Solution
                </h3>
                <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Final Response / Explanation</label>
                  <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700" rows={8} placeholder="Enter description for the work provided..." value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">New Solution Assets</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-[24px] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                    <Upload className="w-8 h-8 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500 font-bold">New Deliverables</p>
                    <input type="file" className="hidden" multiple onChange={(e) => setTempAttachments(Array.from(e.target.files || []))} />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tempAttachments.map((f, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100">{f.name}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-50 p-6 rounded-[24px] border border-indigo-100">
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-2">Final Bill Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-3.5 w-6 h-6 text-indigo-300" />
                    <input type="number" className="w-full pl-12 pr-4 py-4 bg-white border border-indigo-100 rounded-[18px] font-black text-xl outline-none" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
                  </div>
                </div>
              </div>

              <button onClick={handleSubmitSolution} disabled={uploading} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-lg shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-3">
                {uploading ? <Loader2 className="animate-spin" /> : <><CheckCircle className="w-6 h-6" /> SUBMIT TO CLIENT</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;