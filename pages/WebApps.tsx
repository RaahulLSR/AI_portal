
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserRole, Project } from '../types';
import { 
  Globe, Plus, Loader2, History, X, MessageSquare, DollarSign, 
  Download, FileText, Check, RefreshCw, Upload, Paperclip, 
  ClipboardList, Clock, Info, CheckCircle2, Layout, Image as ImageIcon,
  User, Sparkles, AlertTriangle
} from 'lucide-react';
import { AttachmentGrid } from './AIServices';
import { sendEmailNotification } from '../lib/notifications';

const WebApps: React.FC<{ role: UserRole }> = ({ role }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tempAttachments, setTempAttachments] = useState<File[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Rework State
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkFeedback, setReworkFeedback] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let query = supabase.from('projects').select('*, profiles(*)').eq('category', 'Websites & Apps').not('status', 'in', '("Completed","Paid")').order('created_at', { ascending: false });
    if (role !== 'admin') query = query.eq('customer_id', user?.id);
    const { data } = await query;
    setProjects(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (files: File[]) => {
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const extension = file.name.split('.').pop();
      const baseName = file.name.split('.').slice(0, -1).join('.');
      const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${Date.now()}-${cleanBaseName}.${extension}`;
      const { data, error } = await supabase.storage.from('attachments').upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      else if (data) uploadedPaths.push(data.path);
    }
    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired.");
      const uploadedPaths = await handleFileUpload(tempAttachments);
      const { data, error } = await supabase.from('projects').insert({
        customer_id: user?.id, category: 'Websites & Apps', project_name: name, description: desc, status: 'Pending', attachments: uploadedPaths
      }).select().single();

      if (error) throw error;

      // Notify Admin: New Web Project Created
      if (data) {
        await sendEmailNotification(
          'admin',
          `NEW WEB/APP ORDER: #${data.project_number}`,
          `Customer ${user.email} has launched a Software project.\n\nProject: ${name}\nBrief: ${desc}`
        );
      }

      setShowForm(false); fetchProjects(); setName(''); setDesc(''); setTempAttachments([]);
    } catch (err: any) { alert(err.message); } finally { setSubmitting(false); }
  };

  const handleUpdateStatus = async (projectId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'Rework Requested') updateData.rework_feedback = reworkFeedback;
    
    const { error } = await supabase.from('projects').update(updateData).eq('id', projectId);
    if (error) return alert(error.message);

    // Notify Admin
    const proj = projects.find(p => p.id === projectId);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (proj && user) {
      await sendEmailNotification(
        'admin',
        `UPDATE: Software Project #${proj.project_number} -> ${status}`,
        `Customer ${user.email} updated project #${proj.project_number} to "${status}".\n\n${status === 'Rework Requested' ? `Changes: ${reworkFeedback}` : 'The customer approved the software build.'}`
      );
    }

    setReworkFeedback(''); setShowReworkModal(false); setSelectedProject(null); fetchProjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Software Hub</h2><p className="text-slate-500 font-medium text-sm">Engineering and cloud ecosystems.</p></div>
        {role === 'customer' && <button onClick={() => setShowForm(!showForm)} className={`${showForm ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-xl'} px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2`}>{showForm ? <X className="w-5 h-5" /> : <><Plus className="w-5 h-5" /> New Build</>}</button>}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-2xl border space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" placeholder="App Title" />
              <textarea required value={desc} onChange={(e) => setDesc(e.target.value)} rows={6} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="Functional Brief..." />
            </div>
            <div className="space-y-6">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-[32px] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 font-black">Technical Documentation</p>
                <input type="file" className="hidden" multiple onChange={(e) => setTempAttachments(Array.from(e.target.files || []))} />
              </label>
              <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] shadow-2xl hover:bg-slate-800 transition-all">DEV REQUEST</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div> : projects.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-200">
            <Globe className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-[0.2em]">No Active Software Projects</p>
          </div>
        ) : projects.map(p => (
          <div key={p.id} className="bg-white p-7 rounded-[32px] border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-2xl transition-all cursor-pointer" onClick={() => setSelectedProject(p)}>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">#{p.project_number}</div>
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">{p.project_name || 'Web Project'}</h3>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.status === 'Rework Requested' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100'}`}>{p.status}</span>
              </div>
            </div>
            <button className="bg-slate-900 text-white px-7 py-3.5 rounded-[20px] font-black text-sm uppercase tracking-widest">DETAILS</button>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-5xl w-full my-8 animate-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-xl"><Globe className="w-6 h-6" /></div>
                <div><h3 className="text-xl font-black">Development File</h3><p className="text-[10px] font-bold uppercase">#{selectedProject.project_number}</p></div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 p-8 space-y-10 overflow-y-auto bg-slate-50/30">
              
              {/* SOLUTION SECTION (Top priority) */}
              {selectedProject.admin_response && (
                <div className={`${selectedProject.status === 'Rework Requested' ? 'opacity-60 grayscale bg-slate-100 border-slate-200' : 'bg-indigo-600 text-white shadow-2xl'} rounded-[32px] p-8 space-y-6 relative overflow-hidden transition-all shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Sparkles className="w-6 h-6" /><h4 className="text-sm font-black uppercase tracking-widest">{selectedProject.rework_feedback && selectedProject.status !== 'Rework Requested' ? 'Revised Dev Build' : 'Nexus Build Delivery'}</h4></div>
                    <div className="text-right"><p className="text-[10px] font-black uppercase opacity-70">Build Quote</p><p className="text-2xl font-black">${selectedProject.bill_amount}</p></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <p className={`p-6 rounded-2xl font-medium leading-relaxed shadow-inner ${selectedProject.status === 'Rework Requested' ? 'bg-white text-slate-600' : 'bg-white/10 text-white'}`}>{selectedProject.admin_response}</p>
                    <AttachmentGrid paths={selectedProject.admin_attachments} />
                  </div>
                </div>
              )}

              {/* REWORK FEEDBACK SECTION (Middle) */}
              {selectedProject.rework_feedback && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-[32px] p-8 space-y-4 animate-in slide-in-from-top-4 shadow-sm">
                  <div className="flex items-center gap-3 text-orange-600">
                    <RefreshCw className="w-6 h-6" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Code Rework Instructions</h4>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-orange-100 text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">{selectedProject.rework_feedback}</div>
                </div>
              )}

              {/* BRIEF SECTION (Bottom) */}
              <div className="bg-white border border-slate-200 rounded-[32px] p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3 text-blue-600 border-b border-slate-100 pb-4"><User className="w-6 h-6" /><h4 className="text-sm font-black uppercase tracking-widest">Initial Build Requirements</h4></div>
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
                  <button onClick={() => handleUpdateStatus(selectedProject.id, 'Accepted')} className="bg-green-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-700 transition-all">APPROVE BUILD</button>
                  <button onClick={() => setShowReworkModal(true)} className="bg-orange-50 text-orange-700 border-2 border-orange-100 py-5 rounded-2xl font-black text-lg hover:bg-orange-100 transition-all">REQUEST CHANGES</button>
                </div>
              )}
              {(!selectedProject.admin_response || selectedProject.status === 'Completed' || selectedProject.status === 'Accepted' || selectedProject.status === 'Rework Requested') && (
                <button onClick={() => setSelectedProject(null)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all">Close</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REWORK MODAL */}
      {showReworkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full p-10 space-y-6 animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-center">Change Request</h3>
            <textarea autoFocus className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold min-h-[200px]" placeholder="Specific bugs or design adjustments..." value={reworkFeedback} onChange={(e) => setReworkFeedback(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowReworkModal(false)} className="py-4 bg-slate-100 font-black rounded-2xl">CANCEL</button>
              <button disabled={!reworkFeedback.trim()} onClick={() => handleUpdateStatus(selectedProject!.id, 'Rework Requested')} className="py-4 bg-orange-600 text-white font-black rounded-2xl shadow-xl hover:bg-orange-700">SUBMIT FEEDBACK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebApps;
