// scripts/propagandas.js - Versão Otimizada para Hardware Fraco (Sem Preloading)
let playlist = [];
let currentIdx = -1;
let videoElement = null;
let lastPlaylistLoad = 0;
let qrElement = null;
let screenName = "S/N";
let clienteId = "0";
const PLAYLIST_CACHE_TIME = 5 * 60 * 1000; // 5 minutos

let backendUrl = "";
// v22: ordem da playlist da EXA (a escolha de 1 video por pedido continua a mesma do sistema)
// Rodada: a cada 3 horizontais entra 1 vertical premium; a rodada fecha com 1 editorial
// (Brasil -> Foz -> Curiosidades) e mais 1 vertical. Rodizio justo: nenhum video repete
// antes de todos os outros do mesmo tipo terem passado, inclusive na virada do ciclo.
const EXA_EDITORIAIS = [
    "c08f3154-e0dc-4c39-b8a2-721d8acdde7f", // Noticias Brasil
    "9cb8da99-ddb3-491c-b58c-63871eadc4cb", // Noticias Foz do Iguacu
    "7a4dc868-0ecd-4969-a1ec-5589d399b7c4", // Curiosidades
];
function ordenarPlaylistEXA(lista) {
    try {
        if (!Array.isArray(lista) || lista.length === 0) return lista || [];
        const vistos = new Set();
        const unicos = [];
        for (const it of lista) {
            if (!it || !it.video) continue;
            const chave = String(it.id_pedido || it.video);
            if (vistos.has(chave)) continue;
            vistos.add(chave);
            unicos.push(it);
        }
        const ehPlus = (it) => it.isPlus === true || it.isPlus === "true";
        const editoriais = EXA_EDITORIAIS.map((id) => unicos.find((it) => String(it.id_pedido) === id)).filter(Boolean);
        const idsEd = new Set(editoriais.map((it) => String(it.id_pedido)));
        const hor = unicos.filter((it) => !ehPlus(it) && !idsEd.has(String(it.id_pedido)));
        const plus = unicos.filter((it) => ehPlus(it) && !idsEd.has(String(it.id_pedido)));
        const nH = hor.length, nE = editoriais.length, nP = plus.length;
        if (!nH && !nE) return plus.length ? plus : unicos;
        // verticais por rodada: 1 a cada bloco de 3 horizontais que ainda tem horizontal depois + 1 no fim
        const vPorRodada = nP ? (nH > 0 ? Math.floor((nH - 1) / 3) : 0) + 1 : 0;
        // numero de rodadas: o menor que fecha o rodizio de editoriais e de verticais juntos
        let rodadas = 1;
        for (let r = 1; r <= 360; r++) {
            if ((nE === 0 || r % nE === 0) && (nP === 0 || (r * vPorRodada) % nP === 0)) { rodadas = r; break; }
            rodadas = r;
        }
        const out = [];
        let iP = 0;
        const proximoPlus = () => { if (nP) { out.push(plus[iP % nP]); iP++; } };
        for (let r = 0; r < rodadas; r++) {
            for (let h = 0; h < nH; h++) {
                out.push(hor[h]);
                if ((h + 1) % 3 === 0 && h + 1 < nH) proximoPlus();
            }
            if (nE) out.push(editoriais[r % nE]);
            proximoPlus();
        }
        const final = out.filter((it, i) => i === 0 || it.video !== out[i - 1].video);
        return final.length ? final : unicos;
    } catch (e) {
        console.error("ordenarPlaylistEXA falhou, usando a ordem original", e);
        return lista || [];
    }
}

async function carregarPlaylist() {
    const now = Date.now();
    if (now - lastPlaylistLoad < PLAYLIST_CACHE_TIME && playlist.length > 0) {
        return playlist;
    }
    try {
        const res = await fetch(`/cache/updates.json?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        playlist = ordenarPlaylistEXA(data?.PlaylistPronta || []);
        screenName = data?.ScreenName || "Sem Nome";
        clienteId = data?.cliente_id || "0";
        backendUrl = data?.backend_url || "";
        lastPlaylistLoad = now;
        return playlist;
    } catch (e) { return []; }
}

async function tocarProximo() {
    if (playlist.length === 0) {
        playlist = await carregarPlaylist();
        if (playlist.length === 0) return setTimeout(tocarProximo, 5000);
    }

    // Lógica de Ciclo e Check antecipado
    currentIdx++;
    if (currentIdx >= playlist.length) {
        playlist = await carregarPlaylist();
        currentIdx = 0;
    }

    const item = playlist[currentIdx];
    
    // Usa a URL direta, sem preloading para economizar RAM
    const fonte = `/cache/${encodeURI(item.video)}`;
    console.log(`🎬 Carregando vídeo [${currentIdx}] -> ${item.video}`, fonte);
    
    videoElement.src = fonte;
    
    // Garante que isPlus é um booleano
    const isPlus = item.isPlus === true || item.isPlus === "true";
    applyVisualMode(videoElement, isPlus);
    applyQRCode(item, isPlus);
    
    try {
        await videoElement.play();
    } catch (e) {
        console.error('Erro ao reproduzir vídeo:', e, item, fonte);
        setTimeout(tocarProximo, 1000);
    }
}

function applyQRCode(item, isPlus) {
    const locale = (item.QRLocale || "").trim(); // Esperado: "X,Y" (ex: "860,440")
    
    if (!qrElement) {
        qrElement = document.createElement('img');
        qrElement.id = "qr-propaganda";
        qrElement.style.zIndex = '2147483647';
        qrElement.style.pointerEvents = 'none';
        qrElement.style.backgroundColor = '#fff';
        qrElement.style.padding = '4px';
        qrElement.style.borderRadius = '5px';
        qrElement.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        qrElement.style.position = 'fixed'; 
        document.body.appendChild(qrElement);
    }

    const coords = locale.split(',');
    const x = parseFloat(coords[0]);
    const y = parseFloat(coords[1]);

    if (coords.length !== 2 || locale.toUpperCase() === "OFF" || locale === "" || isNaN(x) || isNaN(y)) {
        qrElement.style.display = 'none';
        return;
    }

    // Função interna para recalcular posição e tamanho
    const updatePosition = () => {
        if (!videoElement) return;
        
        const rect = videoElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            // Se o vídeo ainda não foi renderizado, tenta no próximo frame
            requestAnimationFrame(updatePosition);
            return;
        }

        // Canvas canônico: Horizontal 1920x1080, Vertical (isPlus) 1080x1920
        const baseW = isPlus ? 1080 : 1920;
        const baseH = isPlus ? 1920 : 1080;

        // Parsing "X,Y" conforme regra: "860,440" -> x=860, y=440
        const rawX = parseFloat(coords[0]);
        const rawY = parseFloat(coords[1]);

        // Calcula escala baseada na proporção do vídeo na tela vs canvas canônico
        const scaleX = rect.width / baseW;
        const scaleY = rect.height / baseH;

        // Tamanho fixo de 200x200 no canvas canônico, escalado para a tela
        const finalSizeW = 200 * scaleX;
        const finalSizeH = 200 * scaleY;
        
        const finalX = rawX * scaleX;
        const finalY = rawY * scaleY;

        qrElement.style.width = `${finalSizeW}px`;
        qrElement.style.height = `${finalSizeH}px`;
        qrElement.style.top = `${rect.top + finalY}px`;
        qrElement.style.left = `${rect.left + finalX}px`;
        qrElement.style.display = 'block';
        qrElement.style.opacity = '1';
        console.log(`[QR] Posicionado em: ${Math.round(rect.left + finalX)}x${Math.round(rect.top + finalY)} (Base: ${baseW}x${baseH}, Scale: ${scaleX.toFixed(2)}x${scaleY.toFixed(2)})`);
    };

    const agora = new Date().toLocaleString('pt-BR');
    const tituloVideo = item.titulo || "Sem Titulo";
    const redirect = item.redirecionamento || "";

    // Monta a URL com ID do prédio, nome da tela, título do vídeo, timestamp e redirecionamento (opcional)
    const baseApi = backendUrl || "http://127.0.0.1:8000";
    const urlCheckin = `${baseApi}/qrcode?id=${clienteId}&n=${encodeURIComponent(screenName)}&t=${encodeURIComponent(tituloVideo)}&ts=${encodeURIComponent(agora)}${redirect ? `&link=${encodeURIComponent(redirect)}` : ""}`;

    qrElement.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlCheckin)}`;
    
    // Executa o posicionamento no próximo frame de renderização
    requestAnimationFrame(updatePosition);
}

function applyVisualMode(el, isPlus) {
    // Garante boolean
    const fullscreen = isPlus === true || isPlus === "true";
    
    if (fullscreen) {
        console.log("📺 MODO PLUS: Forçando Ecrã Inteiro");
        
        // Primeiro, remove o atributo
        el.removeAttribute('data-fullscreen');
        
        // Define estilos de forma segura e completa
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        el.style.width = '100vw';
        el.style.height = '100vh';
        el.style.zIndex = '2147483640'; // Ligeiramente menor que o QR (2147483647)
        el.style.objectFit = 'fill';
        el.style.margin = '0';
        el.style.padding = '0';
        el.style.border = 'none';
        el.style.display = 'block';
        
        // Marca como fullscreen
        el.setAttribute('data-fullscreen', 'true');
        
    } else {
        console.log("📺 MODO NORMAL: Respeitando Layout");
        
        // Remove atributo
        el.removeAttribute('data-fullscreen');
        
        // Volta aos estilos normais
        el.style.position = 'absolute';
        el.style.top = '0';
        el.style.left = '0';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.zIndex = '1';
        el.style.objectFit = 'fill';
        el.style.borderBottom = '4px solid #fff';
        el.style.margin = '0';
        el.style.padding = '';
        el.style.border = '';
        el.style.display = '';
    }
}


function iniciar() {
    videoElement = document.getElementById("video-propaganda");
    videoElement.muted = true;
    videoElement.preload = 'none'; // Não pré-carregar para economizar recursos
    videoElement.onended = tocarProximo; // Troca imediata sem delay
    tocarProximo();
}

document.addEventListener("DOMContentLoaded", iniciar);