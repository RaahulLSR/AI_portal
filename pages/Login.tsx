
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn } from 'lucide-react';

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
            role: 'customer' // Default role for new signups
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg transform transition-transform hover:scale-105">
            <span className="text-white text-3xl font-bold">N</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {isSignUp ? 'Join Nexus Hub to start your projects' : 'Sign in to manage your AI services'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {isSignUp && (
                <p className="mt-1 text-[10px] text-slate-400 italic">Minimum 6 characters required.</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-2 animate-in fade-in zoom-in duration-200">
              <span className="text-red-500 text-sm font-medium leading-tight">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 p-3 rounded-lg flex items-start gap-2 animate-in fade-in zoom-in duration-200">
              <span className="text-green-600 text-sm font-medium leading-tight">{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${isSignUp ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group relative overflow-hidden`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="relative z-10 flex items-center gap-2">
                  {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isSignUp ? 'Register Now' : 'Sign In'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </>
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
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Create one"}
          </button>
          
          <p className="mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-black">
            Secure Enterprise Gateway
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
