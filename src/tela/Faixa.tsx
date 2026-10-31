/**
 * Uma área de vídeo do layout. Dois <video> se revezam: enquanto um toca, o outro já carrega o próximo,
 * então a troca é sem tela preta. Vídeo travado (8 s sem andar), com erro ou sem fim é pulado e anotado.
 * Itens que não são vídeo (câmera, notícia no H6) são desenhados pelo layout via `especial`.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ItemFaixa } from './motor';
import { fonte, miniatura, aoMudar } from './cache';
import { marcarTocando, registrarErro, registrarExibicao } from './registro';

export interface InfoFaixa { atual: ItemFaixa | null; pos: number; dur: number; inicio: number; itens: ItemFaixa[] }

type Props = {
  itens: ItemFaixa[];
  /** proporção da área: decide se o vídeo cobre ou se fica inteiro com fundo desfocado */
  area: '16:9' | '9:16' | '6:5';
  style?: React.CSSProperties;
  className?: string;
  barra?: boolean | 'fina';
  /** só a faixa principal informa "o que está tocando" ao servidor */
  principal?: boolean;
  onInfo?: (i: InfoFaixa) => void;
  especial?: (it: ItemFaixa, fim: (falhou?: boolean) => void) => React.ReactNode;
  vazio?: React.ReactNode;
  children?: React.ReactNode;
};

const casa = (area: Props['area'], f: string) =>
  (area === '16:9' && f === 'h169') || (area === '9:16' && f === 'v') || (area === '6:5' && (f === 'h65' || f === 'q'));

export default function Faixa({ itens, area, style, className, barra = true, principal, onInfo, especial, vazio, children }: Props) {
  const refs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  const itensRef = useRef(itens);
  itensRef.current = itens;
  const [pos, setPos] = useState(0);
  const [atual, setAtual] = useState<ItemFaixa | null>(itens[0] || null);
  const [ativo, setAtivo] = useState(0);
  const [dur, setDur] = useState(0);
  const [ciclo, setCiclo] = useState(0); // muda a cada item (reinicia a barra)
  const [, forcar] = useState(0);
  const inicio = useRef(Date.now());
  const falhasSeguidas = useRef(0);
  const atualRef = useRef(atual);
  atualRef.current = atual;
  const posRef = useRef(pos);
  posRef.current = pos;
  const ativoRef = useRef(ativo);
  ativoRef.current = ativo;

  useEffect(() => aoMudar(() => forcar((x) => x + 1)), []);

  // lista mudou (novo estado do servidor): se não estava tocando nada, começa
  useEffect(() => {
    if (!atualRef.current && itens.length) { setPos(0); setAtual(itens[0]); setCiclo((c) => c + 1); inicio.current = Date.now(); }
    if (!itens.length) setAtual(null);
  }, [itens]);

  const proximoDe = useCallback((p: number) => {
    const l = itensRef.current;
    if (!l.length) return { p: 0, it: null as ItemFaixa | null };
    const cur = atualRef.current;
    let base = p;
    if (cur) { const i = l.findIndex((x) => x.k === cur.k); if (i >= 0) base = i; }
    const np = (base + 1) % l.length;
    return { p: np, it: l[np] };
  }, []);

  const avancar = useCallback((motivo: 'fim' | 'falha' = 'fim') => {
    const cur = atualRef.current;
    const seg = (Date.now() - inicio.current) / 1000;
    if (cur && motivo === 'fim') {
      falhasSeguidas.current = 0;
      if (cur.tipo === 'video') registrarExibicao(cur.v.tipo, cur.v.pedido_id, cur.v.video_id, seg);
      else registrarExibicao(cur.tipo, null, null, seg);
    }
    if (motivo === 'falha') falhasSeguidas.current++;
    const { p, it } = proximoDe(posRef.current);
    const seguir = () => {
      if (it && it.tipo === 'video') {
        const a = ativoRef.current;
        const meu = refs[a].current;
        const outro = refs[1 - a].current;
        // depois de câmera/notícia o próximo já foi carregado no próprio <video> ativo
        if (cur?.tipo !== 'video' && meu?.dataset.k === it.k) { /* mantém */ }
        // o próximo já está carregado no outro <video>: troca sem tela preta
        else if (outro?.dataset.k === it.k) setAtivo(1 - a);
        else if (meu) meu.dataset.k = '';
      }
      setPos(p); setAtual(it); setCiclo((c) => c + 1); setDur(0); inicio.current = Date.now();
    };
    // tudo falhando (sem internet e sem cache): respira 10 s antes de tentar de novo
    if (falhasSeguidas.current >= Math.max(3, itensRef.current.length)) { falhasSeguidas.current = 0; setTimeout(seguir, 10000); }
    else seguir();
  }, [proximoDe]);

  // tocar o item atual
  useEffect(() => {
    if (!atual) return;
    if (principal) marcarTocando(atual.tipo === 'video'
      ? { tipo: atual.v.tipo, titulo: atual.v.titulo, cliente: atual.v.cliente, pedido_id: atual.v.pedido_id, formato: atual.v.formato }
      : { tipo: atual.tipo, titulo: atual.tipo === 'camera' ? atual.cam.nome : atual.n.titulo });
    if (atual.tipo !== 'video') {
      refs.forEach((r) => r.current?.pause());
      setDur(atual.dur);
      const t = setTimeout(() => avancar('fim'), atual.dur * 1000);
      preparar();
      return () => clearTimeout(t);
    }
    const el = refs[ativo].current;
    const outro = refs[1 - ativo].current;
    if (!el) return;
    const v = atual.v;
    const src = fonte(v.url);
    let parado = 0, ultimoT = -1, acabou = false;
    const ok = () => { falhasSeguidas.current = 0; };
    const fim = (m: 'fim' | 'falha', erro?: string) => { if (acabou) return; acabou = true; if (erro) registrarErro(`${v.cliente || v.titulo}: ${erro}`); avancar(m); };
    const meta = () => {
      const d = (el.duration || v.duracao || 15) - (v.trim_inicio || 0) - (v.trim_fim || 0);
      setDur(Math.max(1, d));
      if (v.trim_inicio && el.currentTime < v.trim_inicio - 0.3) { try { el.currentTime = v.trim_inicio; } catch { /* */ } }
    };
    const tempo = () => {
      if (v.trim_fim && el.duration && el.currentTime >= el.duration - v.trim_fim) fim('fim');
    };
    const onEnded = () => fim('fim');
    const onError = () => fim('falha', `erro ao tocar (${el.error?.code || '?'})`);
    el.addEventListener('loadedmetadata', meta);
    el.addEventListener('timeupdate', tempo);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    el.addEventListener('playing', ok);
    if (el.dataset.k !== atual.k || !el.src) {
      el.dataset.k = atual.k;
      el.src = src;
      el.load();
    } else if (el.readyState >= 1) meta();
    if (el.readyState >= 1 && !v.trim_inicio) { try { if (el.currentTime > 0.5) el.currentTime = 0; } catch { /* */ } }
    el.muted = true;
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch((e) => { if (String(e?.name) !== 'AbortError') fim('falha', `play: ${e?.name || e}`); });
    if (outro) { outro.pause(); }
    // vigia: travou (8 s sem andar) ou passou muito do tempo
    const vigia = setInterval(() => {
      if (el.paused && el.readyState >= 2) { el.play().catch(() => {}); }
      if (Math.abs(el.currentTime - ultimoT) < 0.05) parado += 2; else parado = 0;
      ultimoT = el.currentTime;
      if (parado >= 10) fim('falha', 'travado 10 s');
      const max = (v.duracao || el.duration || 60) + 20;
      if ((Date.now() - inicio.current) / 1000 > max) fim('falha', 'passou do tempo');
    }, 2000);
    const pre = setTimeout(preparar, 1200);
    return () => {
      acabou = true;
      clearInterval(vigia); clearTimeout(pre);
      el.removeEventListener('loadedmetadata', meta);
      el.removeEventListener('timeupdate', tempo);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
      el.removeEventListener('playing', ok);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciclo, ativo]);

  /** carrega o próximo vídeo no <video> que está livre */
  function preparar() {
    const l = itensRef.current;
    if (!l.length) return;
    const cur = atualRef.current;
    let i = cur ? l.findIndex((x) => x.k === cur.k) : -1;
    for (let n = 0; n < l.length; n++) {
      i = (i + 1) % l.length;
      const it = l[i];
      if (it.tipo !== 'video') { if (n === 0) continue; else break; }
      const livre = cur?.tipo === 'video' ? refs[1 - ativoRef.current].current : refs[ativoRef.current].current;
      if (!livre || livre.dataset.k === it.k) return;
      if (cur?.tipo !== 'video') {
        // durante câmera/notícia: o <video> ativo fica livre e já recebe o próximo
        livre.dataset.k = it.k; livre.src = fonte(it.v.url); livre.preload = 'auto'; livre.load();
        return;
      }
      livre.dataset.k = it.k;
      livre.src = fonte(it.v.url);
      livre.preload = 'auto';
      livre.load();
      return;
    }
  }

  const onInfoRef = useRef(onInfo);
  onInfoRef.current = onInfo;
  useEffect(() => { onInfoRef.current?.({ atual, pos, dur, inicio: inicio.current, itens }); }, [atual, pos, dur, itens]);

  const v = atual?.tipo === 'video' ? atual.v : null;
  const cobre = v ? casa(area, v.formato) : true;
  const mini = v ? miniatura(v.url) : '';

  return (
    <div className={`faixa ${className || ''}`} style={style}>
      {mini && !cobre && <img className="fundo-desfocado on" src={mini} alt="" />}
      {refs.map((r, i) => (
        <video key={i} ref={r} className={`v ${i === ativo && v ? 'on' : ''} ${cobre ? 'cobrir' : 'conter'}`} muted playsInline preload="auto" disablePictureInPicture />
      ))}
      {atual && atual.tipo !== 'video' && especial && <div className="especial" key={atual.k}>{especial(atual, (falhou) => { if (atualRef.current?.k === atual.k) avancar(falhou ? 'falha' : 'fim'); })}</div>}
      {!atual && vazio}
      {barra && dur > 0 && atual && (
        <div className={`barra ${barra === 'fina' ? 'fina' : ''}`}><i key={ciclo} style={{ animationDuration: `${dur}s` }} /></div>
      )}
      {children}
    </div>
  );
}
