/*
 * EXA · réplica da tela do elevador numa TV box (só com ?tela=1).
 * Medido no Zeta Plus (Android 10, Chrome 74): "PIPELINE_ERROR_DECODE: video decoder reinitialization failed".
 * O mesmo <video> troca de arquivo a cada anúncio (1920×1080, 608×1080, 1310×1080…) e o Chrome tenta reaproveitar o
 * decodificador de hardware; no box isso falha e todos os anúncios passam a ser pulados (tela preta).
 * Aqui: antes de cada troca o player do anúncio é desmontado (decodificador novo a cada vídeo) e o mascote animado,
 * que abre mais um decodificador por cima, fica desligado na TV. Nada muda no NUC nem no navegador do síndico.
 */
(function () {
  try {
    if (!/[?&]tela=1(&|$)/.test(location.search)) return;
    window.__mascote = window.__mascote || { desligado: true }; // mascote.js sai sem fazer nada quando isso já existe

    var desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    if (!desc || !desc.set || !desc.get) return;
    var preparar = function () {
      var v = document.getElementById('video-propaganda');
      if (!v || v.__exaTroca) return;
      v.__exaTroca = true;
      Object.defineProperty(v, 'src', {
        configurable: true,
        get: function () { return desc.get.call(v); },
        set: function (u) {
          try {
            if (desc.get.call(v)) { v.pause(); v.removeAttribute('src'); v.load(); }
          } catch (e) { /* segue */ }
          desc.set.call(v, u);
        }
      });
    };
    // roda antes do iniciar() do propagandas.js (este script está no <head>, o listener dele é registrado antes)
    document.addEventListener('DOMContentLoaded', preparar);
  } catch (e) { /* segue sem o ajuste */ }
})();
