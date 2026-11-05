#!/system/bin/sh
# EXA · deixa o Zeta com a cara da EXA ao ligar (roda como root; $1 = h | v90 | v270, a posição da TV)
G=${1:-v90}
B=/data/local/tmp/b
O=/data/local/tmp/exa-instala.txt
M=/data/local/tmp/bl
{
echo "posicao: $G"
# 1) vídeo de boot (o Zeta procura /data/local/boot.mp4 antes do da fábrica)
cp $B/boot_$G.mp4 /data/local/boot.mp4 && chmod 644 /data/local/boot.mp4 && echo "boot.mp4 ok $(ls -l /data/local/boot.mp4)"
# 2) logo parado do começo (bootloader: bat/bootlogo.bmp), com cópia do original da fábrica
mkdir -p $M
for p in bootloader bootloader_a bootloader_b boot-resource; do
  [ -e /dev/block/by-name/$p ] || continue
  mount -t vfat -o rw /dev/block/by-name/$p $M 2>/dev/null || continue
  if [ -f $M/bat/bootlogo.bmp ]; then
    [ -f /data/local/tmp/bootlogo-zeta-original.bmp ] || cp $M/bat/bootlogo.bmp /data/local/tmp/bootlogo-zeta-original.bmp
    cp /data/local/tmp/bootlogo-zeta-original.bmp /sdcard/Download/bootlogo-zeta-original.bmp 2>/dev/null
    cp $B/bootlogo_$G.bmp $M/bat/bootlogo.bmp && sync
    echo "logo em $p: $(ls -l $M/bat/bootlogo.bmp)"
    echo "md5 novo: $(md5sum $M/bat/bootlogo.bmp | cut -c1-12)  esperado: $(md5sum $B/bootlogo_$G.bmp | cut -c1-12)"
  fi
  umount $M
done
# 3) animações do sistema ligadas (com escala 0 a intro do app congela)
settings put global animator_duration_scale 1
settings put global transition_animation_scale 1
settings put global window_animation_scale 1
echo "animacoes: $(settings get global animator_duration_scale)"
} > $O 2>&1
chmod 666 $O
