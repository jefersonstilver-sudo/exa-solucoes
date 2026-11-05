package br.com.examidia.tela

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Rect
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.view.PixelCopy
import android.view.Surface
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Grava a própria tela do app (sem pedir nada a ninguém) e manda para a EXA.
 * Copia a janela ~8 vezes por segundo (PixelCopy, Android 8+), em 960x540, e codifica em H.264 (MP4).
 * Serve para ver o layout, telas pretas, travadas e erros. A fluidez fina vem dos números da saúde.
 */
class Gravador(private val act: Activity, private val fim: (JSONObject) -> Unit) {

    @Volatile var gravando = false
        private set

    fun gravar(segundos: Int, urlEnvio: String, caminho: String) {
        if (gravando) return
        if (Build.VERSION.SDK_INT < 26) { fim(JSONObject().put("ok", false).put("erro", "Android antigo (precisa 8+)").put("caminho", caminho)); return }
        gravando = true
        val seg = segundos.coerceIn(5, 60)
        val fps = 8
        val L = 960; val A = 540
        val arq = File(act.cacheDir, "gravacao.mp4")
        arq.delete()
        val thread = HandlerThread("gravador").also { it.start() }
        val bg = Handler(thread.looper)
        val principal = Handler(Looper.getMainLooper())
        val inicio = System.currentTimeMillis()
        var quadros = 0; var falhas = 0
        var codec: MediaCodec? = null; var sup: Surface? = null; var muxer: MediaMuxer? = null
        var trilha = -1; var muxerOk = false
        val info = MediaCodec.BufferInfo()

        fun drenar(final: Boolean) {
            val c = codec ?: return
            var vazios = 0
            while (true) {
                val i = c.dequeueOutputBuffer(info, if (final) 10_000 else 0)
                if (i == MediaCodec.INFO_TRY_AGAIN_LATER) { if (!final || ++vazios > 300) return else continue }
                if (i == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) { trilha = muxer!!.addTrack(c.outputFormat); muxer!!.start(); muxerOk = true; continue }
                if (i < 0) continue
                val buf = c.getOutputBuffer(i)
                if (buf != null && info.size > 0 && muxerOk && (info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) == 0) {
                    buf.position(info.offset); buf.limit(info.offset + info.size)
                    muxer!!.writeSampleData(trilha, buf, info)
                }
                c.releaseOutputBuffer(i, false)
                if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) return
            }
        }

        fun encerrar(erro: String?) {
            bg.post {
                var ok = erro == null
                var msg = erro
                try {
                    codec?.signalEndOfInputStream()
                    drenar(true)
                } catch (e: Throwable) { if (msg == null) msg = "fim: ${e.message}"; ok = false }
                try { codec?.stop() } catch (_: Throwable) {}
                try { codec?.release() } catch (_: Throwable) {}
                try { sup?.release() } catch (_: Throwable) {}
                try { if (muxerOk) muxer?.stop() } catch (_: Throwable) {}
                try { muxer?.release() } catch (_: Throwable) {}
                val r = JSONObject().put("caminho", caminho).put("segundos", seg).put("quadros", quadros).put("falhas_copia", falhas)
                if (ok && muxerOk && arq.length() > 0) {
                    try {
                        val cn = URL(urlEnvio).openConnection() as HttpURLConnection
                        cn.requestMethod = "PUT"; cn.doOutput = true
                        cn.connectTimeout = 20000; cn.readTimeout = 120000
                        cn.setRequestProperty("Content-Type", "video/mp4")
                        cn.setRequestProperty("x-upsert", "true")
                        cn.setFixedLengthStreamingMode(arq.length())
                        arq.inputStream().use { inp -> cn.outputStream.use { inp.copyTo(it) } }
                        val code = cn.responseCode
                        r.put("ok", code in 200..299).put("http", code).put("bytes", arq.length())
                        if (code !in 200..299) r.put("erro", "envio HTTP $code: " + (try { cn.errorStream?.bufferedReader()?.readText()?.take(200) } catch (_: Throwable) { "" }))
                        cn.disconnect()
                    } catch (e: Throwable) { r.put("ok", false).put("erro", "envio: ${e.message}") }
                } else r.put("ok", false).put("erro", msg ?: "nada gravado")
                arq.delete()
                gravando = false
                principal.post { fim(r) }
                thread.quitSafely()
            }
        }

        try {
            val fmt = MediaFormat.createVideoFormat("video/avc", L, A)
            fmt.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
            fmt.setInteger(MediaFormat.KEY_BIT_RATE, 1_800_000)
            fmt.setInteger(MediaFormat.KEY_FRAME_RATE, fps)
            fmt.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 2)
            codec = MediaCodec.createEncoderByType("video/avc")
            codec!!.configure(fmt, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            sup = codec!!.createInputSurface()
            codec!!.start()
            muxer = MediaMuxer(arq.path, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
        } catch (e: Throwable) { encerrar("codificador: ${e.message}"); return }

        val bmp = Bitmap.createBitmap(L, A, Bitmap.Config.ARGB_8888)
        val destino = Rect(0, 0, L, A)
        var ocupado = false
        val passo = object : Runnable {
            override fun run() {
                if (System.currentTimeMillis() - inicio >= seg * 1000L) { encerrar(null); return }
                principal.postDelayed(this, (1000 / fps).toLong())
                if (ocupado) return
                ocupado = true
                try {
                    PixelCopy.request(act.window, bmp, { res ->
                        if (res == PixelCopy.SUCCESS) {
                            bg.post {
                                try {
                                    val cv = if (Build.VERSION.SDK_INT >= 23) sup!!.lockHardwareCanvas() else sup!!.lockCanvas(null)
                                    cv.drawBitmap(bmp, null, destino, null)
                                    sup!!.unlockCanvasAndPost(cv)
                                    quadros++
                                    drenar(false)
                                } catch (_: Throwable) { falhas++ }
                                ocupado = false
                            }
                        } else { falhas++; ocupado = false }
                    }, bg)
                } catch (_: Throwable) { falhas++; ocupado = false }
            }
        }
        principal.post(passo)
    }
}
