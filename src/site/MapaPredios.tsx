import React, { useEffect, useRef, useState } from 'react';
import loadGoogleMaps from '@/utils/googleMapsLoader';
import { getImageUrl, type BuildingStore } from '@/services/buildingStoreService';

const CENTRO_FOZ = { lat: -25.5402, lng: -54.5805 };
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

type Pino = { p: BuildingStore; el: HTMLButtonElement; ov: google.maps.OverlayView; pos: google.maps.LatLng; peso: number };

/**
 * Mapa do Google com um pino por prédio: miniatura da fachada + nome (preto quando está na lista,
 * vermelho quando selecionado). Onde os prédios ficam colados (região central), os de menos destaque
 * mostram só a foto, para nada ficar um em cima do outro. Toque no pino abre o prédio.
 */
export default function MapaPredios({ predios, naLista, selecionado, onAbrir, meuLocal, altura, foco }: {
  predios: BuildingStore[];
  naLista: Set<string>;
  selecionado?: string | null;
  onAbrir: (p: BuildingStore) => void;
  meuLocal?: { lat: number; lng: number } | null;
  altura: string;
  /** centraliza o mapa neste prédio (ex.: ao tocar no cartão de baixo) */
  foco?: string | null;
}) {
  const div = useRef<HTMLDivElement>(null);
  const mapa = useRef<google.maps.Map | null>(null);
  const pinos = useRef<Pino[]>([]);
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
        zoomControlOptions: { position: maps.ControlPosition.RIGHT_TOP },
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { elementType: 'geometry', stylers: [{ saturation: -60 }, { lightness: 8 }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9D6DC' }] },
        ],
      });
      // depois de cada movimento/zoom, reorganiza os pinos para não ficarem um em cima do outro
      mapa.current.addListener('idle', () => organizar());
      setPronto(true);
    }).catch(() => vivo && setErro(true));
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Mostra o nome só onde há espaço; nos demais fica a fotinho. Mais importantes primeiro. */
  function organizar() {
    const lista = pinos.current;
    if (!lista.length) return;
    const proj = lista[0].ov.getProjection();
    if (!proj) return;
    const colocados: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const cruza = (a: { x1: number; y1: number; x2: number; y2: number }) => colocados.some((b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1);
    [...lista].sort((a, b) => b.peso - a.peso).forEach((pn, i) => {
      const pt = proj.fromLatLngToDivPixel(pn.pos);
      if (!pt) return;
      pn.el.classList.remove('compacto');
      const w = pn.el.offsetWidth || 120, h = 40;
      const caixa = { x1: pt.x - w / 2 - 2, y1: pt.y - h, x2: pt.x + w / 2 + 2, y2: pt.y };
      if (cruza(caixa)) {
        pn.el.classList.add('compacto');
        colocados.push({ x1: pt.x - 18, y1: pt.y - h, x2: pt.x + 18, y2: pt.y });
      } else colocados.push(caixa);
      pn.el.style.zIndex = String(1000 - i);
    });
  }

  // pinos (foto + nome)
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    pinos.current.forEach((c) => c.ov.setMap(null));
    pinos.current = [];
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
      el.className = `mp-pin${on ? ' on' : ''}${sel ? ' sel' : ''}`;
      el.setAttribute('aria-label', `${p.nome}, ${reais(p.preco_base || 0)} por mês${on ? ', na sua lista' : ''}`);
      const foto = document.createElement('span');
      foto.className = 'mp-foto';
      if (p.imagem_principal) {
        const img = document.createElement('img');
        img.src = getImageUrl(p.imagem_principal) || '';
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        foto.appendChild(img);
      }
      if (on) {
        const ok = document.createElement('span');
        ok.className = 'mp-ok';
        ok.textContent = '✓';
        foto.appendChild(ok);
      }
      const nome = document.createElement('span');
      nome.className = 'mp-nome';
      nome.textContent = p.nome.trim();
      el.append(foto, nome);
      el.addEventListener('click', (e) => { e.stopPropagation(); onAbrir(p); });
      const ov = new g.OverlayView();
      ov.onAdd = function () { this.getPanes()?.overlayMouseTarget.appendChild(el); };
      ov.draw = function () {
        const pt = this.getProjection()?.fromLatLngToDivPixel(pos);
        if (pt) { el.style.left = `${pt.x}px`; el.style.top = `${pt.y}px`; }
      };
      ov.onRemove = function () { el.remove(); };
      ov.setMap(m);
      const peso = (sel ? 1e7 : 0) + (on ? 1e6 : 0) + (p.publico_estimado || 0);
      pinos.current.push({ p, el, ov, pos, peso });
    }
    // enquadra só uma vez (não pula o mapa a cada prédio adicionado)
    if (algum && !meuLocal && !ajustou.current) { m.fitBounds(limites, { top: 60, right: 30, bottom: 30, left: 30 }); ajustou.current = true; }
    // depois que os pinos desenharem, organiza
    window.setTimeout(organizar, 60);
  }, [pronto, predios, naLista, selecionado, onAbrir, meuLocal]); // eslint-disable-line react-hooks/exhaustive-deps

  // centraliza no prédio pedido
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m || !foco) return;
    const p = predios.find((x) => x.id === foco);
    if (!p?.latitude || !p.longitude) return;
    m.panTo({ lat: p.latitude, lng: p.longitude });
    if ((m.getZoom() || 14) < 15) m.setZoom(15);
  }, [pronto, foco]); // eslint-disable-line react-hooks/exhaustive-deps

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
