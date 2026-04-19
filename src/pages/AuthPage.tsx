import { useState, type FormEvent } from 'react';
import { Film, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

type Mode = 'login' | 'register';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setSuccess(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'register') {
      if (!fullName.trim()) return setError('Introduce tu nombre completo.');
      if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');
      if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
      } else {
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar el registro y luego inicia sesión.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-cinema flex flex-col">
      {/* Header */}
      <header className="border-b border-cinema-border bg-cinema-dark/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2 text-cinema-gold">
            <Film size={28} strokeWidth={1.5} />
            <span className="text-xl font-display font-bold tracking-wide">FilmRoute</span>
          </div>
          <div className="h-5 w-px bg-cinema-border mx-2" />
          <p className="text-sm text-cinema-text-dim hidden sm:block">
            Estrategia de Distribución Cinematográfica Independiente
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-cinema-card border border-cinema-border rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            {/* Tabs */}
            <div className="flex border-b border-cinema-border">
              {(['login', 'register'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={clsx(
                    'flex-1 py-4 text-sm font-semibold transition-all',
                    mode === m
                      ? 'text-cinema-gold border-b-2 border-cinema-gold bg-cinema-gold/5'
                      : 'text-cinema-text-dim hover:text-cinema-text',
                  )}
                >
                  {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              ))}
            </div>

            <div className="p-8">
              {/* Title */}
              <div className="mb-6">
                <h1 className="text-xl font-display font-bold text-cinema-text">
                  {mode === 'login' ? 'Bienvenido de nuevo' : 'Únete a FilmRoute'}
                </h1>
                <p className="text-cinema-text-dim text-sm mt-1">
                  {mode === 'login'
                    ? 'Accede a tu estrategia de distribución'
                    : 'Crea tu cuenta gratuita y empieza a distribuir'}
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <div className="flex items-start gap-3 bg-red-900/20 border border-red-700/40 rounded-xl p-4 mb-5">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-3 bg-green-900/20 border border-green-700/40 rounded-xl p-4 mb-5">
                  <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-300">{success}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-cinema-text">
                      Nombre completo <span className="text-cinema-gold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Tu nombre y apellidos"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      className="bg-cinema-dark border border-cinema-border rounded-lg px-4 py-3 text-cinema-text placeholder-cinema-muted text-sm focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold transition-colors"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-cinema-text">
                    Email <span className="text-cinema-gold">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="bg-cinema-dark border border-cinema-border rounded-lg px-4 py-3 text-cinema-text placeholder-cinema-muted text-sm focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-cinema-text">
                    Contraseña <span className="text-cinema-gold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full bg-cinema-dark border border-cinema-border rounded-lg px-4 py-3 pr-11 text-cinema-text placeholder-cinema-muted text-sm focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cinema-muted hover:text-cinema-text transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-cinema-text">
                      Confirmar contraseña <span className="text-cinema-gold">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="bg-cinema-dark border border-cinema-border rounded-lg px-4 py-3 text-cinema-text placeholder-cinema-muted text-sm focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold transition-colors"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-gold text-cinema-black font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-cinema-gold/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}
                    </>
                  ) : (
                    mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta gratuita'
                  )}
                </button>
              </form>

              {/* Switch mode link */}
              <p className="text-center text-sm text-cinema-text-dim mt-6">
                {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                <button
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className="text-cinema-gold hover:text-cinema-gold-light font-medium transition-colors"
                >
                  {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-cinema-text-dim text-xs mt-6">
            Tus datos son privados y seguros · Cuenta gratuita · Sin tarjeta de crédito
          </p>
        </div>
      </main>
    </div>
  );
}
