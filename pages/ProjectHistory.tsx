
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Project, Profile } from '../types';
import { 
  Archive, 
  Search, 
  Eye, 
  FileText, 
  Download, 
  X, 
  Sparkles, 
  History,
  CheckCircle2,
  Calendar,
  Building,
  Tag,
  Loader2
} from 'lucide-react';
import { AttachmentGrid } from './AIServices';

interface ProjectHistoryProps {
  userProfile: Profile | null;
}

const ProjectHistory: React.FC<ProjectHistoryProps> = ({ userProfile }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    let query = supabase
      .from('projects')
      .select('*, profiles(*)')
      .in('status', ['Completed', 'Paid'])
      .order('created_at', { ascending: false });

    if (!isAdmin && userProfile) {
      query = query.eq('customer_id', userProfile.id);
    }

    const { data, error } = await query;
    if (!error) setProjects(data || []);
    setLoading(false);
  };

  const filteredProjects = projects.filter(p => 
    p.project_number.includes(search) || 
    p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.profiles?.brand_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Project Archive</h2>
          <p className="text-slate-500 font-medium text-sm">A permanent vault for all finished work iterations.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search Project ID or Name..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-200">
            <Archive className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-[0.2em]">Archive is Empty</p>
          </div>
        ) : (
          filteredProjects.map(p => (
            <div 
              key={p.id} 
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-xl transition-all cursor-pointer"
              onClick={() => setSelectedProject(p)}
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-amber-100 group-hover:text-amber-700 transition-all border border-slate-100 shadow-inner">
                  #{p.project_number}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-slate-800 text-lg leading-none">{p.project_name || p.spec_apparel_type || 'Custom Asset'}</h3>
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-green-100">Settled</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {p.category}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString()}</span>
                    {isAdmin && <span className="flex items-center gap-1 text-blue-500"><Building className="w-3 h-3" /> {p.profiles?.brand_name || p.profiles?.email}</span>}
                  </div>
                </div>
              </div>
              <button className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">View Record</button>
            </div>
          ))
        )}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-5xl w-full my-8 animate-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 text-white rounded-xl"><Archive className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Archived Record</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Project #{selectedProject.project_number}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 p-8 space-y-10 overflow-y-auto bg-slate-50/20">
              {/* FINAL DELIVERY */}
              <div className="bg-green-600 text-white rounded-[32px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <CheckCircle2 className="w-40 h-40" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Final Assets & Solutions</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase opacity-70">Total Settled Fee</p>
                    <p className="text-2xl font-black">${selectedProject.bill_amount}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-70">Expert Final Comments</label>
                    <p className="bg-white/10 p-6 rounded-2xl font-medium leading-relaxed whitespace-pre-wrap border border-white/20">
                      {selectedProject.admin_response}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase opacity-70">Deliverables</label>
                    <AttachmentGrid paths={selectedProject.admin_attachments} />
                  </div>
                </div>
              </div>

              {/* PROJECT HISTORY / REWORK (If any) */}
              {selectedProject.rework_feedback && (
                <div className="bg-white border border-slate-200 rounded-[32px] p-8 space-y-4 opacity-70">
                  <div className="flex items-center gap-3 text-slate-400">
                    <History className="w-5 h-5" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Last Rework Notes</h4>
                  </div>
                  <p className="text-slate-500 font-bold italic leading-relaxed">{selectedProject.rework_feedback}</p>
                </div>
              )}

              {/* INITIAL BRIEF */}
              <div className="bg-white border border-slate-200 rounded-[32px] p-8 space-y-6">
                <div className="flex items-center gap-3 text-blue-600 border-b border-slate-100 pb-4">
                  <FileText className="w-6 h-6" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Initial Project Brief</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Original Request</label>
                      <p className="text-slate-700 font-bold leading-relaxed">{selectedProject.description}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Original Client Files</label>
                    <AttachmentGrid paths={selectedProject.attachments} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-white sticky bottom-0 z-30 shadow-lg">
              <button 
                onClick={() => setSelectedProject(null)} 
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all"
              >
                Close Archive View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHistory;
