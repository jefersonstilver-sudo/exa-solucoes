package br.com.examidia.tela

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.animation.LinearInterpolator
import android.view.animation.PathInterpolator
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Intro da EXA desenhada pelo próprio app (não depende do navegador do aparelho):
 * luzes vermelha e magenta acendendo, a logo subindo com um brilho que passa por ela, um traço que vira
 * barra de carregamento e "EXA Mídia · Foz do Iguaçu". Fica em loop suave até a página avisar que abriu.
 * Só anima transform/opacidade (leve em TV box fraco). Embaixo, a linha de status e o painel de diagnóstico.
 */
class Intro(ctx: Context) : FrameLayout(ctx) {

    private val suave = PathInterpolator(0.2f, 0.8f, 0.2f, 1f)
    private val rapido = PathInterpolator(0.7f, 0f, 0.2f, 1f)
    private val animadores = mutableListOf<ValueAnimator>()

    private val luzA = View(ctx)
    private val luzB = View(ctx)
    private val logo = LogoComBrilho(ctx)
    private val trilho = FrameLayout(ctx)
    private val traco = View(ctx)
    private val corredor = View(ctx)
    private val frase = TextView(ctx)
    val status = TextView(ctx)
    val diag = LinearLayout(ctx)
    val diagTitulo = TextView(ctx)
    val diagTexto = TextView(ctx)
    val diagBotoes = LinearLayout(ctx)

    var tocando = false
        private set
    var comecouEm = 0L
        private set

    init {
        setBackgroundColor(Color.rgb(7, 3, 10))
        isClickable = true // por cima da página: segura os toques enquanto aparece
        clipChildren = true

        luzA.background = radial(Color.argb(150, 234, 37, 29))
        luzB.background = radial(Color.argb(150, 156, 30, 110))
        addView(luzA)
        addView(luzB)

        trilho.background = GradientDrawable().apply { setColor(Color.argb(26, 255, 255, 255)); cornerRadius = 8f }
        traco.background = GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT, intArrayOf(Color.rgb(234, 37, 29), Color.rgb(255, 90, 74), Color.rgb(255, 195, 90)))
        corredor.background = GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT, intArrayOf(Color.argb(0, 255, 90, 74), Color.rgb(255, 90, 74), Color.rgb(255, 195, 90), Color.argb(0, 255, 195, 90)))
        trilho.addView(traco, LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        trilho.addView(corredor)

        frase.text = "EXAMIDIA.COM.BR"
        frase.setTextColor(Color.argb(200, 255, 255, 255))
        frase.typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
        frase.gravity = Gravity.CENTER
        frase.isSingleLine = true

        status.setTextColor(Color.argb(140, 255, 255, 255))
        status.gravity = Gravity.CENTER
        status.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        status.text = "Preparando a tela"

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
        diag.addView(diagTitulo)
        diag.addView(diagTexto)
        diag.addView(diagBotoes)

        addView(logo)
        addView(trilho)
        addView(frase)
        addView(status)
        addView(diag)
    }

    private fun radial(cor: Int) = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        gradientType = GradientDrawable.RADIAL_GRADIENT
        colors = intArrayOf(cor, Color.argb(0, Color.red(cor), Color.green(cor), Color.blue(cor)))
        gradientRadius = 1000f // ajustado no onLayout
    }

    /** Tamanhos proporcionais à tela (como vmin na web): fica igual em TV 720p, 1080p e 4K. */
    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w == 0 || h == 0) return
        val u = minOf(w, h) / 100f
        val luz = (120 * u).toInt()
        luzA.layoutParams = LayoutParams(luz, luz).apply { leftMargin = (-30 * u).toInt(); topMargin = h - luz + (62 * u).toInt() }
        luzB.layoutParams = LayoutParams(luz, luz).apply { leftMargin = w - luz + (38 * u).toInt(); topMargin = (-60 * u).toInt() }
        (luzA.background as GradientDrawable).gradientRadius = luz / 2f
        (luzB.background as GradientDrawable).gradientRadius = luz / 2f

        val lh = (15 * u).toInt()
        val lw = (lh * 1000f / 324f).toInt()
        val meio = h / 2
        logo.layoutParams = LayoutParams(lw, lh).apply { gravity = Gravity.CENTER_HORIZONTAL; topMargin = meio - (13 * u).toInt() }
        trilho.layoutParams = LayoutParams((44 * u).toInt(), maxOf(2, (0.45f * u).toInt())).apply { gravity = Gravity.CENTER_HORIZONTAL; topMargin = meio + (7 * u).toInt() }
        corredor.layoutParams = LayoutParams((13 * u).toInt(), ViewGroup.LayoutParams.MATCH_PARENT)
        frase.setTextSize(TypedValue.COMPLEX_UNIT_PX, 1.9f * u)
        frase.layoutParams = LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { topMargin = meio + (10.5f * u).toInt() }
        status.setTextSize(TypedValue.COMPLEX_UNIT_PX, 1.8f * u)
        status.layoutParams = LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM).apply { bottomMargin = (6 * u).toInt() }

        diagTitulo.setTextSize(TypedValue.COMPLEX_UNIT_PX, 3f * u)
        diagTexto.setTextSize(TypedValue.COMPLEX_UNIT_PX, 2f * u)
        diagTexto.setLineSpacing(0f, 1.25f)
        diagTexto.setPadding(0, (1.4f * u).toInt(), 0, (2.2f * u).toInt())
        val pad = (3f * u).toInt()
        diag.setPadding(pad, (2.6f * u).toInt(), pad, (2.6f * u).toInt())
        diag.layoutParams = LayoutParams((w * 0.74f).toInt(), ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply { bottomMargin = (5 * u).toInt() }
        unidade = u
        post { if (!tocando) estadoInicial() }
    }

    var unidade = 10f
        private set

    private fun estadoInicial() {
        luzA.alpha = 0f; luzB.alpha = 0f
        logo.alpha = 0f; logo.translationY = 4 * unidade; logo.scaleX = 0.88f; logo.scaleY = 0.88f
        traco.pivotX = 0f; traco.scaleX = 0f; traco.alpha = 1f
        corredor.alpha = 0f
        frase.alpha = 0f
        status.alpha = 0f
    }

    /** Toca a intro desde o começo (abrir o app, depois de instalar/atualizar, ao recarregar a página). */
    fun tocar() {
        garantirAnimacoes()
        parar()
        visibility = View.VISIBLE
        alpha = 1f; scaleX = 1f; scaleY = 1f
        diag.visibility = View.GONE
        status.text = "Preparando a tela"
        tocando = true
        comecouEm = System.currentTimeMillis()
        estadoInicial()

        luzA.animate().alpha(1f).setStartDelay(100).setDuration(1600).start()
        luzB.animate().alpha(1f).setStartDelay(350).setDuration(1600).start()
        anim(9000, 1700, ValueAnimator.REVERSE) { v -> luzA.translationX = 14 * unidade * v; luzA.translationY = -8 * unidade * v; luzA.scaleX = 1 + .12f * v; luzA.scaleY = 1 + .12f * v }
        anim(11000, 2000, ValueAnimator.REVERSE) { v -> luzB.translationX = -12 * unidade * v; luzB.translationY = 10 * unidade * v; luzB.scaleX = 1 + .08f * v; luzB.scaleY = 1 + .08f * v }

        logo.animate().alpha(1f).translationY(0f).scaleX(1f).scaleY(1f).setStartDelay(350).setDuration(1100).setInterpolator(suave).start()
        // brilho: passa pela logo e espera, a cada 4,6 s
        anim(4600, 1250, ValueAnimator.RESTART, PathInterpolator(0.5f, 0f, 0.2f, 1f)) { v -> logo.fase = -0.6f + v * 5f; logo.invalidate() }

        traco.animate().scaleX(1f).setStartDelay(150).setDuration(1000).setInterpolator(rapido).withEndAction {
            traco.animate().alpha(0.18f).setStartDelay(450).setDuration(600).start()
        }.start()
        corredor.animate().alpha(1f).setStartDelay(1700).setDuration(400).start()
        anim(1500, 1700, ValueAnimator.RESTART, PathInterpolator(0.45f, 0f, 0.25f, 1f)) { v ->
            val tw = trilho.width.toFloat(); val cw = corredor.width.toFloat()
            corredor.translationX = -cw + (tw + cw) * v
        }

        if (android.os.Build.VERSION.SDK_INT >= 21) {
            anim(1300, 1050, 0, suave, repetir = false) { v -> frase.letterSpacing = 1.2f - 0.65f * v; frase.alpha = v }
        }
        status.animate().alpha(1f).setStartDelay(2200).setDuration(800).start()
    }

    /** Some suavemente (a intro toca pelo menos uma vez inteira, ~2,8 s). */
    fun esconder(depois: (() -> Unit)? = null) {
        if (!tocando) { depois?.invoke(); return }
        val falta = maxOf(0L, 3800L - (System.currentTimeMillis() - comecouEm))
        postDelayed({
            animate().alpha(0f).scaleX(1.06f).scaleY(1.06f).setStartDelay(0).setDuration(800).setInterpolator(suave).setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    animate().setListener(null)
                    visibility = View.GONE
                    tocando = false
                    parar()
                    depois?.invoke()
                }
            }).start()
        }, falta)
    }

    /** TV box costuma vir com as animações do sistema desligadas (escala 0): aí todo ValueAnimator pula para o fim e a intro congela. */
    private fun garantirAnimacoes() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 26 && ValueAnimator.areAnimatorsEnabled()) return
            ValueAnimator::class.java.getMethod("setDurationScale", Float::class.javaPrimitiveType).invoke(null, 1f)
        } catch (_: Throwable) { }
    }

    fun parar() {
        animadores.forEach { it.cancel() }
        animadores.clear()
        listOf<View>(luzA, luzB, logo, traco, corredor, frase, status, this).forEach { it.animate().cancel() }
    }

    private fun anim(
        duracao: Long, atraso: Long, modo: Int, interp: android.animation.TimeInterpolator = LinearInterpolator(),
        repetir: Boolean = true, f: (Float) -> Unit,
    ) {
        val a = ValueAnimator.ofFloat(0f, 1f)
        a.duration = duracao
        a.startDelay = atraso
        a.interpolator = interp
        if (repetir) { a.repeatCount = ValueAnimator.INFINITE; a.repeatMode = if (modo == 0) ValueAnimator.RESTART else modo }
        a.addUpdateListener { f(it.animatedValue as Float) }
        a.start()
        animadores.add(a)
    }

    /** A logo da EXA com um brilho dourado recortado no formato das letras. */
    class LogoComBrilho(ctx: Context) : View(ctx) {
        private val bmp: Bitmap? = try { BitmapFactory.decodeResource(ctx.resources, R.drawable.exa_logo) } catch (_: Throwable) { null }
        private val pLogo = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
        private val pBrilho = Paint(Paint.ANTI_ALIAS_FLAG).apply { xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_ATOP) }
        private val r = RectF()
        var fase = -1f

        init { setLayerType(View.LAYER_TYPE_HARDWARE, null) }

        override fun onDraw(c: Canvas) {
            val b = bmp ?: return
            r.set(0f, 0f, width.toFloat(), height.toFloat())
            val camada = c.saveLayer(r, null)
            c.drawBitmap(b, null, r, pLogo)
            if (fase > -0.5f && fase < 1.5f) {
                val w = width * 0.35f
                val x = fase * width
                pBrilho.shader = LinearGradient(x - w / 2, 0f, x + w / 2, height * 0.35f,
                    intArrayOf(Color.argb(0, 255, 255, 255), Color.argb(242, 255, 215, 160), Color.argb(0, 255, 255, 255)), null, Shader.TileMode.CLAMP)
                c.drawRect(r, pBrilho)
            }
            c.restoreToCount(camada)
        }
    }
}
