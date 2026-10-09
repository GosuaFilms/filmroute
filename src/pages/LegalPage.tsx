import { Film, ArrowLeft } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

// BORRADOR pendiente de revisión jurídica. Rellenar estos datos antes de anunciar el servicio.
const TITULAR = {
  razonSocial: 'LUR Atlantik Films S.L.',
  nif: 'B22922751',
  domicilio: 'Calle Bailén 1, 3.º 6.ª, 48003 Bilbao (Bizkaia), España',
  registro: 'Inscrita en el Registro Mercantil de Bizkaia, hoja BI-85847, inscripción 1.ª (folio electrónico), de 10 de septiembre de 2025',
  email: 'info@luratlantik.com',
  regionSupabase: '[PENDIENTE: región del proyecto Supabase, p. ej. UE (Fráncfort)]',
};

export const TERMS_VERSION = '2026-10-09';
const ULTIMA_ACTUALIZACION = '9 de octubre de 2026';

export type LegalSlug = 'aviso-legal' | 'privacidad' | 'terminos';

export function legalSlugFromPath(pathname: string): LegalSlug | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  return slug === 'aviso-legal' || slug === 'privacidad' || slug === 'terminos' ? slug : null;
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-display font-bold text-cinema-gold mt-8 mb-3">{children}</h2>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-sm text-cinema-text-dim leading-relaxed mb-3">{children}</p>;
}

function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 mb-3">
      {items.map((it, i) => <li key={i} className="text-sm text-cinema-text-dim leading-relaxed">{it}</li>)}
    </ul>
  );
}

function AvisoLegal() {
  return (
    <>
      <P>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
        Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de FilmRoute
        (www.filmroute.ai):
      </P>
      <UL items={[
        <>Titular: {TITULAR.razonSocial}</>,
        <>NIF: {TITULAR.nif}</>,
        <>Domicilio: {TITULAR.domicilio}</>,
        <>Registro: {TITULAR.registro}</>,
        <>Contacto: {TITULAR.email}</>,
      ]} />
      <H2>Objeto</H2>
      <P>
        FilmRoute es una herramienta en línea que ayuda a cineastas y productoras a planificar la distribución de
        sus obras audiovisuales mediante un formulario guiado, un asesor basado en inteligencia artificial, una base
        de datos de festivales y un sistema de seguimiento de inscripciones.
      </P>
      <H2>Propiedad intelectual e industrial</H2>
      <P>
        El software, el diseño, los textos propios, la base de datos de festivales y la marca FilmRoute pertenecen
        al titular o a sus licenciantes. Queda prohibida su reproducción, distribución o transformación sin
        autorización, salvo el uso normal del servicio. Los contenidos que introduce cada usuario siguen siendo de
        su titularidad, según se detalla en los Términos de uso.
      </P>
      <H2>Responsabilidad</H2>
      <P>
        La información sobre festivales, plataformas y plazos se ofrece con carácter orientativo y puede cambiar sin
        previo aviso. Recomendamos verificarla siempre en las fuentes oficiales de cada festival o plataforma.
      </P>
      <H2>Legislación aplicable</H2>
      <P>Este aviso se rige por la legislación española.</P>
    </>
  );
}

function Privacidad() {
  return (
    <>
      <H2>1. Responsable del tratamiento</H2>
      <UL items={[
        <>{TITULAR.razonSocial} — NIF {TITULAR.nif}</>,
        <>Domicilio: {TITULAR.domicilio}</>,
        <>Contacto para cuestiones de privacidad: {TITULAR.email}</>,
      ]} />

      <H2>2. Qué datos tratamos</H2>
      <UL items={[
        <><strong className="text-cinema-text">Datos de cuenta:</strong> nombre, email y contraseña (almacenada cifrada; nunca tenemos acceso a ella en claro).</>,
        <><strong className="text-cinema-text">Datos de tus proyectos:</strong> la información que introduces sobre tus películas (sinopsis, equipo, materiales, presupuesto, objetivos, festivales) y los informes generados.</>,
        <><strong className="text-cinema-text">Seguimiento de envíos:</strong> festivales, fechas, estados, tasas y notas que registras.</>,
        <><strong className="text-cinema-text">Datos de uso del asesor IA:</strong> fecha de cada análisis generado, para aplicar los límites de uso.</>,
        <><strong className="text-cinema-text">Datos técnicos:</strong> dirección IP, navegador y registros del servidor necesarios para el funcionamiento y la seguridad del servicio.</>,
      ]} />
      <P>
        No pidas ni introduzcas en FilmRoute datos personales de terceros que no sean necesarios (por ejemplo, datos
        de contacto privados de miembros del equipo). Si lo haces, eres responsable de contar con base legal para ello.
      </P>

      <H2>3. Para qué los usamos y base legal</H2>
      <UL items={[
        <>Crear y gestionar tu cuenta y prestarte el servicio, incluido generar estrategias con el asesor IA — <em>ejecución del contrato</em> (art. 6.1.b RGPD).</>,
        <>Enviarte emails necesarios del servicio (confirmación de cuenta, recuperación de contraseña, avisos relevantes) — <em>ejecución del contrato</em>.</>,
        <>Garantizar la seguridad, prevenir abusos y aplicar límites de uso — <em>interés legítimo</em> (art. 6.1.f RGPD).</>,
        <>Cumplir obligaciones legales — <em>obligación legal</em> (art. 6.1.c RGPD).</>,
      ]} />
      <P>No enviamos comunicaciones comerciales sin tu consentimiento previo y no vendemos tus datos.</P>

      <H2>4. Inteligencia artificial</H2>
      <P>
        Cuando pides un análisis, los datos de tu proyecto se envían al proveedor de IA Anthropic (modelos Claude)
        para generar la estrategia. Según las condiciones comerciales de Anthropic para su API, estos datos no se
        utilizan para entrenar sus modelos. No se toman decisiones con efectos jurídicos sobre ti basadas únicamente
        en tratamientos automatizados: el informe es una recomendación orientativa que tú decides si sigues.
      </P>

      <H2>5. Proveedores (encargados del tratamiento)</H2>
      <UL items={[
        <><strong className="text-cinema-text">Supabase</strong> — base de datos y autenticación. Región: {TITULAR.regionSupabase}.</>,
        <><strong className="text-cinema-text">Vercel</strong> — alojamiento web y funciones del servidor (EE. UU., con infraestructura en la UE).</>,
        <><strong className="text-cinema-text">Anthropic</strong> — generación de análisis con IA (EE. UU.).</>,
        <><strong className="text-cinema-text">Resend</strong> — envío de emails del servicio (envío desde la región UE, Irlanda).</>,
      ]} />
      <P>
        Algunos de estos proveedores están establecidos en Estados Unidos. Las transferencias internacionales se
        amparan en el Marco de Privacidad de Datos UE-EE. UU. y/o en las cláusulas contractuales tipo aprobadas por la
        Comisión Europea.
      </P>

      <H2>6. Cuánto tiempo conservamos los datos</H2>
      <P>
        Mientras mantengas tu cuenta. Si la eliminas, borraremos tus datos en un plazo máximo de 30 días, salvo los
        que debamos conservar bloqueados por obligación legal durante los plazos de prescripción aplicables. Los
        registros técnicos se conservan durante periodos cortos según la configuración de cada proveedor.
      </P>

      <H2>7. Tus derechos</H2>
      <P>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y
        portabilidad escribiendo a {TITULAR.email}, indicando el email de tu cuenta. Si consideras que no hemos
        atendido correctamente tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos
        (www.aepd.es).
      </P>

      <H2>8. Cookies y almacenamiento local</H2>
      <P>
        FilmRoute no utiliza cookies publicitarias ni de analítica de terceros. Solo usa almacenamiento local del
        navegador estrictamente necesario: mantener tu sesión iniciada y guardar el borrador del formulario mientras
        lo rellenas. Por ser imprescindibles para el servicio, no requieren consentimiento.
      </P>

      <H2>9. Seguridad</H2>
      <P>
        Aplicamos medidas técnicas y organizativas razonables: conexiones cifradas (HTTPS), contraseñas cifradas,
        control de acceso por usuario en la base de datos (cada usuario solo puede ver sus propios proyectos) y
        claves de proveedores guardadas como secretos en el servidor.
      </P>

      <H2>10. Cambios en esta política</H2>
      <P>Si hacemos cambios relevantes, te avisaremos por email o dentro de la aplicación.</P>
    </>
  );
}

function Terminos() {
  return (
    <>
      <H2>1. Qué es FilmRoute</H2>
      <P>
        FilmRoute es un servicio de {TITULAR.razonSocial} que ayuda a planificar la distribución de obras
        audiovisuales. Al crear una cuenta aceptas estos Términos y la Política de privacidad.
      </P>

      <H2>2. Cuenta</H2>
      <UL items={[
        'Debes ser mayor de 18 años o actuar en nombre de una empresa o entidad con capacidad para obligarse.',
        'Eres responsable de la veracidad de los datos y de mantener tu contraseña en secreto.',
        'Avísanos si detectas un uso no autorizado de tu cuenta.',
      ]} />

      <H2>3. Fase beta y precios</H2>
      <P>
        FilmRoute se ofrece actualmente en fase beta, de forma gratuita y con límites de uso (por ejemplo, un número
        máximo de análisis con IA al día). Podremos introducir planes de pago; te informaremos antes y nunca se te
        cobrará nada sin que lo aceptes expresamente.
      </P>

      <H2>4. Naturaleza orientativa del asesor IA</H2>
      <UL items={[
        'Los informes se generan automáticamente con inteligencia artificial a partir de los datos que introduces y de nuestra base de festivales.',
        'Son recomendaciones orientativas: pueden contener errores, omisiones o información desactualizada (plazos, tasas, requisitos de estreno).',
        'No garantizan selecciones en festivales, ventas, acuerdos ni ingresos.',
        'No sustituyen el asesoramiento profesional jurídico, fiscal o financiero. Verifica siempre los requisitos en las fuentes oficiales.',
      ]} />

      <H2>5. Tu contenido</H2>
      <P>
        Los datos y textos que introduces sobre tus proyectos son tuyos. Nos concedes únicamente la autorización
        necesaria para almacenarlos y procesarlos (incluido su envío al proveedor de IA) con el fin de prestarte el
        servicio. No los publicaremos ni los cederemos a terceros con otros fines. Los informes generados para ti
        puedes usarlos libremente.
      </P>

      <H2>6. Uso aceptable</H2>
      <UL items={[
        'No uses el servicio para fines ilícitos ni introduzcas contenidos que vulneren derechos de terceros.',
        'No intentes eludir los límites de uso, acceder a datos de otros usuarios ni interferir en el funcionamiento del servicio.',
        'No extraigas de forma masiva ni automatizada la base de datos de festivales ni copies el servicio.',
      ]} />
      <P>Podemos suspender o cancelar cuentas que incumplan estas normas.</P>

      <H2>7. Disponibilidad y responsabilidad</H2>
      <P>
        Trabajamos para que el servicio esté disponible y funcione correctamente, pero no podemos garantizar que
        esté libre de interrupciones o errores. En la medida permitida por la ley, no respondemos de decisiones
        tomadas a partir de los informes ni de daños indirectos o lucro cesante. Nada en estos Términos limita los
        derechos que te reconoce la normativa de consumidores y usuarios.
      </P>

      <H2>8. Baja</H2>
      <P>
        Puedes dejar de usar FilmRoute y solicitar la eliminación de tu cuenta en cualquier momento escribiendo a{' '}
        {TITULAR.email}.
      </P>

      <H2>9. Cambios</H2>
      <P>
        Podemos actualizar estos Términos. Si los cambios son relevantes te avisaremos con antelación; si continúas
        usando el servicio después, se entenderá que los aceptas.
      </P>

      <H2>10. Ley aplicable y jurisdicción</H2>
      <P>
        Estos Términos se rigen por la legislación española. Si eres consumidor, serán competentes los juzgados de tu
        domicilio. En otro caso, los de {TITULAR.domicilio}.
      </P>
    </>
  );
}

const DOCS: Record<LegalSlug, { title: string; body: ComponentType }> = {
  'aviso-legal': { title: 'Aviso legal', body: AvisoLegal },
  privacidad: { title: 'Política de privacidad', body: Privacidad },
  terminos: { title: 'Términos de uso', body: Terminos },
};

export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      <a href="/aviso-legal" className="hover:text-cinema-gold transition-colors">Aviso legal</a>
      <span className="mx-2">·</span>
      <a href="/privacidad" className="hover:text-cinema-gold transition-colors">Privacidad</a>
      <span className="mx-2">·</span>
      <a href="/terminos" className="hover:text-cinema-gold transition-colors">Términos</a>
    </span>
  );
}

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = DOCS[slug];
  const Body = doc.body;
  return (
    <div className="min-h-screen bg-gradient-cinema text-cinema-text">
      <header className="border-b border-cinema-border bg-cinema-dark/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-cinema-gold">
            <Film size={24} strokeWidth={1.5} />
            <span className="text-lg font-display font-bold tracking-wide">FilmRoute</span>
          </a>
          <a href="/" className="text-sm text-cinema-text-dim hover:text-cinema-text flex items-center gap-1 transition-colors">
            <ArrowLeft size={14} /> Volver
          </a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-display font-bold mb-2">{doc.title}</h1>
        <p className="text-xs text-cinema-text-dim mb-6">Última actualización: {ULTIMA_ACTUALIZACION}</p>
        <Body />
      </main>
      <footer className="border-t border-cinema-border py-8 text-center text-xs text-cinema-text-dim">
        <LegalLinks />
      </footer>
    </div>
  );
}
