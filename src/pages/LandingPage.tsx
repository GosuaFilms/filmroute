import { Film, Sparkles, Trophy, Send, FileDown, ClipboardList, ArrowRight, Check } from 'lucide-react';

interface Props {
  onAccess: () => void;
}

const STEPS = [
  { n: '1', title: 'Cuéntanos tu película', text: 'Un formulario guiado de 7 pasos: datos de la obra, materiales, objetivos, festivales y presupuesto.' },
  { n: '2', title: 'El asesor IA la analiza', text: 'Cruza tu proyecto con nuestra base de festivales y redacta una estrategia pensada para esa película concreta.' },
  { n: '3', title: 'Ejecuta y haz seguimiento', text: 'Exporta el informe en PDF y registra cada envío, deadline y selección desde el mismo sitio.' },
];

const FEATURES = [
  { icon: Sparkles, title: 'Asesor de distribución con IA', text: 'Análisis DAFO, índice de distribución razonado, plan de marketing por fases y próximos pasos accionables.' },
  { icon: Trophy, title: 'Base de festivales curada', text: 'Festivales nacionales e internacionales con nivel, fechas, tasas y plataforma de inscripción, revisados por nuestro equipo.' },
  { icon: Send, title: 'Tracker de envíos', text: 'Estado de cada inscripción, tasas pagadas, deadlines y resultados. Toda la campaña de festivales en un panel.' },
  { icon: FileDown, title: 'Informe profesional en PDF', text: 'Listo para compartir con tu equipo, coproductores, agentes de ventas o instituciones.' },
  { icon: ClipboardList, title: 'Checklist de entregables', text: 'DCP, tráiler, press kit, subtítulos, derechos… sabrás qué falta y en qué orden priorizarlo.' },
  { icon: Film, title: 'Hecho por gente de cine', text: 'Desarrollado por LUR Atlantik Films a partir de la experiencia real distribuyendo cine independiente.' },
];

const PLANS = [
  { name: 'Gratis', price: '0 €', period: '', features: ['1 estrategia', 'Informe resumido', 'Base de festivales'], highlight: false },
  { name: 'Por película', price: '59 €', period: 'pago único', features: ['Informe completo con IA', 'Exportación PDF', 'Tracker de envíos 18 meses'], highlight: false },
  { name: 'Pro', price: '19 €', period: '/ mes', features: ['Estrategias ilimitadas', 'Asesor IA sin límites', 'Avisos de deadlines'], highlight: true },
  { name: 'Productora', price: '99 €', period: '/ mes', features: ['Equipo multiusuario', 'Catálogo de películas', 'Informes con tu marca'], highlight: false },
];

export function LandingPage({ onAccess }: Props) {
  return (
    <div className="min-h-screen bg-gradient-cinema text-cinema-text">
      <header className="border-b border-cinema-border bg-cinema-dark/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cinema-gold">
            <Film size={26} strokeWidth={1.5} />
            <span className="text-xl font-display font-bold tracking-wide">FilmRoute</span>
          </div>
          <button
            onClick={onAccess}
            className="text-sm font-semibold text-cinema-text border border-cinema-border rounded-lg px-4 py-2 hover:border-cinema-gold hover:text-cinema-gold transition-all"
          >
            Acceder
          </button>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-cinema-gold bg-cinema-gold/10 border border-cinema-gold/30 rounded-full px-3 py-1 mb-6">
          <Sparkles size={12} /> Asesor de distribución con inteligencia artificial
        </span>
        <h1 className="text-4xl sm:text-5xl font-display font-bold leading-tight mb-5">
          La estrategia de distribución de tu película,<br className="hidden sm:block" />
          <span className="text-cinema-gold"> en minutos y no en semanas</span>
        </h1>
        <p className="text-cinema-text-dim text-base sm:text-lg max-w-2xl mx-auto mb-8">
          FilmRoute analiza tu proyecto, elige los festivales que mejor encajan, planifica las ventanas de distribución
          y te acompaña en toda la campaña. Para cineastas independientes y productoras.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onAccess}
            className="inline-flex items-center justify-center gap-2 bg-gradient-gold text-cinema-black font-bold px-7 py-3.5 rounded-xl hover:opacity-90 transition-all shadow-xl shadow-cinema-gold/20"
          >
            Empezar ahora <ArrowRight size={18} />
          </button>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center gap-2 border border-cinema-border text-cinema-text px-7 py-3.5 rounded-xl hover:border-cinema-gold/50 transition-all"
          >
            Cómo funciona
          </a>
        </div>
      </section>

      <section id="como-funciona" className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-10">Cómo funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map(s => (
            <div key={s.n} className="bg-cinema-card border border-cinema-border rounded-2xl p-6">
              <div className="w-9 h-9 rounded-full bg-cinema-gold/15 border border-cinema-gold/40 text-cinema-gold font-bold flex items-center justify-center mb-4">{s.n}</div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-cinema-text-dim leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-3">Todo lo que necesitas para distribuir</h2>
        <p className="text-center text-cinema-text-dim mb-10">Del primer festival a la última ventana de distribución.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-cinema-card/60 border border-cinema-border rounded-2xl p-6 hover:border-cinema-gold/30 transition-all">
              <f.icon size={22} className="text-cinema-gold mb-4" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-cinema-text-dim leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-3">Planes</h2>
        <p className="text-center text-cinema-text-dim mb-10">Licencias para escuelas de cine, festivales e instituciones bajo consulta.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map(p => (
            <div
              key={p.name}
              className={`rounded-2xl p-6 border flex flex-col ${p.highlight ? 'bg-cinema-gold/10 border-cinema-gold/50' : 'bg-cinema-card border-cinema-border'}`}
            >
              {p.highlight && <span className="text-[10px] font-bold uppercase tracking-widest text-cinema-gold mb-2">Más popular</span>}
              <h3 className="font-semibold mb-1">{p.name}</h3>
              <div className="mb-5">
                <span className="text-3xl font-bold">{p.price}</span>
                {p.period && <span className="text-sm text-cinema-text-dim ml-1">{p.period}</span>}
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex gap-2 text-sm text-cinema-text-dim"><Check size={15} className="text-cinema-gold shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
              <button
                onClick={onAccess}
                className={`w-full text-sm font-semibold rounded-lg py-2.5 transition-all ${p.highlight ? 'bg-gradient-gold text-cinema-black hover:opacity-90' : 'border border-cinema-border hover:border-cinema-gold hover:text-cinema-gold'}`}
              >
                Empezar
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-cinema-gold/20 via-cinema-gold/10 to-cinema-gold/20 border border-cinema-gold/40 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-display font-bold mb-3">Tu película merece llegar a su público</h2>
          <p className="text-cinema-text-dim mb-6">Genera tu primera estrategia de distribución hoy.</p>
          <button
            onClick={onAccess}
            className="inline-flex items-center gap-2 bg-gradient-gold text-cinema-black font-bold px-7 py-3.5 rounded-xl hover:opacity-90 transition-all"
          >
            Empezar ahora <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer className="border-t border-cinema-border py-8 text-center">
        <p className="text-cinema-text-dim text-xs">FilmRoute · Una herramienta de LUR Atlantik Films</p>
      </footer>
    </div>
  );
}
