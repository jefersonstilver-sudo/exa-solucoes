package br.com.examidia.tela

import android.annotation.SuppressLint
import android.app.Activity
import android.app.ActivityManager
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.StateListDrawable
import android.net.ConnectivityManager
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.DisplayMetrics
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.PointerIcon
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * EXA Tela — abre o player da EXA (examidia.com.br/tela) em tela cheia e se recupera sozinho.
 *
 * Versão 2 (31/10/2026), depois da tela preta num player IPTV:
 *  - intro animada da EXA desenhada pelo app enquanto a página carrega (e a cada recarga/atualização);
 *  - se a página não abrir em 35 s, mostra na TV o motivo (data errada, certificado, sem internet, navegador
 *    do sistema antigo, erro de JavaScript) com botões para resolver, e manda o relato para a EXA;
 *  - nunca prende o aparelho: VOLTAR 3 vezes (ou a tecla MENU) abre um menu com "Sair do app";
 *  - não entra em loop de reabrir quando o app cai várias vezes seguidas.
 */
class MainActivity : Activity() {

    private lateinit var raiz: FrameLayout
    private var web: WebView? = null
    private lateinit var intro: Intro
    private lateinit var menu: LinearLayout
    private lateinit var menuInfo: TextView
    private lateinit var dica: TextView
    private val h = Handler(Looper.getMainLooper())
    private val gravador by lazy {
        Gravador(this) { r ->
            val js = "window.__gravacaoFim && window.__gravacaoFim(" + JSONObject.quote(r.toString()) + ")"
            web?.evaluateJavascript(js, null)
        }
    }

    private var erroNaPagina = false
    private var esperandoResposta = false
    private var ultimaResposta = System.currentTimeMillis()

    // diagnóstico da carga atual
    private var paginaPronta = false
    private var carregaComecou = 0L
    private var problema: String? = null      // o que a TV mostra/relata
    private var tipoProblema = ""              // data | certificado | internet | navegador | js | travou
    private val errosJs = ArrayDeque<String>()
    private var relatou = false
    private var voltarApertos = 0
    private var voltarPrimeiro = 0L

    private val urlTela: String
        get() = BuildConfig.URL_TELA + "?plataforma=android&app=android-" + BuildConfig.VERSION_NAME

    /** Versão do navegador do sistema (Chrome/xx do WebView). 0 = não deu para ler. */
    private val versaoChrome: Int by lazy {
        try {
            val ua = WebSettings.getDefaultUserAgent(this)
            Regex("Chrome/(\\d+)").find(ua)?.groupValues?.get(1)?.toInt() ?: 0
        } catch (_: Throwable) { 0 }
    }

    private fun pacoteWebView(): String = try {
        if (Build.VERSION.SDK_INT >= 26) {
            WebView.getCurrentWebViewPackage()?.let { "${it.packageName} ${it.versionName}" } ?: ""
        } else ""
    } catch (_: Throwable) { "" }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        instalarReinicioEmFalha()
        Diagnostico.vigiarQuadros()

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or WindowManager.LayoutParams.FLAG_FULLSCREEN)

        raiz = FrameLayout(this)
        raiz.setBackgroundColor(Color.BLACK)
        setContentView(raiz)

        intro = Intro(this)
        raiz.addView(intro, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        intro.tocar()

        dica = TextView(this).apply {
            text = "Para a tela abrir sozinha ao ligar: aperte OK no controle e permita \"Sobrepor a outros apps\" (ou defina a EXA Tela como app inicial)."
            setTextColor(Color.WHITE)
            textSize = 16f
            gravity = Gravity.CENTER
            setPadding(36, 22, 36, 22)
            setBackgroundColor(Color.argb(230, 16, 8, 14))
            visibility = View.GONE
            setOnClickListener { abrirPermissao() }
        }
        raiz.addView(dica, FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.CENTER_HORIZONTAL).apply { topMargin = 28 })

        criarMenu()
        // canto de cima à esquerda: segurar 3 s abre o menu (aparelho com toque e sem controle)
        raiz.addView(View(this).apply {
            setOnLongClickListener { abrirMenu(); true }
            isLongClickable = true
        }, FrameLayout.LayoutParams(140, 140, Gravity.TOP or Gravity.START))

        esconderBarras()
        criarWeb()
        h.postDelayed(vigia, 30_000)
    }

    // ---------------- WebView ----------------

    @SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
    private fun criarWeb() {
        web?.let { antigo ->
            raiz.removeView(antigo)
            try { antigo.destroy() } catch (_: Throwable) {}
        }
        web = null
        val w: WebView
        try {
            w = WebView(this)
        } catch (e: Throwable) {
            // o "Android System WebView" do aparelho está quebrado ou sendo atualizado
            mostrarProblema("navegador", "O navegador do sistema não abriu",
                "O aparelho não conseguiu iniciar o \"Android System WebView\" (${e.javaClass.simpleName}: ${e.message?.take(120) ?: ""}).\nAtualize ou reative o Android System WebView nas configurações e tente de novo.")
            h.postDelayed({ if (web == null) criarWeb() }, 60_000)
            return
        }
        w.setBackgroundColor(Color.BLACK)
        @Suppress("DEPRECATION")
        with(w.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            loadWithOverviewMode = true
            useWideViewPort = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            allowFileAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            userAgentString = "$userAgentString ExaTela/${BuildConfig.VERSION_NAME}"
        }
        // enquanto a intro está na frente a página não pega o foco do controle (ver focoSoNaFrente)
        w.isFocusable = !intro.tocando
        w.isFocusableInTouchMode = !intro.tocando
        w.isVerticalScrollBarEnabled = false
        w.isHorizontalScrollBarEnabled = false
        if (Build.VERSION.SDK_INT >= 24) w.pointerIcon = PointerIcon.getSystemIcon(this, PointerIcon.TYPE_NULL)
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(w, true)
        w.addJavascriptInterface(Ponte(), "ExaTela")

        w.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                erroNaPagina = false
                if (url != null && url.contains("/tela")) novaCarga()
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                ultimaResposta = System.currentTimeMillis()
            }

            @Suppress("DEPRECATION")
            @Deprecated("Android < 6")
            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                if (Build.VERSION.SDK_INT < 23) falhou(description ?: "erro $errorCode")
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                if (request?.isForMainFrame == true) falhou(if (Build.VERSION.SDK_INT >= 23) error?.description?.toString() ?: "" else "")
            }

            override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, errorResponse: WebResourceResponse?) {
                if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 0) >= 500) falhou("o site respondeu ${errorResponse?.statusCode}")
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                // nunca aceita certificado inválido; explica o motivo na TV (quase sempre a data do aparelho)
                handler?.cancel()
                val dataErrada = error != null && (error.primaryError == SslError.SSL_NOTYETVALID || error.primaryError == SslError.SSL_EXPIRED || error.primaryError == SslError.SSL_DATE_INVALID)
                val agora = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale("pt", "BR")).format(Date())
                erroNaPagina = true
                if (dataErrada || anoDoAparelhoErrado()) {
                    mostrarProblema("data", "A data do aparelho está errada",
                        "O aparelho acha que agora é $agora. Com a data errada a conexão segura com a EXA é recusada.\nAcerte em Data e hora (ligue \"Data e hora automáticas\") — a tela tenta de novo sozinha.",
                        botoes = listOf("Data e hora" to { abrirTela(Settings.ACTION_DATE_SETTINGS) }))
                } else {
                    mostrarProblema("certificado", "Conexão segura recusada pelo aparelho",
                        "O Android deste aparelho não reconheceu o certificado de ${error?.url?.let { Uri.parse(it).host } ?: "examidia.com.br"} (erro ${error?.primaryError}).\nCostuma acontecer em Android muito antigo. Atualize o sistema/navegador ou fale com a EXA.")
                }
                agendarNovaTentativa()
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean =
                !permitido(request?.url)

            @Suppress("DEPRECATION")
            @Deprecated("Android < 7")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean =
                !permitido(Uri.parse(url ?: ""))

            override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
                // o processo da página morreu (falta de memória, travamento): recria tudo
                h.post { criarWeb() }
                return true
            }
        }

        w.webChromeClient = object : WebChromeClient() {
            // sem isso o Android mostra um "play" cinza antes de cada vídeo
            override fun getDefaultVideoPoster(): Bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
            override fun onPermissionRequest(request: PermissionRequest?) { request?.deny() }
            override fun onConsoleMessage(m: ConsoleMessage?): Boolean {
                if (m != null && m.messageLevel() == ConsoleMessage.MessageLevel.ERROR) guardarErroJs("${m.message()} (${m.sourceId()?.substringAfterLast('/')?.take(40)}:${m.lineNumber()})")
                return false
            }
        }

        raiz.addView(w, 0, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        web = w
        esperandoResposta = false
        ultimaResposta = System.currentTimeMillis()
        novaCarga()
        w.loadUrl(urlTela)
        if (!intro.tocando) w.requestFocus()
    }

    /** Começo de uma carga da página: toca a intro e arma o prazo de 35 s para ela abrir. */
    private fun novaCarga() {
        if (paginaPronta || !intro.tocando) { intro.tocar(); focoSoNaFrente(true) }
        paginaPronta = false
        carregaComecou = System.currentTimeMillis()
        if (tipoProblema != "data" && tipoProblema != "certificado") { problema = null; tipoProblema = "" }
        relatou = false
        h.removeCallbacks(prazo)
        h.postDelayed(prazo, 35_000)
        if (versaoChrome in 1..50) {
            mostrarProblema("navegador", "Navegador do sistema antigo demais",
                "Este aparelho usa o navegador do sistema na versão Chrome $versaoChrome. O player da EXA precisa do 51 ou mais novo.\nAtualize o \"Android System WebView\" (Play Store) ou use outro aparelho.",
                botoes = listOf("Atualizar navegador" to { abrirLoja("com.google.android.webview") }))
        }
    }

    private val prazo = Runnable {
        if (paginaPronta) return@Runnable
        // página de uma versão que ainda não avisa "pronto": se o palco do player já está desenhado, está tudo bem
        val w = web
        if (w != null && problema == null) {
            w.evaluateJavascript("(function(){return !!document.querySelector('.palco')})()") { r ->
                if (r == "true") Ponte().pronto() else diagnosticar()
            }
        } else diagnosticar()
    }

    private fun diagnosticar() {
        if (paginaPronta) return
        if (problema != null) { relatar(); return }
        val ultimoJs = errosJs.lastOrNull()
        when {
            !temInternet() -> mostrarProblema("internet", "Sem internet", "O aparelho não está conectado. Confira o Wi-Fi ou o cabo — a tela tenta de novo sozinha.",
                botoes = listOf("Wi-Fi" to { abrirTela(Settings.ACTION_WIFI_SETTINGS) }))
            ultimoJs != null -> mostrarProblema("js", "O player não rodou neste aparelho",
                "Navegador do sistema: Chrome ${if (versaoChrome > 0) versaoChrome else "?"}.\nErro: ${ultimoJs.take(180)}\nAtualize o \"Android System WebView\" e tente de novo.",
                botoes = listOf("Atualizar navegador" to { abrirLoja("com.google.android.webview") }))
            else -> mostrarProblema("travou", "A tela está demorando para abrir",
                "A página da EXA não respondeu em 35 s (internet lenta ou aparelho sem memória). Tentando de novo…")
        }
        relatar()
        agendarNovaTentativa()
    }

    /** A tela só navega dentro do site da EXA (nada de abrir links externos no aparelho). */
    private fun permitido(uri: Uri?): Boolean {
        if (uri == null) return false
        val host = uri.host ?: return uri.toString().startsWith("about:")
        return host == "examidia.com.br" || host.endsWith(".examidia.com.br")
    }

    private val tentarDeNovo = Runnable {
        if (!paginaPronta) web?.loadUrl(urlTela) ?: criarWeb()
    }

    private fun agendarNovaTentativa() {
        h.removeCallbacks(tentarDeNovo)
        h.postDelayed(tentarDeNovo, 20_000)
    }

    private fun falhou(motivo: String) {
        erroNaPagina = true
        if (!temInternet()) {
            mostrarProblema("internet", "Sem internet", "O aparelho não está conectado. Confira o Wi-Fi ou o cabo — a tela tenta de novo sozinha.",
                botoes = listOf("Wi-Fi" to { abrirTela(Settings.ACTION_WIFI_SETTINGS) }))
        } else {
            mostrarProblema("internet", "Não consegui abrir a tela da EXA", "Erro de conexão: ${motivo.take(140)}. Tentando de novo em 20 s.")
        }
        agendarNovaTentativa()
    }

    private fun temInternet(): Boolean = try {
        @Suppress("DEPRECATION")
        (getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager).activeNetworkInfo?.isConnected == true
    } catch (_: Throwable) { true }

    /** Ano antes de 2025 = relógio do aparelho zerado (TV box sem bateria de relógio). */
    private fun anoDoAparelhoErrado(): Boolean = System.currentTimeMillis() < 1735689600000L

    private fun guardarErroJs(t: String) {
        errosJs.addLast(t.take(300))
        while (errosJs.size > 6) errosJs.removeFirst()
    }

    /** Mostra o problema na TV, por cima da intro, com botões (controle remoto navega entre eles). */
    private fun mostrarProblema(tipo: String, titulo: String, texto: String, botoes: List<Pair<String, () -> Unit>> = emptyList()) {
        h.post {
            problema = "$titulo — $texto"
            tipoProblema = tipo
            if (intro.visibility != View.VISIBLE) intro.tocar()
            intro.status.visibility = View.GONE
            intro.diagTitulo.text = titulo
            intro.diagTexto.text = "$texto\n\nEXA Tela ${BuildConfig.VERSION_NAME} · Android ${Build.VERSION.RELEASE} · Chrome ${if (versaoChrome > 0) versaoChrome else "?"} · ${Build.MANUFACTURER} ${Build.MODEL}"
            intro.diagBotoes.removeAllViews()
            val todos = listOf<Pair<String, () -> Unit>>("Tentar de novo" to { intro.diag.visibility = View.GONE; intro.status.visibility = View.VISIBLE; tentarDeNovo.run() }) + botoes + listOf("Menu" to { abrirMenu() })
            todos.forEach { (rotulo, acao) -> intro.diagBotoes.addView(botao(rotulo, intro.unidade) { acao() }) }
            intro.diag.visibility = View.VISIBLE
            focoSoNaFrente(true)
            if (menu.visibility != View.VISIBLE) intro.diagBotoes.getChildAt(0)?.requestFocus()
        }
    }

    /** Manda para a EXA o que aconteceu (uma vez por carga), para a equipe ver sem precisar ir ao local. */
    private fun relatar() {
        if (relatou) return
        relatou = true
        val corpo = JSONObject()
        try {
            corpo.put("acao", "relato_app")
            corpo.put("id_aparelho", idAparelho())
            corpo.put("tipo", tipoProblema)
            corpo.put("problema", problema ?: "")
            corpo.put("erros_js", JSONArray(errosJs.toList()))
            corpo.put("info", JSONObject(infoAparelho()))
        } catch (_: Throwable) {}
        Thread {
            try {
                val c = URL(FUNCAO).openConnection() as HttpURLConnection
                c.requestMethod = "POST"
                c.connectTimeout = 15_000
                c.readTimeout = 15_000
                c.doOutput = true
                c.setRequestProperty("Content-Type", "application/json")
                c.setRequestProperty("apikey", ANON_KEY)
                c.setRequestProperty("Authorization", "Bearer $ANON_KEY")
                c.outputStream.use { it.write(corpo.toString().toByteArray()) }
                c.responseCode
                c.disconnect()
            } catch (_: Throwable) {}
        }.start()
    }

    /**
     * Com a intro, o diagnóstico ou o menu na frente, o controle remoto só navega nos botões deles
     * (sem isso o foco "cai" na página escondida atrás e os botões parecem não responder).
     */
    private fun focoSoNaFrente(sim: Boolean) {
        web?.isFocusable = !sim
        web?.isFocusableInTouchMode = !sim
        intro.descendantFocusability = if (menu.visibility == View.VISIBLE) ViewGroup.FOCUS_BLOCK_DESCENDANTS else ViewGroup.FOCUS_AFTER_DESCENDANTS
    }

    /** Vigia: a cada 30 s confere se a página responde; se travou por 2 min, recria o navegador. */
    private val vigia = object : Runnable {
        override fun run() {
            val w = web
            if (w != null && !erroNaPagina) {
                val parado = System.currentTimeMillis() - ultimaResposta
                if (esperandoResposta && parado > 120_000) {
                    criarWeb()
                } else {
                    val url = w.url ?: ""
                    if (url.isNotEmpty() && !url.contains("/tela")) {
                        w.loadUrl(urlTela)
                    } else {
                        esperandoResposta = true
                        w.evaluateJavascript("1") {
                            esperandoResposta = false
                            ultimaResposta = System.currentTimeMillis()
                        }
                    }
                }
            }
            h.postDelayed(this, 30_000)
        }
    }

    // ---------------- menu (nunca prender o aparelho) ----------------

    private fun botao(rotulo: String, u: Float, acao: () -> Unit): Button = Button(this).apply {
        text = rotulo
        isAllCaps = false
        setTextColor(Color.WHITE)
        typeface = Typeface.DEFAULT_BOLD
        setTextSize(TypedValue.COMPLEX_UNIT_PX, 2f * u)
        val normal = GradientDrawable().apply { setColor(Color.argb(40, 255, 255, 255)); cornerRadius = 2f * u }
        val foco = GradientDrawable().apply { setColor(Color.rgb(234, 37, 29)); cornerRadius = 2f * u; setStroke((0.35f * u).toInt().coerceAtLeast(2), Color.WHITE) }
        background = StateListDrawable().apply {
            addState(intArrayOf(android.R.attr.state_focused), foco)
            addState(intArrayOf(android.R.attr.state_pressed), foco)
            addState(intArrayOf(), normal)
        }
        setPadding((2.6f * u).toInt(), (1.2f * u).toInt(), (2.6f * u).toInt(), (1.2f * u).toInt())
        isFocusable = true
        isFocusableInTouchMode = true
        setOnClickListener { acao() }
        layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            val m = (0.8f * u).toInt(); setMargins(m, m, m, m)
        }
    }

    private fun criarMenu() {
        menu = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.argb(242, 10, 5, 12))
            visibility = View.GONE
            isClickable = true
        }
        raiz.addView(menu, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        menuInfo = TextView(this).apply { setTextColor(Color.argb(170, 255, 255, 255)); gravity = Gravity.CENTER }
    }

    private fun abrirMenu() {
        val dm = resources.displayMetrics
        val u = minOf(dm.widthPixels, dm.heightPixels) / 100f
        menu.removeAllViews()
        menu.addView(TextView(this).apply {
            text = "EXA Tela"
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 4f * u)
            gravity = Gravity.CENTER
        })
        menuInfo.setTextSize(TypedValue.COMPLEX_UNIT_PX, 1.8f * u)
        menuInfo.text = "Versão ${BuildConfig.VERSION_NAME} · Android ${Build.VERSION.RELEASE} · Chrome ${if (versaoChrome > 0) versaoChrome else "?"} · ${Build.MANUFACTURER} ${Build.MODEL}\nID ${idAparelho().takeLast(8)}"
        menuInfo.setPadding(0, (1f * u).toInt(), 0, (3f * u).toInt())
        (menuInfo.parent as? ViewGroup)?.removeView(menuInfo)
        menu.addView(menuInfo)
        val linha1 = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        val linha2 = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        linha1.addView(botao("Voltar para a tela", u) { fecharMenu() })
        linha1.addView(botao("Recarregar", u) { fecharMenu(); criarWeb() })
        linha1.addView(botao("Wi-Fi", u) { abrirTela(Settings.ACTION_WIFI_SETTINGS) })
        linha1.addView(botao("Data e hora", u) { abrirTela(Settings.ACTION_DATE_SETTINGS) })
        linha2.addView(botao("Atualizar navegador do sistema", u) { abrirLoja("com.google.android.webview") })
        linha2.addView(botao("Configurações", u) { abrirTela(Settings.ACTION_SETTINGS) })
        linha2.addView(botao("Sair do app", u) { sair() })
        menu.addView(linha1)
        menu.addView(linha2)
        menu.addView(TextView(this).apply {
            text = "Para abrir este menu: aperte VOLTAR 3 vezes ou a tecla MENU do controle."
            setTextColor(Color.argb(130, 255, 255, 255))
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 1.6f * u)
            gravity = Gravity.CENTER
            setPadding(0, (3f * u).toInt(), 0, 0)
        })
        menu.visibility = View.VISIBLE
        menu.bringToFront()
        focoSoNaFrente(true)
        linha1.getChildAt(0)?.requestFocus()
    }

    private fun fecharMenu() {
        menu.visibility = View.GONE
        val naFrente = intro.visibility == View.VISIBLE
        focoSoNaFrente(naFrente)
        if (intro.diag.visibility == View.VISIBLE) intro.diagBotoes.getChildAt(0)?.requestFocus() else if (!naFrente) web?.requestFocus()
    }

    /** Sai de verdade: deixa de ser a tela inicial (senão o HOME abriria o app de novo) e fecha. */
    private fun sair() {
        try {
            @Suppress("DEPRECATION")
            packageManager.clearPackagePreferredActivities(packageName)
        } catch (_: Throwable) {}
        getSharedPreferences("exa", MODE_PRIVATE).edit().putLong("saiu_em", System.currentTimeMillis()).apply()
        h.removeCallbacksAndMessages(null)
        finishAndRemoveTask()
    }

    private fun abrirTela(acao: String) {
        try { startActivity(Intent(acao).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return } catch (_: Throwable) {}
        try { startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Throwable) {}
    }

    private fun abrirLoja(pacote: String) {
        try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pacote")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return } catch (_: Throwable) {}
        // sem Play Store: abre os detalhes do app no sistema (atualizar/reativar)
        try { startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$pacote")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return } catch (_: Throwable) {}
        abrirTela(Settings.ACTION_SETTINGS)
    }

    // ---------------- tela cheia, controle remoto ----------------

    @Suppress("DEPRECATION")
    private fun esconderBarras() {
        if (Build.VERSION.SDK_INT >= 30) {
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.let {
                it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN)
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) esconderBarras()
    }

    override fun onResume() {
        super.onResume()
        esconderBarras()
        web?.onResume()
        // voltou das configurações (Wi-Fi, data): tenta abrir de novo na hora
        if (!paginaPronta && problema != null) h.postDelayed(tentarDeNovo, 1500)
    }

    @Deprecated("Deprecated in Java")
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        // tratado em dispatchKeyEvent: VOLTAR 3 vezes abre o menu
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val k = event.keyCode
        if (k == KeyEvent.KEYCODE_BACK || k == KeyEvent.KEYCODE_ESCAPE) {
            if (event.action == KeyEvent.ACTION_UP) {
                if (menu.visibility == View.VISIBLE) { fecharMenu(); return true }
                val agora = System.currentTimeMillis()
                if (agora - voltarPrimeiro > 3000) { voltarPrimeiro = agora; voltarApertos = 0 }
                voltarApertos++
                if (voltarApertos >= 3) { voltarApertos = 0; abrirMenu() }
            }
            return true
        }
        if (k == KeyEvent.KEYCODE_MENU || k == KeyEvent.KEYCODE_SETTINGS || k == KeyEvent.KEYCODE_INFO) {
            if (event.action == KeyEvent.ACTION_UP) { if (menu.visibility == View.VISIBLE) fecharMenu() else abrirMenu() }
            return true
        }
        if (dica.visibility == View.VISIBLE && menu.visibility != View.VISIBLE && intro.diag.visibility != View.VISIBLE && event.action == KeyEvent.ACTION_UP &&
            (k == KeyEvent.KEYCODE_DPAD_CENTER || k == KeyEvent.KEYCODE_ENTER)
        ) {
            abrirPermissao()
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    // ---------------- abrir sozinho ao ligar ----------------

    private fun souAppInicial(): Boolean {
        val i = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        val r = packageManager.resolveActivity(i, PackageManager.MATCH_DEFAULT_ONLY)
        return r?.activityInfo?.packageName == packageName
    }

    private fun podeAbrirSozinho(): Boolean =
        Build.VERSION.SDK_INT < 29 || souAppInicial() || Settings.canDrawOverlays(this)

    private fun talvezMostrarDica() {
        if (podeAbrirSozinho()) return
        dica.visibility = View.VISIBLE
        dica.bringToFront()
        h.postDelayed({ dica.visibility = View.GONE }, 25_000)
    }

    private fun abrirPermissao() {
        dica.visibility = View.GONE
        try {
            startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
            return
        } catch (_: Throwable) {}
        try {
            startActivity(Intent(Settings.ACTION_HOME_SETTINGS))
        } catch (_: Throwable) {}
    }

    // ---------------- reinício ----------------

    private fun agendarReabertura() {
        val i = Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        val flags = PendingIntent.FLAG_CANCEL_CURRENT or (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0)
        val pi = PendingIntent.getActivity(this, 1, i, flags)
        (getSystemService(Context.ALARM_SERVICE) as AlarmManager).set(AlarmManager.RTC, System.currentTimeMillis() + 1500, pi)
    }

    private fun reiniciar() {
        // sem permissão de abrir sozinho, matar o app deixaria a TV sem nada: só recria a página
        if (!podeAbrirSozinho()) {
            criarWeb()
            return
        }
        agendarReabertura()
        finishAffinity()
        android.os.Process.killProcess(android.os.Process.myPid())
    }

    /**
     * Se o app cair, reabre sozinho — mas no máximo 3 vezes em 5 minutos. Antes reabria sempre, e um
     * aparelho em que o app cai ao abrir ficava num loop de tela preta sem como sair.
     */
    private fun instalarReinicioEmFalha() {
        val anterior = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { t, e ->
            try {
                val p = getSharedPreferences("exa", MODE_PRIVATE)
                val agora = System.currentTimeMillis()
                val quedas = (p.getString("quedas", "") ?: "").split(",").mapNotNull { it.toLongOrNull() }.filter { agora - it < 5 * 60_000 } + agora
                p.edit().putString("quedas", quedas.joinToString(",")).putString("ultima_queda", "${e.javaClass.simpleName}: ${e.message?.take(200)}").commit()
                if (quedas.size <= 3 && podeAbrirSozinho()) agendarReabertura()
            } catch (_: Throwable) {}
            anterior?.uncaughtException(t, e)
        }
    }

    override fun onDestroy() {
        h.removeCallbacksAndMessages(null)
        intro.parar()
        try { web?.destroy() } catch (_: Throwable) {}
        web = null
        super.onDestroy()
    }

    private fun idAparelho(): String = try { Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: "" } catch (_: Throwable) { "" }

    private fun infoAparelho(): String {
        val j = JSONObject()
        try {
            val dm = DisplayMetrics()
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getRealMetrics(dm)
            val mi = ActivityManager.MemoryInfo()
            (getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(mi)
            val p = getSharedPreferences("exa", MODE_PRIVATE)
            j.put("fabricante", Build.MANUFACTURER)
                .put("modelo", Build.MODEL)
                .put("android", Build.VERSION.RELEASE)
                .put("sdk", Build.VERSION.SDK_INT)
                .put("largura", dm.widthPixels)
                .put("altura", dm.heightPixels)
                .put("densidade", dm.densityDpi)
                .put("memoria_mb", mi.totalMem / 1048576)
                .put("memoria_livre_mb", mi.availMem / 1048576)
                .put("app", BuildConfig.VERSION_NAME)
                .put("abre_sozinho", podeAbrirSozinho())
                .put("app_inicial", souAppInicial())
                .put("chrome", versaoChrome)
                .put("webview", pacoteWebView())
                .put("relogio", SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date()))
                .put("ultima_queda", p.getString("ultima_queda", "") ?: "")
                .put("ua", WebSettings.getDefaultUserAgent(this@MainActivity))
            // hardware completo (como nos NUCs): processador, memória, armazenamento, tela, decodificadores, rede
            val hw = Diagnostico.hardware(this@MainActivity)
            val chaves = hw.keys()
            while (chaves.hasNext()) { val k = chaves.next(); if (!j.has(k)) j.put(k, hw.get(k)) }
        } catch (_: Throwable) {}
        return j.toString()
    }

    // ---------------- ponte com o player (window.ExaTela) ----------------

    inner class Ponte {
        @JavascriptInterface
        fun versao(): String = BuildConfig.VERSION_NAME

        @JavascriptInterface
        fun idAparelho(): String = this@MainActivity.idAparelho()

        @JavascriptInterface
        fun reiniciarApp() {
            h.post { reiniciar() }
        }

        @JavascriptInterface
        fun infoAparelho(): String = this@MainActivity.infoAparelho()

        /** Saúde do aparelho agora (CPU, temperatura, memória, Wi-Fi, quadros do app): o player manda a cada batimento. */
        @JavascriptInterface
        fun saudeNativa(): String = try { Diagnostico.saude(this@MainActivity).toString() } catch (_: Throwable) { "{}" }

        /** Grava a tela por N segundos e envia para a URL assinada; o fim chega em window.__gravacaoFim(json). */
        @JavascriptInterface
        fun gravar(segundos: Int, urlEnvio: String, caminho: String): Boolean {
            if (gravador.gravando) return false
            h.post { gravador.gravar(segundos, urlEnvio, caminho) }
            return true
        }

        @JavascriptInterface
        fun podeGravar(): Boolean = Build.VERSION.SDK_INT >= 26

        /** Comandos remotos do admin para nunca precisar de alguém "caçando" a saída do app na TV. */
        @JavascriptInterface
        fun sairDoApp() { h.post { sair() } }

        @JavascriptInterface
        fun abrirConfiguracoes() { h.post { abrirTela(Settings.ACTION_SETTINGS) } }

        /** Abre o download do APK novo no navegador do aparelho (instala por cima, mesma assinatura). */
        @JavascriptInterface
        fun atualizarApp() {
            h.post {
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/jefersonstilver-sudo/exa-solucoes/releases/download/tela-android/exa-tela.apk")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                } catch (_: Throwable) { abrirTela(Settings.ACTION_SETTINGS) }
            }
        }

        /** O app desenha a intro: a página não precisa desenhar a dela. */
        @JavascriptInterface
        fun temIntro(): Boolean = true

        /** A página abriu e desenhou a primeira tela: a intro some. */
        @JavascriptInterface
        fun pronto() {
            h.post {
                paginaPronta = true
                problema = null
                tipoProblema = ""
                h.removeCallbacks(prazo)
                h.removeCallbacks(tentarDeNovo)
                intro.diag.visibility = View.GONE
                intro.status.visibility = View.VISIBLE
                intro.esconder { if (menu.visibility != View.VISIBLE) { focoSoNaFrente(false); web?.requestFocus() }; talvezMostrarDica() }
            }
        }

        @JavascriptInterface
        fun erroJs(msg: String?) {
            if (!msg.isNullOrBlank()) h.post { guardarErroJs(msg) }
        }
    }

    companion object {
        private const val FUNCAO = "https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa-tela"
        // chave pública (anon) — a mesma que o site e o player usam
        private const val ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk"
    }
}
