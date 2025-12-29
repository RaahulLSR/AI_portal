
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserRole, Project } from '../types';
import { 
  Sparkles, Plus, Loader2, ClipboardList, CheckCircle2, 
  Upload, Paperclip, Download, 
  X, RefreshCw,
  FileText, History, 
  User, Tag, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { sendEmailNotification } from '../lib/notifications';

interface AIServicesProps {
  role: UserRole;
}

const AttachmentGrid: React.FC<{ paths: string[] | null | undefined, bucket?: string }> = ({ paths, bucket = 'attachments' }) => {
  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-10 text-center">
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Awaiting assets</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
      {paths.map((path, i) => {
        if (!path) return null;
        const url = path.startsWith('http') ? path : supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
        const fileName = path.split('/').pop()?.split('-').pop() || 'Asset';
        const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(path);

        return (
          <div key={i} className="group relative">
            <a href={url} target="_blank" rel="noreferrer" className="block bg-white rounded-[2rem] overflow-hidden aspect-square border border-slate-100 hover:border-blue-500 hover:shadow-2xl transition-all shadow-sm">
              {isImg ? (
                <img src={url} alt="Attachment" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4">
                  <FileText className="w-10 h-10 mb-2 text-slate-200 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[9px] font-black uppercase truncate w-full text-center px-2 text-slate-400">{fileName}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity p-4">
                <Download className="w-6 h-6 text-white mb-1" />
                <span className="text-[9px] text-white font-black uppercase tracking-widest">Download</span>
              </div>
            </a>
          </div>
        );
      })}
    </div>
  );
};

const AIServices: React.FC<AIServicesProps> = ({ role }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkFeedback, setReworkFeedback] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [tempAttachments, setTempAttachments] = useState<File[]>([]);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let query = supabase.from('projects').select('*, profiles(*)').eq('category', 'AI Services').not('status', 'in', '("Completed","Paid")').order('created_at', { ascending: false });
    if (role !== 'admin') query = query.eq('customer_id', user.id);
    const { data } = await query;
    setProjects(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (files: File[]) => {
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const extension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
      const { data, error } = await supabase.storage.from('attachments').upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (!error && data) uploadedPaths.push(data.path);
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
        customer_id: user.id, category: 'AI Services', project_name: projectName, description, status: 'Pending', attachments: uploadedPaths
      }).select().single();
      
      if (error) throw error;

      // Notify Admin: New Order Created
      if (data) {
        await sendEmailNotification(
          'admin',
          `NEW AI SERVICE ORDER: #${data.project_number}`,
          `Customer ${user.email} has created a new AI Service project.\n\nProject: ${projectName}\nBrief: ${description}`
        );
      }

      setShowForm(false); fetchProjects(); setProjectName(''); setDescription(''); setTempAttachments([]);
    } catch (err: any) { 
      alert(`Submission Error: ${err.message}`); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleUpdateStatus = async (projectId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'Rework Requested') updateData.rework_feedback = reworkFeedback;
    
    const { error } = await supabase.from('projects').update(updateData).eq('id', projectId);
    if (error) return alert(error.message);

    // Notify Admin of Customer Feedback
    const proj = projects.find(p => p.id === projectId);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (proj && user) {
      await sendEmailNotification(
        'admin',
        `UPDATE: Project #${proj.project_number} Status -> ${status}`,
        `Customer ${user.email} has updated project #${proj.project_number} to "${status}".\n\n${status === 'Rework Requested' ? `Feedback: ${reworkFeedback}` : 'The customer has accepted the build and it is ready for billing.'}`
      );
    }

    setReworkFeedback(''); setShowReworkModal(false); setSelectedProject(null); fetchProjects();
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">AI Design Lab</h2>
          <p className="text-slate-400 font-medium text-sm mt-1">Industrial-grade apparel styles powered by the Nexus Logic Engine.</p>
        </div>
        {role === 'customer' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-slate-900 text-white px-8 py-4.5 rounded-[1.5rem] font-black shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-3 active:scale-95 group">
            {showForm ? <X className="w-5 h-5" /> : <><Plus className="w-5 h-5 transition-transform group-hover:rotate-90" /> Launch New Brief</>}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 space-y-10 animate-in slide-in-from-top-10 duration-500 max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-sm"><Tag className="w-6 h-6" /></div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Project Identity</h3>
              </div>
              <input type="text" required className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-bold text-lg" placeholder="Collection Title (e.g. Neo-Noir FW26)" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm"><ClipboardList className="w-6 h-6" /></div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">The Brief</h3>
              </div>
              <textarea required rows={5} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700 leading-relaxed" placeholder="Describe your design parameters, style goals, and functional requirements..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Reference Assets</label>
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-200 border-dashed rounded-[2.5rem] cursor-pointer bg-slate-50 hover:bg-white hover:border-blue-400 transition-all group overflow-hidden relative">
                <div className="flex flex-col items-center">
                  <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-500 transition-colors mb-3" />
                  <p className="text-sm text-slate-600 font-black">Drop files or click to browse</p>
                </div>
                <input type="file" className="hidden" multiple onChange={(e) => setTempAttachments(Array.from(e.target.files || []))} />
              </label>
              <div className="flex flex-wrap gap-2">
                {tempAttachments.map((f, i) => (
                  <span key={i} className="px-4 py-2 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-xl border border-blue-100 flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><Paperclip className="w-4 h-4" /> {f.name}</span>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] shadow-2xl hover:bg-blue-600 transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3">
            {submitting ? <Loader2 className="animate-spin w-6 h-6" /> : 'Transmit Brief'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Querying Logic Engine</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white p-32 rounded-[4rem] text-center border border-slate-100 shadow-sm">
            <Sparkles className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-xs">Zero active processes found</p>
          </div>
        ) : projects.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] hover:border-blue-100 transition-all cursor-pointer" onClick={() => setSelectedProject(p)}>
            <div className="flex items-start gap-8">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex flex-col items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                <span className="text-[8px] font-black uppercase tracking-tighter mb-1">ID</span>
                <span className="font-black text-sm text-slate-900 group-hover:text-white">{p.project_number}</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-4">
                  <h3 className="font-black text-slate-900 text-2xl tracking-tight leading-none">{p.project_name || 'Anonymous Design'}</h3>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    p.status === 'Customer Review' ? 'bg-blue-600 text-white shadow-lg' : 
                    p.status === 'Rework Requested' ? 'bg-amber-100 text-amber-700' : 
                    'bg-slate-50 text-slate-400'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                  <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Initialized {new Date(p.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {p.profiles?.brand_name || 'Personal'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all group-hover:bg-blue-600 flex items-center gap-2">
                Open Case <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PROJECT DETAILS MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 overflow-y-auto transition-all duration-500">
          <div className="bg-white rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] max-w-6xl w-full my-8 animate-in zoom-in-95 duration-400 overflow-hidden flex flex-col max-h-[95vh] border border-white">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[1.25rem] shadow-xl shadow-blue-100 transition-transform hover:rotate-12"><Sparkles className="w-7 h-7" /></div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{selectedProject.project_name || 'Design Record'}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 leading-none">Record Archive #{selectedProject.project_number}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-400"><X className="w-7 h-7" /></button>
            </div>

            <div className="flex-1 p-10 space-y-12 overflow-y-auto bg-slate-50/20">
              
              {selectedProject.admin_response && (
                <div className={`${selectedProject.status === 'Rework Requested' ? 'opacity-50 grayscale' : 'bg-slate-900 text-white shadow-2xl'} rounded-[3rem] p-10 space-y-10 relative overflow-hidden transition-all duration-700`}>
                  <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 transition-transform hover:rotate-0">
                    <Sparkles className="w-64 h-64" />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Transmitted Deliverable</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase opacity-50 tracking-widest mb-1">Settled Amount</p>
                      <p className="text-3xl font-black tracking-tight">${selectedProject.bill_amount}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 relative z-10">
                    <div className="lg:col-span-3 space-y-4">
                      <label className="text-[10px] font-black uppercase opacity-50 tracking-widest block ml-2">Executive Overview</label>
                      <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] font-medium leading-relaxed border border-white/10 text-lg shadow-inner">
                        {selectedProject.admin_response}
                      </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                      <label className="text-[10px] font-black uppercase opacity-50 tracking-widest block ml-2">Digital Master Assets</label>
                      <AttachmentGrid paths={selectedProject.admin_attachments} />
                    </div>
                  </div>
                </div>
              )}

              {selectedProject.rework_feedback && (
                <div className="bg-amber-50 border-2 border-amber-100 rounded-[3rem] p-10 space-y-6 animate-in slide-in-from-top-4 shadow-sm">
                  <div className="flex items-center gap-4 text-amber-600">
                    <RefreshCw className="w-7 h-7" />
                    <h4 className="text-sm font-black uppercase tracking-[0.2em]">Rework Protocol Instructions</h4>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-amber-200/50 text-slate-700 font-bold leading-relaxed shadow-sm">
                    {selectedProject.rework_feedback}
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-50/50 rounded-full blur-[100px]"></div>
                <div className="flex items-center gap-4 text-slate-400 border-b border-slate-50 pb-6 relative z-10">
                  <User className="w-6 h-6" />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em]">Initial Transmitted Brief</h4>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                  <div className="lg:col-span-2 space-y-4">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block ml-2">Request Context</label>
                    <p className="text-slate-900 font-bold text-xl leading-relaxed bg-slate-50/50 p-8 rounded-[2rem] border border-slate-50">{selectedProject.description}</p>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block ml-2">Initial Reference Deck</label>
                    <AttachmentGrid paths={selectedProject.attachments} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-white/90 backdrop-blur-md sticky bottom-0 z-30 flex justify-center">
              {selectedProject.status === 'Customer Review' && role === 'customer' ? (
                <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                  <button onClick={() => handleUpdateStatus(selectedProject.id, 'Accepted')} className="bg-emerald-600 text-white py-6 rounded-[1.75rem] font-black text-lg shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 group active:scale-95">
                    <CheckCircle2 className="w-7 h-7" /> ACCEPT BUILD
                  </button>
                  <button onClick={() => setShowReworkModal(true)} className="bg-amber-100 text-amber-700 border-2 border-amber-200 py-6 rounded-[1.75rem] font-black text-lg hover:bg-amber-200 transition-all flex items-center justify-center gap-3 active:scale-95">
                    <RefreshCw className="w-7 h-7" /> REQUEST REWORK
                  </button>
                </div>
              ) : (
                <button onClick={() => setSelectedProject(null)} className="w-full max-w-sm bg-slate-900 text-white py-6 rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200 active:scale-95">Dismiss View</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REWORK MODAL */}
      {showReworkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.2)] max-w-xl w-full p-12 space-y-10 animate-in zoom-in-95 duration-400">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[1.75rem] flex items-center justify-center mx-auto mb-4 shadow-inner">
                <RefreshCw className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Refinement Feedback</h3>
              <p className="text-slate-400 font-medium">Be specific with technical requested adjustments.</p>
            </div>
            
            <textarea 
              autoFocus
              className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all font-bold text-slate-700 min-h-[220px] shadow-inner"
              placeholder="e.g. Alter the panelling contrast on the yoke, increase structural rigidity of the hemline..."
              value={reworkFeedback}
              onChange={(e) => setReworkFeedback(e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => setShowReworkModal(false)} className="py-5 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">Cancel</button>
              <button 
                disabled={!reworkFeedback.trim()}
                onClick={() => handleUpdateStatus(selectedProject!.id, 'Rework Requested')} 
                className="py-5 bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-100 hover:bg-amber-700 disabled:opacity-30 transition-all uppercase tracking-widest text-xs"
              >
                Transmit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIServices;
export { AttachmentGrid };
