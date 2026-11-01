/**
 * Compatibilidade com o navegador antigo de TV box / player IPTV (Android 7–9 com WebView parado no
 * Chrome 5x–7x). A sintaxe é rebaixada no build (bundle "legado" do /tela); aqui entram só as funções
 * que esses navegadores não têm e o player usa. Tudo condicional: em navegador novo não faz nada.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const g: any = typeof window !== 'undefined' ? window : {};
const O: any = Object;

if (!O.entries) O.entries = (o: any) => Object.keys(o).map((k) => [k, o[k]]);
if (!O.values) O.values = (o: any) => Object.keys(o).map((k) => o[k]);
if (!O.fromEntries) O.fromEntries = (it: any) => { const r: any = {}; Array.from(it as any[]).forEach((p: any) => { r[p[0]] = p[1]; }); return r; };

const PP: any = Promise.prototype;
if (!PP.finally) {
  PP.finally = function (this: Promise<unknown>, f: () => void) {
    return this.then((v) => Promise.resolve(f()).then(() => v), (e) => Promise.resolve(f()).then(() => { throw e; }));
  };
}

const SP: any = String.prototype;
if (!SP.padStart) {
  SP.padStart = function (this: string, n: number, c = ' ') {
    let s = String(this);
    while (s.length < n) s = String(c) + s;
    return s.slice(-Math.max(n, String(this).length));
  };
}
if (!SP.replaceAll) SP.replaceAll = function (this: string, a: string, b: string) { return this.split(a).join(b); };

const AP: any = Array.prototype;
if (!AP.flat) AP.flat = function (this: any[]) { return [].concat(...this); };

// AbortController (Chrome 66): sem ele o fetch só não é cancelado no tempo limite
if (typeof g.AbortController === 'undefined') {
  g.AbortController = function (this: any) { this.signal = { aborted: false, addEventListener() {}, removeEventListener() {} }; this.abort = () => { this.signal.aborted = true; }; };
}

if (typeof g.queueMicrotask !== 'function') g.queueMicrotask = (f: () => void) => { Promise.resolve().then(f); };
if (typeof g.globalThis === 'undefined') g.globalThis = g;

export {};
