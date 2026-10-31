package br.com.examidia.tela

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Abre a tela quando o aparelho liga (ou quando o app é atualizado). */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        try {
            context.startActivity(Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: Throwable) {
            // antes de desbloquear (direct boot) ou bloqueado pelo sistema: o app inicial/LAUNCHER resolve
        }
    }
}
