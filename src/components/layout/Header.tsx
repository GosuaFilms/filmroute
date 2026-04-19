import { Film, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name
    ?? user?.email?.split('@')[0]
    ?? 'Usuario';

  return (
    <header className="border-b border-cinema-border bg-cinema-dark/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
        <div className="flex items-center gap-2 text-cinema-gold">
          <Film size={28} strokeWidth={1.5} />
          <span className="text-xl font-display font-bold tracking-wide">FilmRoute</span>
        </div>
        <div className="h-5 w-px bg-cinema-border mx-2" />
        <p className="text-sm text-cinema-text-dim hidden sm:block">
          Estrategia de Distribución Cinematográfica Independiente
        </p>

        {/* User info + logout */}
        {user && (
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-cinema-card border border-cinema-border rounded-full px-3 py-1.5">
              <User size={13} className="text-cinema-gold" />
              <span className="text-xs text-cinema-text-dim max-w-[140px] truncate">{displayName}</span>
            </div>
            <button
              onClick={signOut}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 text-cinema-text-dim hover:text-cinema-gold transition-colors text-xs px-3 py-1.5 rounded-full border border-cinema-border hover:border-cinema-gold/40"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
