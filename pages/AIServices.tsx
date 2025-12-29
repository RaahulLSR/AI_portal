
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserRole, Project } from '../types';
import { 
  Sparkles, Plus, Loader2, ClipboardList, CheckCircle2, 
  Upload, Paperclip, Download, 
  X, RefreshCw,
  FileText, History, 
  User, Tag, Check, Shirt, Users, Ruler, Palette
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
  const [styleNumber, setStyleNumber] = useState('');
  const [colors, setColors] = useState('');
  const [sizes, setSizes] = useState('');
  const [apparelType, setApparelType] = useState('');
  const [gender, setGender] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [wants, setWants] = useState({
    new_style: false,
    tag_creation: false,
    color_variations: false,
    style_variations: false,
    marketing_poster: false
  });
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
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(fileName, file);

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
        spec_style_number: styleNumber,
        spec_colors: colors,
        spec_sizes: sizes,
        spec_apparel_type: apparelType,
        spec_gender: gender,
        spec_age_group: ageGroup,
        wants_new_style: wants.new_style,
        wants_tag_creation: wants.tag_creation,
        wants_color_variations: wants.color_variations,
        wants_style_variations: wants.style_variations,
        wants_marketing_poster: wants.marketing_poster,
        status: 'Pending',
        attachments: uploadedPaths
      });
      if (error) throw error;
      
      setShowForm(false);
      fetchProjects();
      resetForm();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setProjectName(''); setDescription(''); setStyleNumber(''); setColors(''); setSizes(''); setApparelType(''); setGender(''); setAgeGroup('');
    setWants({ new_style: false, tag_creation: false, color_variations: false, style_variations: false, marketing_poster: false });
    setTempAttachments([]);
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
          <p className="text-slate-500 font-medium text-sm">Create professional apparel styles powered by Nexus AI.</p>
        </div>
        {role === 'customer' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            {showForm ? <X className="w-5 h-5" /> : <><Plus className="w-5 h-5" /> Launch AI Project</>}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border border-slate-100 space-y-10 animate-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Tag className="w-5 h-5" /></div>
                  Project Identity
                </h3>
                <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold" placeholder="Project Name (e.g. Winter Jacket Series)" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                <textarea required rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-medium" placeholder="Describe what is needed..." value={description} onChange={(e) => setDescription(e.target.value)} />
                
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Project Requirements</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'new_style', label: 'New Style Creation' },
                      { id: 'tag_creation', label: 'Tag / Label Creation' },
                      { id: 'color_variations', label: 'Color Variations' },
                      { id: 'style_variations', label: 'Style Variations' },
                      { id: 'marketing_poster', label: 'Marketing Poster Generation' }
                    ].map(item => (
                      <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${wants[item.id as keyof typeof wants] ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 group-hover:border-blue-400'}`}>
                          {wants[item.id as keyof typeof wants] && <Check className="w-4 h-4" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={wants[item.id as keyof typeof wants]} onChange={() => setWants({...wants, [item.id]: !wants[item.id as keyof typeof wants]})} />
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-600"><Shirt className="w-5 h-5" /></div>
                  Apparel Specifications
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Style Number</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="SN-1024" value={styleNumber} onChange={e => setStyleNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Type of Dress</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Hoodie" value={apparelType} onChange={e => setApparelType(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 flex items-center gap-1"><Palette className="w-3 h-3"/> Available Colors</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Red, Black, Matte" value={colors} onChange={e => setColors(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 flex items-center gap-1"><Ruler className="w-3 h-3"/> Available Sizes</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="S, M, L, XL" value={sizes} onChange={e => setSizes(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 flex items-center gap-1"><Users className="w-3 h-3"/> Target Gender</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={gender} onChange={e => setGender(e.target.value)}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Age Group</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="18-35" value={ageGroup} onChange={e => setAgeGroup(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Reference Images</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                    <Upload className="w-8 h-8 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-600 font-black">Upload References</p>
                    <input type="file" className="hidden" multiple onChange={(e) => setTempAttachments(Array.from(e.target.files || []))} />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tempAttachments.map((f, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-full border border-blue-100">{f.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] shadow-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3">
              {submitting ? <Loader2 className="animate-spin" /> : 'Create Design Order'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
        ) : projects.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase tracking-[0.2em]">No Active Design Orders</p>
          </div>
        ) : projects.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-2xl transition-all cursor-pointer" onClick={() => setSelectedProject(p)}>
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                #{p.project_number}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">{p.project_name || 'Design Project'}</h3>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.status === 'Customer Review' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                  <span>{p.spec_apparel_type || 'Custom Apparel'}</span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest group-hover:bg-blue-600 transition-colors">Details</button>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-5xl w-full my-8 animate-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-xl"><Sparkles className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-black">{selectedProject.project_name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Project #{selectedProject.project_number}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-slate-50/30">
              {selectedProject.admin_response && (
                <div className="bg-indigo-600 text-white rounded-[32px] p-8 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest">Nexus AI Solution</h4>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase opacity-70">Price</p>
                      <p className="text-2xl font-black">${selectedProject.bill_amount}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <p className="bg-white/10 p-6 rounded-2xl font-medium leading-relaxed border border-white/20 whitespace-pre-wrap">{selectedProject.admin_response}</p>
                    <AttachmentGrid paths={selectedProject.admin_attachments} />
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-[32px] p-8 space-y-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Specifications</h4>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        {[
                          { label: 'Style #', value: selectedProject.spec_style_number },
                          { label: 'Apparel', value: selectedProject.spec_apparel_type },
                          { label: 'Colors', value: selectedProject.spec_colors },
                          { label: 'Sizes', value: selectedProject.spec_sizes },
                          { label: 'Gender', value: selectedProject.spec_gender },
                          { label: 'Age', value: selectedProject.spec_age_group }
                        ].map(s => (
                          <div key={s.label}>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{s.label}</p>
                            <p className="font-bold text-slate-800">{s.value || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Request Description</h4>
                      <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">{selectedProject.description}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Attachments</h4>
                    <AttachmentGrid paths={selectedProject.attachments} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-white">
              {selectedProject.status === 'Customer Review' && role === 'customer' && (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleUpdateStatus(selectedProject.id, 'Accepted')} className="bg-green-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-green-700 transition-all">ACCEPT & PAY</button>
                  <button onClick={() => setShowReworkModal(true)} className="bg-orange-50 text-orange-700 border-2 border-orange-100 py-4 rounded-2xl font-black text-lg hover:bg-orange-100 transition-all">REWORK</button>
                </div>
              )}
              {selectedProject.status !== 'Customer Review' && <button onClick={() => setSelectedProject(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm">Close</button>}
            </div>
          </div>
        </div>
      )}

      {showReworkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full p-10 space-y-6">
            <h3 className="text-2xl font-black text-center">Rework Feedback</h3>
            <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold min-h-[150px]" placeholder="Specific adjustments needed..." value={reworkFeedback} onChange={(e) => setReworkFeedback(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowReworkModal(false)} className="py-4 bg-slate-100 font-black rounded-2xl">Cancel</button>
              <button disabled={!reworkFeedback.trim()} onClick={() => handleUpdateStatus(selectedProject!.id, 'Rework Requested')} className="py-4 bg-orange-600 text-white font-black rounded-2xl">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIServices;
export { AttachmentGrid };
