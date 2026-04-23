import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface Props {
  fotos: File[];
  onChange: (files: File[]) => void;
}

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png'];

export const UploadFotos: React.FC<Props> = ({ fotos, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).filter(
      (f) => ALLOWED.includes(f.type) && f.size <= MAX_SIZE,
    );
    const next = [...fotos, ...incoming].slice(0, MAX_FILES);
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (idx: number) => {
    const next = fotos.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div>
      <label className="sif-label">Fotos do elevador (opcional)</label>
      <div
        className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        <Upload size={22} className="mx-auto text-white/50 mb-2" />
        <p className="text-sm text-white/70">Toque para enviar fotos</p>
        <p className="text-xs text-white/45 mt-1">JPG ou PNG · até 5MB cada · máx 5 fotos</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {fotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
          {fotos.map((f, i) => {
            const url = URL.createObjectURL(f);
            return (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                  aria-label="Remover foto"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UploadFotos;
