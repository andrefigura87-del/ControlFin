import React, { useState } from 'react';
import { Activity, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../core/AuthContext';

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signIn } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (err) {
      setError("E-mail ou senha inválidos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 selection:bg-emerald-500/30">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl animate-pulse">
             <Activity size={32}/>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ControlFin Cloud</h1>
          <p className="text-zinc-500 text-sm mt-1">Acesse sua plataforma financeira v5.6</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-medium ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-600" size={18}/>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e=>setEmail(e.target.value)}
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-700" 
                placeholder="nome@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-medium ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-zinc-600" size={18}/>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e=>setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-700" 
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <div className="text-rose-400 text-xs text-center font-medium bg-rose-400/10 py-2 rounded-lg border border-rose-400/20">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-3 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Activity className="animate-spin" size={20}/> : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-600">
           Sistema Protegido | ControlFin © 2026
        </div>
      </div>
    </div>
  );
};

export default LoginView;
