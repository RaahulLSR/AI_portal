
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'customer'
          }
        }
      });
      if (error) {
        setError(error.message);
      } else if (data.user && data.session === null) {
        setSuccess("Account created! Please check your email for a confirmation link.");
      } else {
        setSuccess("Registration successful! Logging you in...");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] px-4 relative overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full relative">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white p-8 md:p-10 transition-all duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-6 shadow-xl shadow-blue-200 transform transition-transform hover:scale-110">
              <span className="text-white text-3xl font-black italic">N</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {isSignUp ? 'Join Nexus' : 'Welcome Back'}
            </h1>
            <p className="text-slate-500 mt-2 font-medium text-sm">
              {isSignUp ? 'Start your high-performance AI journey today.' : 'Enter your credentials to access the hub.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-red-600 text-xs font-bold leading-tight">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-emerald-700 text-xs font-bold leading-tight">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative bg-slate-900 text-white font-black py-4.5 rounded-2xl transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-2 group overflow-hidden active:scale-[0.98] disabled:opacity-70"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin relative z-10" />
              ) : (
                <span className="relative z-10 flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
                  {isSignUp ? 'Create Profile' : 'Sign In'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="text-xs font-bold text-blue-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
            >
              {isSignUp ? 'Back to Login' : "Request Access Account"}
            </button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-[9px] text-slate-300 uppercase tracking-widest font-black">
              <ShieldCheck className="w-3 h-3" />
              Enterprise Grade Encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
