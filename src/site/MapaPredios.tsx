import React, { useEffect, useRef, useState } from 'react';
import loadGoogleMaps from '@/utils/googleMapsLoader';
import type { BuildingStore } from '@/services/buildingStoreService';

const CENTRO_FOZ = { lat: -25.5402, lng: -54.5805 };
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/**
 * Mapa do Google com uma etiqueta de preço por prédio (vermelha; preta quando está na lista).
 * Clique na etiqueta abre o prédio. Opcional: marcador do endereço do cliente.
 */
export default function MapaPredios({ predios, naLista, selecionado, onAbrir, meuLocal, altura }: {
  predios: BuildingStore[];
  naLista: Set<string>;
  selecionado?: string | null;
  onAbrir: (p: BuildingStore) => void;
  meuLocal?: { lat: number; lng: number } | null;
  altura: string;
}) {
  const div = useRef<HTMLDivElement>(null);
  const mapa = useRef<google.maps.Map | null>(null);
  const camadas = useRef<google.maps.OverlayView[]>([]);
  const eu = useRef<google.maps.Marker | null>(null);
  const [erro, setErro] = useState(false);
  const [pronto, setPronto] = useState(false);
  const ajustou = useRef(false);

  useEffect(() => {
    let vivo = true;
    loadGoogleMaps().then((maps) => {
      if (!vivo || !div.current) return;
      mapa.current = new maps.Map(div.current, {
        center: CENTRO_FOZ, zoom: 14, disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy', clickableIcons: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { elementType: 'geometry', stylers: [{ saturation: -60 }, { lightness: 8 }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9D6DC' }] },
        ],
      });
      setPronto(true);
    }).catch(() => vivo && setErro(true));
    return () => { vivo = false; };
  }, []);

  // etiquetas de preço
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    camadas.current.forEach((c) => c.setMap(null));
    camadas.current = [];
    const g = (window as any).google.maps as typeof google.maps;
    const limites = new g.LatLngBounds();
    let algum = false;
    for (const p of predios) {
      if (!p.latitude || !p.longitude) continue;
      const pos = new g.LatLng(p.latitude, p.longitude);
      limites.extend(pos); algum = true;
      const on = naLista.has(p.id);
      const sel = selecionado === p.id;
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `${p.nome}, ${reais(p.preco_base || 0)} por mês`);
      el.textContent = on ? `✓ ${reais(p.preco_base || 0)}` : reais(p.preco_base || 0);
      el.style.cssText = `position:absolute;transform:translate(-50%,-100%);white-space:nowrap;min-width:0;min-height:0;padding:6px 10px;border-radius:999px;border:2px solid #fff;font:800 13px Manrope,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 16px -6px rgba(0,0,0,.45);background:${on ? '#0B0B0D' : '#EA251D'};color:#fff;${sel ? 'transform:translate(-50%,-100%) scale(1.15);z-index:2;' : ''}`;
      el.title = p.nome;
      el.addEventListener('click', (e) => { e.stopPropagation(); onAbrir(p); });
      const ov = new g.OverlayView();
      ov.onAdd = function () { this.getPanes()?.overlayMouseTarget.appendChild(el); };
      ov.draw = function () {
        const pt = this.getProjection()?.fromLatLngToDivPixel(pos);
        if (pt) { el.style.left = `${pt.x}px`; el.style.top = `${pt.y}px`; }
      };
      ov.onRemove = function () { el.remove(); };
      ov.setMap(m);
      camadas.current.push(ov);
    }
    // enquadra só uma vez (não pula o mapa a cada prédio adicionado)
    if (algum && !meuLocal && !ajustou.current) { m.fitBounds(limites, 48); ajustou.current = true; }
  }, [pronto, predios, naLista, selecionado, onAbrir, meuLocal]);

  // endereço do cliente
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    const g = (window as any).google.maps as typeof google.maps;
    const tinha = !!eu.current;
    eu.current?.setMap(null);
    eu.current = null;
    if (!meuLocal) {
      // endereço limpo: volta a mostrar todos os prédios
      if (tinha) {
        const b = new g.LatLngBounds();
        predios.forEach((p) => p.latitude && p.longitude && b.extend({ lat: p.latitude, lng: p.longitude }));
        if (!b.isEmpty()) m.fitBounds(b, 48);
      }
      return;
    }
    eu.current = new g.Marker({
      position: meuLocal, map: m, title: 'Seu negócio', zIndex: 10,
      icon: { path: g.SymbolPath.CIRCLE, scale: 9, fillColor: '#0B0B0D', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
    });
    m.panTo(meuLocal); m.setZoom(15);
  }, [pronto, meuLocal]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', height: altura, borderRadius: 22, overflow: 'hidden', background: '#E2E0DA' }}>
      <div ref={div} style={{ position: 'absolute', inset: 0 }} aria-label="Mapa dos prédios da EXA em Foz do Iguaçu" />
      {erro && <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, color: '#5A5852', fontSize: 15 }}>Não consegui abrir o mapa agora.</p>}
    </div>
  );
}
