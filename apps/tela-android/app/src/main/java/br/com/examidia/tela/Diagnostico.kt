package br.com.examidia.tela

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.media.MediaCodecList
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Debug
import android.os.Environment
import android.os.PowerManager
import android.os.Process
import android.os.StatFs
import android.os.SystemClock
import android.util.DisplayMetrics
import android.view.Choreographer
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Tudo o que dá para saber do aparelho, como nos NUCs: hardware (uma vez) e saúde (a cada minuto).
 * Nada aqui pede permissão especial; o que o aparelho não deixa ler fica de fora (nunca quebra).
 */
object Diagnostico {

    private fun ler(caminho: String): String? = try { File(caminho).readText().trim() } catch (_: Throwable) { null }

    private fun cpuinfo(): Map<String, String> {
        val m = LinkedHashMap<String, String>()
        try {
            File("/proc/cpuinfo").forEachLine { l ->
                val i = l.indexOf(':')
                if (i > 0) {
                    val k = l.substring(0, i).trim()
                    val v = l.substring(i + 1).trim()
                    if (k.isNotEmpty() && v.isNotEmpty() && !m.containsKey(k)) m[k] = v
                }
            }
        } catch (_: Throwable) {}
        return m
    }

    private fun nucleos(): Int = Runtime.getRuntime().availableProcessors()

    private fun freqMhz(cpu: Int, arquivo: String): Int? =
        ler("/sys/devices/system/cpu/cpu$cpu/cpufreq/$arquivo")?.toLongOrNull()?.let { (it / 1000).toInt() }

    /** Decodificadores de vídeo do aparelho (hardware), com o maior tamanho que cada um aguenta. */
    private fun decodificadores(): JSONArray {
        val a = JSONArray()
        try {
            val lista = MediaCodecList(MediaCodecList.REGULAR_CODECS).codecInfos
            for (c in lista) {
                if (c.isEncoder) continue
                val nome = c.name
                val sw = nome.startsWith("OMX.google.") || nome.startsWith("c2.android.")
                for (t in c.supportedTypes) {
                    if (!t.startsWith("video/")) continue
                    val o = JSONObject().put("nome", nome).put("tipo", t).put("software", sw)
                    try {
                        val vc = c.getCapabilitiesForType(t).videoCapabilities
                        if (vc != null) o.put("max", "${vc.supportedWidths.upper}x${vc.supportedHeights.upper}")
                            .put("max_fps_1080p", try { vc.getSupportedFrameRatesFor(1920, 1080).upper.toInt() } catch (_: Throwable) { JSONObject.NULL })
                    } catch (_: Throwable) {}
                    a.put(o)
                }
            }
        } catch (_: Throwable) {}
        return a
    }

    private fun armazenamento(): Pair<Long, Long> = try {
        val s = StatFs(Environment.getDataDirectory().path)
        Pair(s.blockCountLong * s.blockSizeLong / 1048576, s.availableBlocksLong * s.blockSizeLong / 1048576)
    } catch (_: Throwable) { Pair(0L, 0L) }

    private fun rede(ctx: Context): JSONObject {
        val o = JSONObject()
        try {
            val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            if (Build.VERSION.SDK_INT >= 23) {
                val caps = cm.getNetworkCapabilities(cm.activeNetwork)
                o.put("tipo", when {
                    caps == null -> "sem rede"
                    caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "cabo"
                    caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "Wi-Fi"
                    caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "dados móveis"
                    else -> "outra"
                })
                if (caps != null) o.put("banda_kbps", caps.linkDownstreamBandwidthKbps)
            } else {
                @Suppress("DEPRECATION")
                o.put("tipo", cm.activeNetworkInfo?.typeName ?: "sem rede")
            }
        } catch (_: Throwable) {}
        try {
            val wm = ctx.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            @Suppress("DEPRECATION")
            val wi = wm.connectionInfo
            if (wi != null && wi.networkId != -1) {
                o.put("wifi_sinal_dbm", wi.rssi)
                    .put("wifi_velocidade_mbps", wi.linkSpeed)
                if (Build.VERSION.SDK_INT >= 21) o.put("wifi_frequencia_mhz", wi.frequency)
            }
        } catch (_: Throwable) {}
        return o
    }

    /** Temperaturas que o aparelho deixa ler (°C), por sensor. */
    private fun temperaturas(): JSONObject {
        val o = JSONObject()
        try {
            val zonas = File("/sys/class/thermal").listFiles { f -> f.name.startsWith("thermal_zone") } ?: return o
            for (z in zonas.sortedBy { it.name }) {
                val bruto = ler("${z.path}/temp")?.toDoubleOrNull() ?: continue
                val c = if (bruto > 1000) bruto / 1000.0 else bruto
                if (c <= 0 || c > 150) continue
                val tipo = (ler("${z.path}/type") ?: z.name).take(30)
                o.put(tipo, Math.round(c * 10) / 10.0)
            }
        } catch (_: Throwable) {}
        return o
    }

    /** Hardware e sistema (manda junto do resto do infoAparelho, a cada 30 min). */
    fun hardware(act: Activity): JSONObject {
        val j = JSONObject()
        try {
            val ci = cpuinfo()
            val n = nucleos()
            val maxes = JSONArray()
            for (i in 0 until n) maxes.put(freqMhz(i, "cpuinfo_max_freq") ?: JSONObject.NULL)
            val am = act.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val mi = ActivityManager.MemoryInfo(); am.getMemoryInfo(mi)
            val (tot, livre) = armazenamento()
            val dm = DisplayMetrics()
            @Suppress("DEPRECATION")
            val disp = act.windowManager.defaultDisplay
            @Suppress("DEPRECATION")
            disp.getRealMetrics(dm)
            val modos = JSONArray()
            if (Build.VERSION.SDK_INT >= 23) for (md in disp.supportedModes) modos.put("${md.physicalWidth}x${md.physicalHeight}@${Math.round(md.refreshRate)}")
            j.put("marca", Build.BRAND)
                .put("aparelho", Build.DEVICE)
                .put("produto", Build.PRODUCT)
                .put("placa", Build.BOARD)
                .put("hardware", Build.HARDWARE)
                .put("soc", if (Build.VERSION.SDK_INT >= 31) "${Build.SOC_MANUFACTURER} ${Build.SOC_MODEL}" else (ci["Hardware"] ?: ci["model name"] ?: ""))
                .put("abis", Build.SUPPORTED_ABIS.joinToString(","))
                .put("cpu_nucleos", n)
                .put("cpu_max_mhz", maxes)
                .put("cpu_modelo", ci["model name"] ?: ci["Processor"] ?: "")
                .put("cpu_parte", ci["CPU part"] ?: "")
                .put("kernel", System.getProperty("os.version") ?: "")
                .put("build", Build.DISPLAY)
                .put("patch_seguranca", if (Build.VERSION.SDK_INT >= 23) Build.VERSION.SECURITY_PATCH else "")
                .put("memoria_mb", mi.totalMem / 1048576)
                .put("memoria_livre_mb", mi.availMem / 1048576)
                .put("memoria_limite_baixa_mb", mi.threshold / 1048576)
                .put("memoria_app_limite_mb", am.memoryClass)
                .put("memoria_app_grande_mb", am.largeMemoryClass)
                .put("aparelho_pouca_memoria", am.isLowRamDevice)
                .put("armazenamento_mb", tot)
                .put("armazenamento_livre_mb", livre)
                .put("tela_px", "${dm.widthPixels}x${dm.heightPixels}")
                .put("tela_hz", Math.round(disp.refreshRate))
                .put("tela_modos", modos)
                .put("decodificadores", decodificadores())
                .put("rede", rede(act))
                .put("ligado_min", SystemClock.elapsedRealtime() / 60000)
        } catch (_: Throwable) {}
        return j
    }

    // ---------------------------------------------------------------- saúde (a cada batimento)
    private var cpuAppAnt = 0L
    private var paredeAnt = 0L

    /** Quadros do app (thread principal): conta os que passaram de 50 ms. */
    private var quadros = 0
    private var travadas = 0
    private var piorQuadroMs = 0L
    private var ultimoVsync = 0L
    private var vigiando = false
    fun vigiarQuadros() {
        if (vigiando) return
        vigiando = true
        val cb = object : Choreographer.FrameCallback {
            override fun doFrame(t: Long) {
                if (ultimoVsync > 0) {
                    val ms = (t - ultimoVsync) / 1_000_000
                    quadros++
                    if (ms > 50) travadas++
                    if (ms > piorQuadroMs) piorQuadroMs = ms
                }
                ultimoVsync = t
                Choreographer.getInstance().postFrameCallback(this)
            }
        }
        Choreographer.getInstance().postFrameCallback(cb)
    }

    fun saude(ctx: Context): JSONObject {
        val j = JSONObject()
        try {
            val n = nucleos()
            val agora = JSONArray()
            for (i in 0 until n) agora.put(freqMhz(i, "scaling_cur_freq") ?: JSONObject.NULL)
            val cpuApp = Process.getElapsedCpuTime()
            val parede = SystemClock.elapsedRealtime()
            val pct = if (paredeAnt > 0 && parede > paredeAnt) ((cpuApp - cpuAppAnt) * 100.0 / ((parede - paredeAnt) * n)) else null
            cpuAppAnt = cpuApp; paredeAnt = parede
            val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val mi = ActivityManager.MemoryInfo(); am.getMemoryInfo(mi)
            val dmi = Debug.MemoryInfo(); Debug.getMemoryInfo(dmi)
            val (_, livre) = armazenamento()
            j.put("cpu_mhz", agora)
                .put("cpu_app_pct", if (pct != null) Math.round(pct * 10) / 10.0 else JSONObject.NULL)
                .put("carga", ler("/proc/loadavg")?.split(" ")?.take(3)?.joinToString(" ") ?: JSONObject.NULL)
                .put("temperaturas", temperaturas())
                .put("memoria_livre_mb", mi.availMem / 1048576)
                .put("memoria_baixa", mi.lowMemory)
                .put("memoria_app_mb", dmi.totalPss / 1024)
                .put("armazenamento_livre_mb", livre)
                .put("rede", rede(ctx))
                .put("ligado_min", SystemClock.elapsedRealtime() / 60000)
                .put("app_quadros", quadros)
                .put("app_travadas_50ms", travadas)
                .put("app_pior_quadro_ms", piorQuadroMs)
            if (Build.VERSION.SDK_INT >= 29) {
                val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
                j.put("aquecimento", when (pm.currentThermalStatus) {
                    PowerManager.THERMAL_STATUS_NONE -> "normal"
                    PowerManager.THERMAL_STATUS_LIGHT -> "leve"
                    PowerManager.THERMAL_STATUS_MODERATE -> "moderado"
                    PowerManager.THERMAL_STATUS_SEVERE -> "forte"
                    PowerManager.THERMAL_STATUS_CRITICAL -> "crítico"
                    else -> "desligando"
                })
            }
            quadros = 0; travadas = 0; piorQuadroMs = 0
        } catch (_: Throwable) {}
        return j
    }
}
