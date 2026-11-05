package br.com.examidia.entrada

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.tv.TvContract
import android.media.tv.TvInputInfo
import android.media.tv.TvInputManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log

/**
 * Escolhe a entrada: HDMI 2 com sinal → HDMI 2; senão HDMI 1 com sinal → HDMI 1; nada com sinal → HDMI 2.
 * Depois de ligar, o TV box ainda está acordando: tenta por até 90 s antes de desistir do HDMI 2.
 */
object Escolha {
    private const val TAG = "EXA-Entrada"

    /** Número da porta HDMI pelo nome ("HDMI 2", "HDMI2") ou pelo id do serviço (MediaTek: .../HW4 = 1, .../HW5 = 2). */
    fun porta(ctx: Context, i: TvInputInfo): Int {
        val nome = try { i.loadLabel(ctx).toString() } catch (_: Throwable) { "" }
        Regex("""HDMI\s*(\d)""", RegexOption.IGNORE_CASE).find(nome)?.let { return it.groupValues[1].toInt() }
        Regex("""HW(\d+)$""").find(i.id)?.let { return it.groupValues[1].toInt() - 3 }
        Regex("""HDMI(\d)""", RegexOption.IGNORE_CASE).find(i.id)?.let { return it.groupValues[1].toInt() }
        return -1
    }

    fun hdmis(ctx: Context): Map<Int, TvInputInfo> {
        val tim = ctx.getSystemService(Context.TV_INPUT_SERVICE) as? TvInputManager ?: return emptyMap()
        val m = mutableMapOf<Int, TvInputInfo>()
        for (i in tim.tvInputList) {
            if (i.type != TvInputInfo.TYPE_HDMI || i.parentId != null) continue
            val p = porta(ctx, i)
            if (p > 0 && !m.containsKey(p)) m[p] = i
        }
        return m
    }

    fun comSinal(ctx: Context, i: TvInputInfo): Boolean = try {
        val tim = ctx.getSystemService(Context.TV_INPUT_SERVICE) as TvInputManager
        tim.getInputState(i.id) == TvInputManager.INPUT_STATE_CONNECTED
    } catch (_: Throwable) { false }

    fun abrir(ctx: Context, i: TvInputInfo) {
        Log.i(TAG, "abrindo ${i.id}")
        val it = Intent(Intent.ACTION_VIEW, TvContract.buildChannelUriForPassthroughInput(i.id))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        try { ctx.startActivity(it) } catch (e: Throwable) { Log.e(TAG, "não abriu ${i.id}", e) }
    }

    /** tentativa: 0..N; segue chamando até achar o HDMI 2 com sinal ou dar o tempo. */
    fun escolher(ctx: Context, tentativa: Int = 0) {
        val h = Handler(Looper.getMainLooper())
        val m = hdmis(ctx)
        val h2 = m[2]; val h1 = m[1]
        when {
            h2 != null && comSinal(ctx, h2) -> abrir(ctx, h2)
            tentativa < 30 -> h.postDelayed({ escolher(ctx, tentativa + 1) }, 3000)
            h1 != null && comSinal(ctx, h1) -> abrir(ctx, h1)
            h2 != null -> abrir(ctx, h2)
            h1 != null -> abrir(ctx, h1)
            else -> Log.w(TAG, "nenhuma entrada HDMI encontrada")
        }
        // nos primeiros segundos já mostra o HDMI 2 (se existir), sem esperar o sinal: evita ficar na tela inicial
        if (tentativa == 0 && h2 != null && !comSinal(ctx, h2)) abrir(ctx, h2)
    }
}

class Entrada : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val m = Escolha.hdmis(this)
        // aberto à mão: escolhe na hora (HDMI 2 com sinal, senão HDMI 1)
        val h2 = m[2]; val h1 = m[1]
        when {
            h2 != null && Escolha.comSinal(this, h2) -> Escolha.abrir(this, h2)
            h1 != null && Escolha.comSinal(this, h1) -> Escolha.abrir(this, h1)
            h2 != null -> Escolha.abrir(this, h2)
            h1 != null -> Escolha.abrir(this, h1)
        }
        finish()
    }
}

class AoLigar : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        val p = goAsync()
        val app = ctx.applicationContext
        Handler(Looper.getMainLooper()).postDelayed({
            try { Escolha.escolher(app) } finally { p.finish() }
        }, if (Build.VERSION.SDK_INT >= 26) 4000 else 2000)
    }
}
