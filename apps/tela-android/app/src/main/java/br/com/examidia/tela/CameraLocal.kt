package br.com.examidia.tela

import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Câmera IP ao vivo só na rede local (06/11/2026, teste Tapo C510W).
 *
 * A página da tela (https) pede https://lan.exa.local/<ip>/<porta>/<caminho> e o app busca
 * http://<ip>:<porta>/<caminho> na rede da própria TV (o servidor ao vivo do PC/aparelho ao lado da câmera).
 * O vídeo nunca sai da rede local: nenhum servidor da EXA vê ou grava a imagem, e nenhuma outra tela consegue
 * abrir esse endereço (só este app sabe o que é lan.exa.local). Só GET e só IPs de rede privada.
 * Socket simples (HTTP/1.0) para não liberar tráfego sem criptografia no app inteiro.
 */
object CameraLocal {
    const val HOST = "lan.exa.local"
    private val PRIVADO = Regex("^(10\\.\\d{1,3}|192\\.168|172\\.(1[6-9]|2\\d|3[01]))\\.\\d{1,3}\\.\\d{1,3}$")

    private val TIPOS = mapOf(
        "m3u8" to "application/vnd.apple.mpegurl", "mp4" to "video/mp4", "m4s" to "video/iso.segment",
        "ts" to "video/mp2t", "aac" to "audio/aac",
    )

    fun atender(req: WebResourceRequest?): WebResourceResponse? {
        if (req == null) return null
        val u = req.url ?: return null
        if (u.host != HOST) return null
        if (req.method != "GET") return resposta(405, "text/plain", ByteArray(0))
        return try { buscar(u) } catch (e: Exception) { resposta(502, "text/plain", (e.message ?: "erro").toByteArray()) }
    }

    private fun buscar(u: Uri): WebResourceResponse {
        val partes = u.pathSegments
        if (partes.size < 3) return resposta(400, "text/plain", ByteArray(0))
        val ip = partes[0]
        val porta = partes[1].toIntOrNull() ?: 0
        if (!PRIVADO.matches(ip) || porta !in 1..65535) return resposta(403, "text/plain", ByteArray(0))
        val caminho = "/" + partes.drop(2).joinToString("/") { Uri.encode(it) } + (u.encodedQuery?.let { "?$it" } ?: "")
        Socket().use { s ->
            s.connect(InetSocketAddress(ip, porta), 3000)
            s.soTimeout = 8000
            s.getOutputStream().apply {
                write("GET $caminho HTTP/1.0\r\nHost: $ip:$porta\r\nConnection: close\r\n\r\n".toByteArray())
                flush()
            }
            val tudo = ByteArrayOutputStream()
            val buf = ByteArray(16384)
            val ent = s.getInputStream()
            while (true) {
                val n = ent.read(buf)
                if (n < 0) break
                tudo.write(buf, 0, n)
                if (tudo.size() > 20 * 1024 * 1024) break
            }
            val bytes = tudo.toByteArray()
            var fim = -1
            for (i in 0 until bytes.size - 3) {
                if (bytes[i] == '\r'.code.toByte() && bytes[i + 1] == '\n'.code.toByte() && bytes[i + 2] == '\r'.code.toByte() && bytes[i + 3] == '\n'.code.toByte()) { fim = i; break }
            }
            if (fim < 0) return resposta(502, "text/plain", ByteArray(0))
            val cab = String(bytes, 0, fim, Charsets.ISO_8859_1).split("\r\n")
            var status = cab.firstOrNull()?.split(" ")?.getOrNull(1)?.toIntOrNull() ?: 502
            if (status in 300..399 || status < 100 || status > 599) status = 502
            val corpo = bytes.copyOfRange(fim + 4, bytes.size)
            val ext = caminho.substringBefore('?').substringAfterLast('.', "").lowercase()
            val tipoCab = cab.drop(1).firstOrNull { it.lowercase().startsWith("content-type:") }?.substringAfter(':')?.trim()?.substringBefore(';')
            return resposta(status, TIPOS[ext] ?: tipoCab ?: "application/octet-stream", corpo)
        }
    }

    private fun resposta(status: Int, tipo: String, corpo: ByteArray): WebResourceResponse {
        val r = WebResourceResponse(tipo, null, ByteArrayInputStream(corpo))
        r.setStatusCodeAndReasonPhrase(status, if (status == 200) "OK" else "Erro")
        r.responseHeaders = mapOf("Access-Control-Allow-Origin" to "*", "Cache-Control" to "no-store")
        return r
    }
}
