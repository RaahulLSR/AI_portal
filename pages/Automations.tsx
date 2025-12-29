
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserRole, Project } from '../types';
import { 
  Zap, Plus, Loader2, History, X, MessageSquare, DollarSign, 
  Download, FileText, Check, RefreshCw, Upload, Paperclip, 
  ClipboardList, Clock, Info, CheckCircle2, Image as ImageIcon,
  User, Sparkles, AlertTriangle
} from 'lucide-react';
import { AttachmentGrid } from './AIServices';

const Automations: React.FC<{ role: UserRole }> = ({ role }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tempAttachments, setTempAttachments] = useState<File[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    let query = supabase.from('projects').select('*, profiles(*)').eq('category', 'Automations').not('status', 'in', '("Completed","Paid")').order('created_at', { ascending: false });
    if (role !== 'admin') query = query.eq('customer_id', user?.id);
    const { data } = await query;
    setProjects(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (files: File[]) => {
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${Date.now()}-${cleanName}`;
      
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
        
      if (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
      } else if (data) {
        uploadedPaths.push(data.path);
      }
    }
    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth session expired.");
      const uploadedPaths = await handleFileUpload(tempAttachments);
      const { error } = await supabase.from('projects').insert({
        customer_id: user?.id, category: 'Automations', project_name: name, description: desc, status: 'Pending', attachments: uploadedPaths
      });
      if (error) throw error;
      setShowForm(false); fetchProjects(); setName(''); setDesc(''); setTempAttachments([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (projectId: string, status: string) => {
    await supabase.from('projects').update({ status }).eq('id', projectId);
    fetchProjects();
    setSelectedProject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Flow Forge</h2><p className="text-slate-500 font-medium">Intelligent business workflow and logic systems.</p></div>
        {role === 'customer' && <button onClick={() => setShowForm(!showForm)} className={`${showForm ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-xl'} px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2`}>{showForm ? <X className="w-5 h-5" /> : <><Plus className="w-5 h-5" /> New Automation</>}</button>}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-2xl border space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600"><div className="p-2 bg-blue-50 rounded-xl"><Zap className="w-6 h-6" /></div><h3 className="text-lg font-black uppercase">Logic Brief</h3></div>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold" placeholder="Automation Title" />
              <textarea required value={desc} onChange={(e) => setDesc(e.target.value)} rows={6} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-medium" placeholder="Process details..." />
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-indigo-600"><div className="p-2 bg-indigo-50 rounded-xl"><History className="w-6 h-6" /></div><h3 className="text-lg font-black uppercase">Logic Maps</h3></div>
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-[32px] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 font-black">Upload logic charts</p>
                <input type="file" className="hidden" multiple onChange={(e) => setTempAttachments(Array.from(e.target.files || []))} />
              </label>
              <div className="flex flex-wrap gap-2 pt-2">
                {tempAttachments.map((f, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-full border border-blue-100 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> {f.name}</span>
                ))}
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] shadow-2xl hover:bg-slate-800 transition-all mt-4 uppercase tracking-widest text-sm">Request Automation</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div> : projects.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-200">
            <Zap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-[0.2em]">No Active Automation Projects</p>
          </div>
        ) : projects.map(p => (
          <div key={p.id} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-2xl transition-all cursor-pointer" onClick={() => setSelectedProject(p)}>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-slate-100 flex items-center justify-center text-slate-500 font-black group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner text-sm">#{p.project_number}</div>
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">{p.project_name || 'Automation Process'}</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'Customer Review' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{p.status}</span>
              <button className="bg-slate-900 text-white px-7 py-3.5 rounded-[20px] font-black text-sm uppercase tracking-widest">DETAILS</button>
            </div>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-4xl w-full my-8 animate-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-xl"><Zap className="w-6 h-6" /></div>
                <div><h3 className="text-xl font-black">Automation Spec</h3><p className="text-[10px] font-bold uppercase tracking-widest">#{selectedProject.project_number}</p></div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-slate-50/30">
              
              {/* SOLUTION (Top priority) */}
              {selectedProject.admin_response && (
                <div className={`${selectedProject.status === 'Rework Requested' ? 'opacity-60 bg-slate-100 border-slate-200' : 'bg-indigo-600 text-white shadow-2xl'} rounded-[32px] p-8 space-y-6 relative overflow-hidden transition-all shadow-lg`}>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3"><Sparkles className="w-6 h-6" /><h4 className="text-sm font-black uppercase tracking-widest">{selectedProject.rework_feedback && selectedProject.status !== 'Rework Requested' ? 'Revised Automation Build' : 'Nexus Automation Build'}</h4></div>
                    <div className="text-right"><p className="text-[10px] font-black uppercase opacity-70">Project Value</p><p className="text-2xl font-black">${selectedProject.bill_amount}</p></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <p className={`p-6 rounded-2xl font-medium leading-relaxed whitespace-pre-wrap shadow-inner ${selectedProject.status === 'Rework Requested' ? 'bg-white text-slate-600' : 'bg-white/10 text-white'}`}>{selectedProject.admin_response}</p>
                    <AttachmentGrid paths={selectedProject.admin_attachments} />
                  </div>
                </div>
              )}

              {/* REWORK FEEDBACK (Middle) */}
              {selectedProject.rework_feedback && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-[32px] p-8 space-y-4 animate-in slide-in-from-top-4 shadow-sm">
                  <div className="flex items-center gap-3 text-orange-600">
                    <RefreshCw className="w-6 h-6" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Logic Adjustments</h4>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-orange-100 text-slate-700 font-bold whitespace-pre-wrap">{selectedProject.rework_feedback}</div>
                </div>
              )}

              {/* BRIEF (Bottom) */}
              <div className="bg-white border border-slate-200 rounded-[32px] p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-blue-600 border-b border-slate-100 pb-4"><User className="w-5 h-5" /><h4 className="text-sm font-black uppercase tracking-widest">Customer Requirement</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <p className="text-lg font-black text-slate-900">{selectedProject.project_name}</p>
                    <p className="text-slate-700 font-bold leading-relaxed">{selectedProject.description}</p>
                  </div>
                  <AttachmentGrid paths={selectedProject.attachments} />
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-white sticky bottom-0 z-30">
              {selectedProject.status === 'Customer Review' && role === 'customer' && (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleUpdateStatus(selectedProject.id, 'Accepted')} className="bg-green-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-green-700 transition-all flex items-center justify-center gap-3">
                    <CheckCircle2 className="w-6 h-6" /> APPROVE FLOW
                  </button>
                  <button onClick={() => handleUpdateStatus(selectedProject.id, 'Rework Requested')} className="bg-orange-50 text-orange-700 border-2 border-orange-100 py-4 rounded-2xl font-black text-lg hover:bg-orange-100 transition-all flex items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6" /> REQUEST CHANGES
                  </button>
                </div>
              )}
              {(!selectedProject.admin_response || selectedProject.status === 'Completed' || selectedProject.status === 'Accepted' || selectedProject.status === 'Rework Requested') && (
                <button onClick={() => setSelectedProject(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all">Close</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automations;
