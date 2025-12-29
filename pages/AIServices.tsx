
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserRole, Project } from '../types';
import { 
  Sparkles, Plus, Loader2, ClipboardList, CheckCircle2, 
  Upload, Paperclip, Download, 
  X, RefreshCw,
  FileText, History, 
  User, Tag, AlertTriangle
} from 'lucide-react';

interface AIServicesProps {
  role: UserRole;
}

const AttachmentGrid: React.FC<{ paths: string[] | null | undefined, bucket?: string }> = ({ paths, bucket = 'attachments' }) => {
  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-slate-400 italic text-xs font-medium uppercase tracking-widest">No attachments found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
      {paths.map((path, i) => {
        if (!path) return null;
        const isFullUrl = path.startsWith('http');
        const url = isFullUrl ? path : supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
        const fileName = path.split('/').pop()?.split('-').pop() || 'File';
        const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(path);

        return (
          <div key={i} className="group relative">
            <a href={url} target="_blank" rel="noreferrer" className="block bg-white rounded-2xl overflow-hidden aspect-square border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all shadow-sm">
              {isImg ? (
                <img src={url} alt="Attachment" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4">
                  <FileText className="w-10 h-10 mb-2 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[10px] font-black uppercase truncate w-full text-center px-2 text-slate-500">{fileName}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity p-4">
                <Download className="w-6 h-6 text-white mb-2" />
                <span className="text-[10px] text-white font-black uppercase tracking-widest">Download</span>
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
  
  // Rework State
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkFeedback, setReworkFeedback] = useState('');

  // Form State
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [tempAttachments, setTempAttachments] = useState<File[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('projects')
      .select('*, profiles(*)')
      .eq('category', 'AI Services')
      .not('status', 'in', '("Completed","Paid")')
      .order('created_at', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('customer_id', user.id);
    }

    const { data, error } = await query;
    if (!error) setProjects(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (files: File[]) => {
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const extension = file.name.split('.').pop();
      const baseName = file.name.split('.').slice(0, -1).join('.');
      const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${Date.now()}-${cleanBaseName}.${extension}`;
      
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

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
      const { error } = await supabase.from('projects').insert({
        customer_id: user.id,
        category: 'AI Services',
        project_name: projectName,
        description,
        status: 'Pending',
        attachments: uploadedPaths
      });
      if (error) throw error;
      setShowForm(false);
      fetchProjects();
      setProjectName(''); setDescription(''); setTempAttachments([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (projectId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'Rework Requested') {
      updateData.rework_feedback = reworkFeedback;
    }
    await supabase.from('projects').update(updateData).eq('id', projectId);
    setReworkFeedback('');
    setShowReworkModal(false);
    setSelectedProject(null);
    fetchProjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">AI Design Lab</h2>
          <p className="text-slate-500 font-medium text-sm">Professional apparel styles powered by Nexus AI.</p>
        </div>
        {role === 'customer' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            {showForm ? <X className="w-5 h-5" /> : <><Plus className="w-5 h-5" /> Launch New Order</>}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Tag className="w-6 h-6" /></div>
                Project Identity
              </h3>
              <input 
                type="text" 
                required 
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-bold" 
                placeholder="Give your project a name (e.g. Summer Collection 2025)" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)} 
              />

              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mt-8">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><ClipboardList className="w-6 h-6" /></div>
                The Ask
              </h3>
              <textarea required rows={5} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="Tell us exactly what you envision..." value={description} onChange={(e) => setDescription(e.target.value)} />
              
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Reference Attachments</label>
                <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-slate-200 border-dashed rounded-[32px] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                  <Upload className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600 font-black text-center">Click to upload references</p>
                  <input type="file" className="hidden" multiple onChange={(e) => setTempAttachments(Array.from(e.target.files || []))} />
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  {tempAttachments.map((f, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-full border border-blue-100 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> {f.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] shadow-2xl hover:bg-slate-800 transition-all mt-4 uppercase tracking-widest text-sm">
              {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Launch Order'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
        ) : projects.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase tracking-[0.2em]">No Active AI Services</p>
          </div>
        ) : projects.map(p => (
          <div key={p.id} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-2xl transition-all cursor-pointer" onClick={() => setSelectedProject(p)}>
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                #{p.project_number}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">{p.project_name || 'AI Custom Request'}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${p.status === 'Customer Review' ? 'bg-indigo-600 text-white shadow-lg' : p.status === 'Rework Requested' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <History className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <button className="bg-slate-900 text-white px-7 py-3.5 rounded-[20px] font-black text-sm uppercase tracking-widest group-hover:bg-blue-600 transition-colors">Details</button>
          </div>
        ))}
      </div>

      {/* PROJECT DETAILS MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-5xl w-full my-8 animate-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-xl"><Sparkles className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedProject.project_name || 'AI Service Case'}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">#{selectedProject.project_number}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 p-8 space-y-10 overflow-y-auto bg-slate-50/30">
              
              {/* CURRENT SUBMISSION / SOLUTION SECTION (Show this at the top) */}
              {selectedProject.admin_response && (
                <div className={`${selectedProject.status === 'Rework Requested' ? 'opacity-60 bg-slate-100 border-slate-200' : 'bg-indigo-600 text-white shadow-2xl'} rounded-[32px] p-8 space-y-6 relative overflow-hidden transition-all shadow-lg`}>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6" />
                      <h4 className="text-sm font-black uppercase tracking-widest">
                        {selectedProject.rework_feedback && selectedProject.status !== 'Rework Requested' ? 'Revised AI Delivery' : 'Nexus AI Delivery'}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase opacity-70">Amount Invoiced</p>
                      <p className="text-2xl font-black">${selectedProject.bill_amount}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase opacity-70">Output Description</label>
                      <p className={`p-6 rounded-2xl font-medium leading-relaxed whitespace-pre-wrap shadow-inner ${selectedProject.status === 'Rework Requested' ? 'bg-white text-slate-600' : 'bg-white/10 text-white'}`}>
                        {selectedProject.admin_response}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase opacity-70">Project Deliverables</label>
                      <AttachmentGrid paths={selectedProject.admin_attachments} />
                    </div>
                  </div>
                </div>
              )}

              {/* REWORK FEEDBACK SECTION (Show below current work if it exists) */}
              {selectedProject.rework_feedback && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-[32px] p-8 space-y-4 animate-in slide-in-from-top-4 shadow-sm">
                  <div className="flex items-center gap-3 text-orange-600">
                    <RefreshCw className="w-6 h-6" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Previous Rework Instructions</h4>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-orange-100 text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                    {selectedProject.rework_feedback}
                  </div>
                </div>
              )}

              {/* PROJECT BRIEF SECTION (Original Request) */}
              <div className="bg-white border border-slate-200 rounded-[32px] p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3 text-blue-600 border-b border-slate-100 pb-4">
                  <User className="w-6 h-6" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Original Project Brief</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Initial Request Context</label>
                      <p className="text-slate-700 font-bold leading-relaxed">{selectedProject.description}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Original Reference Files</label>
                    <AttachmentGrid paths={selectedProject.attachments} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-white sticky bottom-0 z-30 shadow-lg">
              {selectedProject.status === 'Customer Review' && role === 'customer' && (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleUpdateStatus(selectedProject.id, 'Accepted')} className="bg-green-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3">
                    <CheckCircle2 className="w-6 h-6" /> ACCEPT WORK
                  </button>
                  <button onClick={() => setShowReworkModal(true)} className="bg-orange-50 text-orange-700 border-2 border-orange-100 py-5 rounded-2xl font-black text-lg hover:bg-orange-100 transition-all flex items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6" /> REQUEST REWORK
                  </button>
                </div>
              )}
              {(!selectedProject.admin_response || selectedProject.status === 'Completed' || selectedProject.status === 'Accepted' || selectedProject.status === 'Rework Requested') && (
                <button onClick={() => setSelectedProject(null)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all">Close Project View</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REWORK FEEDBACK MODAL */}
      {showReworkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full p-10 space-y-6 animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Rework Feedback</h3>
              <p className="text-slate-500 font-medium">What exactly needs to be changed? Be specific.</p>
            </div>
            
            <textarea 
              autoFocus
              className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all font-bold min-h-[200px]"
              placeholder="e.g. Change the color of the sleeves to matte black and make the logo 20% smaller..."
              value={reworkFeedback}
              onChange={(e) => setReworkFeedback(e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowReworkModal(false)} className="py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all">CANCEL</button>
              <button 
                disabled={!reworkFeedback.trim()}
                onClick={() => handleUpdateStatus(selectedProject!.id, 'Rework Requested')} 
                className="py-4 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-700 disabled:opacity-50 transition-all"
              >
                SEND FEEDBACK
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
