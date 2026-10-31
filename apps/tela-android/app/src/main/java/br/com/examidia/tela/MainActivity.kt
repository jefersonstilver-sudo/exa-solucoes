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
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.KeyEvent
import android.view.PointerIcon
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.TextView
import org.json.JSONObject

/**
 * EXA Tela — abre o player da EXA (examidia.com.br/tela) em tela cheia e se recupera sozinho.
 * Todo o resto (código de pareamento, programação, cache dos vídeos, atualização) é do player web.
 */
class MainActivity : Activity() {

    private lateinit var raiz: FrameLayout
    private var web: WebView? = null
    private lateinit var aviso: TextView // "Sem internet — tentando de novo"
    private lateinit var dica: TextView  // como fazer a tela abrir sozinha ao ligar
    private val h = Handler(Looper.getMainLooper())

    private var erroNaPagina = false
    private var esperandoResposta = false
    private var ultimaResposta = System.currentTimeMillis()

    private val urlTela: String
        get() = BuildConfig.URL_TELA + "?plataforma=android&app=android-" + BuildConfig.VERSION_NAME

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        instalarReinicioEmFalha()

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or WindowManager.LayoutParams.FLAG_FULLSCREEN)

        raiz = FrameLayout(this)
        raiz.setBackgroundColor(Color.BLACK)

        aviso = TextView(this).apply {
            text = "Sem internet — tentando de novo"
            setTextColor(Color.WHITE)
            textSize = 30f
            gravity = Gravity.CENTER
            setBackgroundColor(Color.rgb(12, 6, 16))
            visibility = View.GONE
        }
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

        setContentView(raiz)
        criarWeb()
        raiz.addView(aviso, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        raiz.addView(dica, FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.CENTER_HORIZONTAL).apply { topMargin = 28 })

        esconderBarras()
        talvezMostrarDica()
        h.postDelayed(vigia, 30_000)
    }

    // ---------------- WebView ----------------

    @SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
    private fun criarWeb() {
        web?.let { antigo ->
            raiz.removeView(antigo)
            try { antigo.destroy() } catch (_: Throwable) {}
        }
        val w = WebView(this)
        w.setBackgroundColor(Color.BLACK)
        w.setLayerType(View.LAYER_TYPE_HARDWARE, null)
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
        w.isFocusable = true
        w.isFocusableInTouchMode = true
        w.isVerticalScrollBarEnabled = false
        w.isHorizontalScrollBarEnabled = false
        if (Build.VERSION.SDK_INT >= 24) w.pointerIcon = PointerIcon.getSystemIcon(this, PointerIcon.TYPE_NULL)
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(w, true)
        w.addJavascriptInterface(Ponte(), "ExaTela")

        w.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                erroNaPagina = false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                ultimaResposta = System.currentTimeMillis()
                if (!erroNaPagina) aviso.visibility = View.GONE
            }

            @Suppress("DEPRECATION")
            @Deprecated("Android < 6")
            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                if (Build.VERSION.SDK_INT < 23) falhou()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                if (request?.isForMainFrame == true) falhou()
            }

            override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, errorResponse: WebResourceResponse?) {
                if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 0) >= 500) falhou()
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
        }

        raiz.addView(w, 0, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        web = w
        esperandoResposta = false
        ultimaResposta = System.currentTimeMillis()
        w.loadUrl(urlTela)
        w.requestFocus()
    }

    /** A tela só navega dentro do site da EXA (nada de abrir links externos no aparelho). */
    private fun permitido(uri: Uri?): Boolean {
        if (uri == null) return false
        val host = uri.host ?: return uri.toString().startsWith("about:")
        return host == "examidia.com.br" || host.endsWith(".examidia.com.br")
    }

    private val tentarDeNovo = Runnable {
        if (erroNaPagina) web?.loadUrl(urlTela)
    }

    private fun falhou() {
        erroNaPagina = true
        aviso.visibility = View.VISIBLE
        h.removeCallbacks(tentarDeNovo)
        h.postDelayed(tentarDeNovo, 15_000)
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
    }

    @Deprecated("Deprecated in Java")
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        // o botão voltar não sai da tela
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK) return true
        if (dica.visibility == View.VISIBLE && event.action == KeyEvent.ACTION_UP &&
            (event.keyCode == KeyEvent.KEYCODE_DPAD_CENTER || event.keyCode == KeyEvent.KEYCODE_ENTER)
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

    private fun instalarReinicioEmFalha() {
        val anterior = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { t, e ->
            try { if (podeAbrirSozinho()) agendarReabertura() } catch (_: Throwable) {}
            anterior?.uncaughtException(t, e)
        }
    }

    override fun onDestroy() {
        h.removeCallbacksAndMessages(null)
        try { web?.destroy() } catch (_: Throwable) {}
        web = null
        super.onDestroy()
    }

    // ---------------- ponte com o player (window.ExaTela) ----------------

    inner class Ponte {
        @JavascriptInterface
        fun versao(): String = BuildConfig.VERSION_NAME

        @JavascriptInterface
        fun idAparelho(): String =
            Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: ""

        @JavascriptInterface
        fun reiniciarApp() {
            h.post { reiniciar() }
        }

        @JavascriptInterface
        fun infoAparelho(): String {
            val j = JSONObject()
            try {
                val dm = DisplayMetrics()
                @Suppress("DEPRECATION")
                windowManager.defaultDisplay.getRealMetrics(dm)
                val mi = ActivityManager.MemoryInfo()
                (getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(mi)
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
                    .put("ua", WebSettings.getDefaultUserAgent(this@MainActivity))
            } catch (_: Throwable) {}
            return j.toString()
        }
    }
}
