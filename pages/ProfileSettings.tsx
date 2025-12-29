
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Profile } from '../types';
import { User, Save, Upload, FileText, Image as ImageIcon, Loader2, Paperclip, X, Mail, Phone } from 'lucide-react';
import { AttachmentGrid } from './AIServices';

const ProfileSettings: React.FC<{ profile: Profile | null }> = ({ profile }) => {
  const [brandName, setBrandName] = useState(profile?.brand_name || '');
  const [tagline, setTagline] = useState(profile?.tagline || '');
  const [desc, setDesc] = useState(profile?.description || '');
  const [contactEmail, setContactEmail] = useState(profile?.contact_email || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [brandAssets, setBrandAssets] = useState<string[]>(profile?.brand_assets || []);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      brand_name: brandName,
      tagline: tagline,
      description: desc,
      contact_email: contactEmail,
      phone_number: phone,
      brand_assets: brandAssets
    }).eq('id', profile?.id);
    
    setLoading(false);
    if (error) alert(error.message);
    else alert('Profile and Brand Vault updated!');
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPaths: string[] = [];
    try {
      for (const file of Array.from(files) as File[]) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `brand-${Date.now()}-${cleanName}`;
        
        const { data, error } = await supabase.storage
          .from('brand-assets')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) {
          console.error('Asset upload error:', error);
          alert(`Failed to upload ${file.name}: ${error.message}. Ensure 'brand-assets' bucket is public and RLS is configured.`);
        } else if (data) {
          newPaths.push(data.path);
        }
      }

      const updatedAssets = [...brandAssets, ...newPaths];
      setBrandAssets(updatedAssets);
      
      const { error: profileError } = await supabase.from('profiles').update({
        brand_assets: updatedAssets
      }).eq('id', profile?.id);
      
      if (profileError) throw profileError;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeAsset = async (pathToRemove: string) => {
    const updatedAssets = brandAssets.filter(p => p !== pathToRemove);
    setBrandAssets(updatedAssets);
    await supabase.from('profiles').update({ brand_assets: updatedAssets }).eq('id', profile?.id);
  };

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
        <div className="flex items-center gap-4 text-slate-900">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><User className="w-6 h-6" /></div>
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase">Brand Identity</h3>
            <p className="text-slate-500 font-medium text-sm">Define how Nexus Admins see your brand.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Brand Name</label>
            <input value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold" placeholder="e.g. Nexus Apparel" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Primary Tagline</label>
            <input value={tagline} onChange={e => setTagline(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-medium" placeholder="e.g. Future of Fashion" />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Mail className="w-3 h-3" /> Contact Email ID</label>
            <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold" placeholder="contact@yourbrand.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Phone className="w-3 h-3" /> Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold" placeholder="+1 (555) 000-0000" />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Brand Narrative</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-medium" placeholder="Core brand values, style guides, or history..." />
          </div>
        </div>
        
        <button onClick={handleSave} disabled={loading} className="w-full bg-slate-900 text-white px-8 py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-sm">
          {loading ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5" /> Update Brand Identity</>}
        </button>
      </div>

      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
        <div className="flex items-center gap-4 text-slate-900">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Upload className="w-6 h-6" /></div>
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase">Brand Vault</h3>
            <p className="text-slate-500 font-medium text-sm">Permanent master assets (Logos, PDFs, Style Guides).</p>
          </div>
        </div>

        <div className="space-y-6">
          <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-200 rounded-[32px] cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-indigo-500 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? <Loader2 className="w-10 h-10 animate-spin text-indigo-600" /> : <><ImageIcon className="w-10 h-10 text-slate-300 group-hover:text-indigo-500 mb-3" /><p className="text-sm text-slate-600 font-black">Upload Master Assets</p><p className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-widest">Logos, Tech Packs, Branding PDFs</p></>}
            </div>
            <input type="file" className="hidden" multiple onChange={handleAssetUpload} />
          </label>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Current Vault Assets</h4>
            {brandAssets.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {brandAssets.map((asset, i) => (
                  <div key={i} className="relative group">
                    <AttachmentGrid paths={[asset]} bucket="brand-assets" />
                    <button onClick={() => removeAsset(asset)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110 active:scale-90">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-10 rounded-3xl text-center border border-slate-100">
                <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Vault is Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
