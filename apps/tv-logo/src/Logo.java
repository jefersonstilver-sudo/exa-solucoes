import java.lang.reflect.Method;

/**
 * Ajudante da EXA para TVs KTC/MediaTek (roda pelo adb, como shell):
 *   CLASSPATH=/data/local/tmp/logo.jar:/product/app/KtcFactoryKeyService/KtcFactoryKeyService.apk app_process /system/bin Logo <cmd> [args]
 * Usa a biblioteca de fábrica da própria TV (com.mediatek.twoworlds.factory), a mesma do menu de fábrica.
 *   caminho                 -> pasta do logo de boot (cusdata)
 *   env <nome>              -> lê variável do MBOOT (ex.: _BootlogoFile)
 *   copiar <origem> <dest>  -> o serviço de fábrica copia o arquivo (para tirar cópia do logo original)
 *   trocar <arquivo.jpg>    -> changeBootlogo (troca o logo da TV)
 */
public class Logo {
    static Object sys() throws Exception {
        Class<?> c = Class.forName("com.mediatek.twoworlds.factory.MtkTvFApiSystem");
        return c.getMethod("getInstance").invoke(null);
    }
    static Object chamar(Object o, String nome, Object... args) throws Exception {
        for (Method m : o.getClass().getMethods()) {
            if (!m.getName().equals(nome) || m.getParameterTypes().length != args.length) continue;
            return m.invoke(o, args);
        }
        throw new NoSuchMethodException(nome);
    }
    public static void main(String[] a) {
        try {
            String cmd = a.length > 0 ? a[0] : "caminho";
            if (cmd.equals("caminho")) {
                Class<?> cm = Class.forName("com.mediatek.twoworlds.factory.common.inimanager.MtkTvFApiCusdataIniManager");
                Object ini = cm.getMethod("getInstance").invoke(null);
                Class<?> en = Class.forName("com.mediatek.twoworlds.factory.common.inimanager.MtkTvFApiCusdataIniManager$MTKTV_FAPI_KEY_TYPE_CUSDATA_ENUM");
                @SuppressWarnings({"unchecked", "rawtypes"})
                int ord = Enum.valueOf((Class) en, "E_MTK_FAPI_KEY_TYPE_BOOTLOGO_MUSIC_PATH").ordinal();
                System.out.println("caminho=" + cm.getMethod("getCusIniPath", int.class).invoke(ini, ord));
            } else if (cmd.equals("env")) {
                System.out.println(a[1] + "=" + chamar(sys(), "getEmmcEnvVar", a[1]));
            } else if (cmd.equals("copiar")) {
                System.out.println("copiar=" + chamar(sys(), "copyFile", a[1], a[2], false));
            } else if (cmd.equals("trocar")) {
                System.out.println("trocar=" + chamar(sys(), "changeBootlogo", a[1]));
            } else {
                System.out.println("comando desconhecido");
            }
        } catch (Throwable t) {
            Throwable c = t.getCause() != null ? t.getCause() : t;
            System.out.println("ERRO " + c);
            c.printStackTrace(System.out);
        }
    }
}
