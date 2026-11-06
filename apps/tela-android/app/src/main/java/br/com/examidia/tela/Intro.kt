package br.com.examidia.tela

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.SurfaceTexture
import android.graphics.SweepGradient
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.MediaPlayer
import android.net.Uri
import android.util.TypedValue
import android.view.Gravity
import android.view.Surface
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

/**
 * 06/11/2026 (APK 1.0.14) — abertura da EXA + tela de carregamento de verdade.
 *
 *  - Ao LIGAR o app: toca a abertura oficial (res/raw/exa_intro.mp4, 12 s, 1080x1920) pelo próprio Android.
 *  - Quando ela acaba, fica o último quadro parado (res/drawable-nodpi/exa_intro_fundo.jpg, o mesmo quadro sem o
 *    texto) e o app desenha por cima: um anel de progresso em volta do logo com o andamento REAL que a página manda
 *    (ExaTela.progresso), um cometa girando (sinal de vida) e o texto da etapa. Sem vídeo em loop: nada disputa o
 *    decodificador com os anúncios e a câmera que a página está preparando atrás.
 *  - Ao RECARREGAR / ATUALIZAR: a mesma tela, sem a abertura ("Atualizando a tela").
 *  - Só some quando a página confirma que está tudo fluido (ExaTela.liberar) — ou a página antiga avisa pronto.
 * Tudo desenhado por tempo (não depende da escala de animações do sistema, que TV box costuma vir desligada).
 * Coordenadas do desenho = as do vídeo (1080x1920), encaixadas na tela (TV deitada: o quadro fica no centro).
 */
class Intro(ctx: Context) : FrameLayout(ctx) {

    private val fundo = ImageView(ctx)
    private val video = TextureView(ctx)
    private val anel = Anel(ctx, this)
    val status = TextView(ctx)
    internal val etapa = TextView(ctx)
    internal val marca = TextView(ctx)
    val diag = LinearLayout(ctx)
    val diagTitulo = TextView(ctx)
    val diagTexto = TextView(ctx)
    val diagBotoes = LinearLayout(ctx)

    private var mp: MediaPlayer? = null
    private var superficie: Surface? = null
    private var querVideo = false

    var tocando = false
        private set
    /** A abertura (vídeo) ainda está tocando: a página segura os vídeos dela até acabar (não disputa decodificador). */
    @Volatile var videoTocando = false
        private set
    var comecouEm = 0L
        private set
    var unidade = 10f
        private set

    private var escala = 1f
    private var sumir: Runnable? = null

    init {
        setBackgroundColor(Color.rgb(6, 5, 7))
        isClickable = true
        fundo.scaleType = ImageView.ScaleType.FIT_CENTER
        try { fundo.setImageBitmap(BitmapFactory.decodeResource(ctx.resources, R.drawable.exa_intro_fundo)) } catch (_: Throwable) { }
        addView(fundo, LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        video.isOpaque = false
        video.alpha = 0f
        video.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
            override fun onSurfaceTextureAvailable(st: SurfaceTexture, w: Int, h: Int) { superficie = Surface(st); if (querVideo) abrirVideo() }
            override fun onSurfaceTextureSizeChanged(st: SurfaceTexture, w: Int, h: Int) {}
            override fun onSurfaceTextureDestroyed(st: SurfaceTexture): Boolean { soltarVideo(); superficie?.release(); superficie = null; return true }
            override fun onSurfaceTextureUpdated(st: SurfaceTexture) {}
        }
        addView(video)
        addView(anel, LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

        status.setTextColor(Color.WHITE)
        status.typeface = Typeface.create("sans-serif", Typeface.BOLD)
        status.gravity = Gravity.CENTER
        status.isSingleLine = true
        status.text = "Iniciando o sistema"
        etapa.setTextColor(Color.argb(200, 255, 255, 255))
        etapa.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        etapa.gravity = Gravity.CENTER
        etapa.isSingleLine = true
        marca.setTextColor(Color.argb(120, 255, 255, 255))
        marca.typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        marca.gravity = Gravity.CENTER
        marca.text = "EXA Mídia · mídia nos elevadores"
        // os textos são desenhados pelo Anel (posição exata sobre o quadro do vídeo); as TextViews guardam o texto

        diag.orientation = LinearLayout.VERTICAL
        diag.gravity = Gravity.CENTER_HORIZONTAL
        diag.visibility = View.GONE
        diag.background = GradientDrawable().apply { setColor(Color.argb(235, 22, 10, 18)); cornerRadius = 28f; setStroke(2, Color.argb(60, 255, 255, 255)) }
        diagTitulo.setTextColor(Color.WHITE)
        diagTitulo.typeface = Typeface.DEFAULT_BOLD
        diagTitulo.gravity = Gravity.CENTER
        diagTexto.setTextColor(Color.argb(215, 255, 255, 255))
        diagTexto.gravity = Gravity.CENTER
        diagBotoes.orientation = LinearLayout.HORIZONTAL
        diagBotoes.gravity = Gravity.CENTER
        diag.addView(diagTitulo); diag.addView(diagTexto); diag.addView(diagBotoes)
        addView(diag)
        camadas(0f)
    }

    /** Textos e anel visíveis (1) ou não (0: durante a abertura, que já traz os dela). */
    private fun camadas(a: Float) { anel.alpha = a }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w == 0 || h == 0) return
        unidade = minOf(w, h) / 100f
        val s = minOf(w / 1080f, h / 1920f)
        escala = s
        val vw = (1080 * s).toInt(); val vh = (1920 * s).toInt()
        val oy = (h - vh) / 2
        video.layoutParams = LayoutParams(vw, vh, Gravity.CENTER)
        anel.encaixar(w / 2f, oy + 850f * s, s)

        val u = unidade
        diagTitulo.setTextSize(TypedValue.COMPLEX_UNIT_PX, 3f * u)
        diagTexto.setTextSize(TypedValue.COMPLEX_UNIT_PX, 2f * u)
        diagTexto.setLineSpacing(0f, 1.25f)
        diagTexto.setPadding(0, (1.4f * u).toInt(), 0, (2.2f * u).toInt())
        val pad = (3f * u).toInt()
        diag.setPadding(pad, (2.6f * u).toInt(), pad, (2.6f * u).toInt())
        diag.layoutParams = LayoutParams((w * 0.74f).toInt(), ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply { bottomMargin = (5 * u).toInt() }
    }

    /**
     * Mostra a tela desde o começo. comVideo = abrir o app (toca a abertura); sem vídeo = recarga/atualização.
     */
    fun tocar(comVideo: Boolean = false) {
        garantirAnimacoes()
        cancelarEsconder()
        animate().cancel()
        visibility = View.VISIBLE
        alpha = 1f
        diag.visibility = View.GONE
        tocando = true
        comecouEm = System.currentTimeMillis()
        anel.zerar()
        etapa.text = ""
        if (comVideo) {
            status.text = "Iniciando o sistema"
            querVideo = true
            videoTocando = true
            fundo.alpha = 0f
            camadas(0f)
            if (superficie != null) abrirVideo()
            // vídeo que não abriu em 4 s (decodificador ocupado/erro): segue sem ele
            postDelayed({ if (videoTocando && mp?.isPlaying != true) fimDoVideo() }, 4000)
        } else {
            if (videoTocando) return // a abertura está tocando: não interrompe
            status.text = "Atualizando a tela"
            fundo.alpha = 1f
            video.alpha = 0f
            camadas(1f)
        }
        anel.rodar(true)
    }

    private fun abrirVideo() {
        val sf = superficie ?: return
        if (!querVideo || mp != null) return
        querVideo = false
        try {
            val p = MediaPlayer()
            mp = p
            p.setSurface(sf)
            p.setDataSource(context, Uri.parse("android.resource://${context.packageName}/${R.raw.exa_intro}"))
            p.setVolume(0f, 0f)
            p.setOnPreparedListener { it.start(); video.alpha = 1f }
            p.setOnCompletionListener { fimDoVideo() }
            p.setOnErrorListener { _, _, _ -> fimDoVideo(); true }
            p.prepareAsync()
        } catch (_: Throwable) { fimDoVideo() }
    }

    /** A abertura acabou: o quadro final fica parado e entram o anel e os textos de verdade. */
    private fun fimDoVideo() {
        if (!videoTocando) return
        fundo.alpha = 1f
        camadas(1f)
        video.animate().alpha(0f).setDuration(450).withEndAction { soltarVideo(); videoTocando = false }.start()
        // sem animação do sistema o withEndAction pode não vir: garante
        postDelayed({ if (videoTocando) { video.alpha = 0f; soltarVideo(); videoTocando = false } }, 900)
    }

    private fun soltarVideo() {
        try { mp?.setOnCompletionListener(null); mp?.stop() } catch (_: Throwable) { }
        try { mp?.release() } catch (_: Throwable) { }
        mp = null
    }

    /** Andamento real vindo da página (0..1) e o que está acontecendo agora. */
    fun progresso(f: Float, titulo: String?, detalhe: String?) {
        anel.alvo = f.coerceIn(0f, 1f)
        if (!titulo.isNullOrBlank() && !videoTocando) status.text = titulo
        if (detalhe != null && !videoTocando) etapa.text = detalhe
    }

    /** Some suavemente — nunca no meio da abertura. */
    fun esconder(depois: (() -> Unit)? = null) {
        if (!tocando) { depois?.invoke(); return }
        cancelarEsconder()
        val r = object : Runnable {
            override fun run() {
                if (videoTocando) { postDelayed(this, 300); return }
                anel.alvo = 1f
                animate().alpha(0f).setDuration(700).start()
                postDelayed({
                    if (sumir !== this) return@postDelayed
                    sumir = null
                    visibility = View.GONE
                    alpha = 1f
                    tocando = false
                    anel.rodar(false)
                    depois?.invoke()
                }, 750)
            }
        }
        sumir = r
        // a tela de carregamento fica pelo menos 1,5 s (sem piscar)
        postDelayed(r, maxOf(0L, 1500L - (System.currentTimeMillis() - comecouEm)))
    }

    /** A página avisou que ainda não está pronta de verdade: cancela um sumiço agendado. */
    fun cancelarEsconder() {
        sumir?.let { removeCallbacks(it) }
        sumir = null
        if (tocando) { animate().cancel(); alpha = 1f; visibility = View.VISIBLE }
    }

    private fun garantirAnimacoes() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 26 && ValueAnimator.areAnimatorsEnabled()) return
            ValueAnimator::class.java.getMethod("setDurationScale", Float::class.javaPrimitiveType).invoke(null, 1f)
        } catch (_: Throwable) { }
    }

    fun parar() {
        anel.rodar(false)
        soltarVideo()
        videoTocando = false
        animate().cancel()
    }

    /** Anel de progresso em volta do logo (sobre o círculo interno do vídeo) + um cometa girando no círculo de fora. */
    class Anel(ctx: Context, private val dono: Intro) : View(ctx) {
        private val pTitulo = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE; textAlign = Paint.Align.CENTER; typeface = Typeface.create("sans-serif", Typeface.BOLD) }
        private val pEtapa = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(205, 255, 255, 255); textAlign = Paint.Align.CENTER; typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL) }
        private val pMarca = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(120, 255, 255, 255); textAlign = Paint.Align.CENTER; typeface = Typeface.create("sans-serif", Typeface.NORMAL) }
        private var cx = 0f; private var cy = 0f; private var s = 1f
        private val trilho = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; color = Color.argb(34, 255, 255, 255); strokeCap = Paint.Cap.ROUND }
        private val arco = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeCap = Paint.Cap.ROUND }
        private val cometa = Paint(Paint.ANTI_ALIAS_FLAG)
        private val halo = Paint(Paint.ANTI_ALIAS_FLAG)
        private val r1 = RectF()
        private var mostrado = 0f
        var alvo = 0f
        private var ativo = false
        private var t0 = System.nanoTime()

        fun encaixar(x: Float, y: Float, esc: Float) {
            cx = x; cy = y; s = esc
            pTitulo.textSize = 58f * s; pEtapa.textSize = 34f * s; pMarca.textSize = 28f * s
            trilho.strokeWidth = 5f * s
            arco.strokeWidth = 7f * s
            arco.shader = SweepGradient(cx, cy, intArrayOf(Color.rgb(234, 37, 29), Color.rgb(255, 120, 100), Color.WHITE, Color.rgb(234, 37, 29)), floatArrayOf(0f, 0.45f, 0.8f, 1f))
            invalidate()
        }

        fun zerar() { mostrado = 0f; alvo = 0f; t0 = System.nanoTime() }
        fun rodar(sim: Boolean) { ativo = sim; if (sim) invalidate() }

        override fun onDraw(c: Canvas) {
            if (s <= 0f) return
            // o anel anda suave até o valor real (nunca passa dele)
            mostrado += (alvo - mostrado) * 0.06f
            val r = 310f * s
            r1.set(cx - r, cy - r, cx + r, cy + r)
            c.drawCircle(cx, cy, r, trilho)
            if (mostrado > 0.003f) {
                c.save(); c.rotate(-90f, cx, cy)
                c.drawArc(r1, 0f, 360f * mostrado, false, arco)
                c.restore()
            }
            // textos (mesma posição do "Iniciando o sistema" do vídeo): etapa, detalhe e a marca
            if (dono.status.visibility == View.VISIBLE) c.drawText(dono.status.text.toString(), cx, cy + (1492f - 850f) * s, pTitulo)
            c.drawText(dono.etapa.text.toString(), cx, cy + (1576f - 850f) * s, pEtapa)
            c.drawText(dono.marca.text.toString(), cx, cy + (1640f - 850f) * s, pMarca)
            // cometa: uma volta a cada 3,2 s no círculo de fora
            val t = (System.nanoTime() - t0) / 1e9f
            val ang = Math.toRadians((t / 3.2f * 360f - 90f).toDouble())
            val rc = 365f * s
            val x = cx + rc * Math.cos(ang).toFloat(); val y = cy + rc * Math.sin(ang).toFloat()
            halo.color = Color.argb(60, 255, 255, 255)
            c.drawCircle(x, y, 16f * s, halo)
            cometa.color = Color.WHITE
            c.drawCircle(x, y, 5f * s, cometa)
            // ~30 quadros/s bastam para o anel e poupam a TV box (a página está carregando atrás)
            if (ativo) postInvalidateDelayed(if (alpha < 0.01f) 250L else 33L)
        }
    }
}
