import { useEffect, useRef, useState } from 'react';
import { ImagePlus, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { ACCEPTED_POSTER_TYPES, MAX_POSTER_MB, deletePoster, getPosterUrl, uploadPoster } from '../../lib/posters';

interface Props {
  posterPath?: string;
  onChange: (path: string | undefined) => void;
}

export function PosterUpload({ posterPath, onChange }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (posterPath) {
      getPosterUrl(posterPath).then(u => { if (!cancelled) setUrl(u); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [posterPath]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const path = await uploadPoster(file);
      if (posterPath) deletePoster(posterPath).catch(() => {});
      onChange(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir el cartel.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleRemove() {
    if (posterPath) deletePoster(posterPath).catch(() => {});
    onChange(undefined);
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_POSTER_TYPES.join(',')}
      className="hidden"
      onChange={e => handleFile(e.target.files?.[0])}
    />
  );

  if (posterPath) {
    return (
      <div className="flex gap-5 items-start">
        <div className="w-32 aspect-[2/3] rounded-lg overflow-hidden border border-cinema-border bg-cinema-dark shrink-0 shadow-lg shadow-black/40">
          {url ? (
            <img src={url} alt="Cartel de la película" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full animate-pulse bg-cinema-border/40" />
          )}
        </div>
        <div className="space-y-3 pt-1">
          <p className="text-sm text-cinema-text">Cartel subido</p>
          <p className="text-xs text-cinema-text-dim max-w-xs">
            El asesor IA lo analizará como herramienta de venta y aparecerá en la portada del dossier PDF.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-xs border border-cinema-border rounded-lg px-3 py-1.5 text-cinema-text hover:border-cinema-gold hover:text-cinema-gold transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={uploading ? 'animate-spin' : ''} /> {uploading ? 'Subiendo…' : 'Cambiar'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-xs border border-cinema-border rounded-lg px-3 py-1.5 text-cinema-text-dim hover:border-red-400/50 hover:text-red-400 transition-all disabled:opacity-50"
            >
              <Trash2 size={13} /> Quitar
            </button>
          </div>
          {error && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle size={12} /> {error}</p>}
        </div>
        {input}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
        disabled={uploading}
        className={`w-full border-2 border-dashed rounded-xl px-6 py-8 flex flex-col items-center gap-2 transition-all ${
          dragOver ? 'border-cinema-gold bg-cinema-gold/5' : 'border-cinema-border hover:border-cinema-gold/50'
        } disabled:opacity-60`}
      >
        {uploading ? (
          <svg className="animate-spin w-6 h-6 text-cinema-gold" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <ImagePlus size={26} className="text-cinema-gold" />
        )}
        <span className="text-sm text-cinema-text font-medium">{uploading ? 'Subiendo cartel…' : 'Sube el cartel de la película'}</span>
        <span className="text-xs text-cinema-text-dim">Arrastra la imagen aquí o haz clic · JPG, PNG o WebP · máx. {MAX_POSTER_MB} MB</span>
      </button>
      {error && <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5"><AlertCircle size={12} /> {error}</p>}
      {input}
    </div>
  );
}
