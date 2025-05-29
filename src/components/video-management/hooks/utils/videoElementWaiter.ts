
export const waitForVideoElement = (
  videoRef: React.RefObject<HTMLVideoElement>,
  setIsElementReady: (ready: boolean) => void
): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos com intervalos de 100ms
    
    const checkElement = () => {
      const video = videoRef.current;
      
      console.log(`🔍 [WAITER] Tentativa ${attempts}: elemento encontrado?`, !!video, {
        hasRef: !!videoRef,
        hasCurrent: !!videoRef.current,
        isConnected: video?.isConnected,
        parentNode: video?.parentNode?.nodeName
      });
      
      if (video && video.isConnected) {
        console.log('✅ [WAITER] Elemento de vídeo válido encontrado após', attempts, 'tentativas');
        setIsElementReady(true);
        resolve(video);
        return;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        console.error('❌ [WAITER] Timeout: elemento de vídeo não encontrado após', maxAttempts, 'tentativas');
        console.error('🔍 [WAITER] Estado final:', {
          videoRef: !!videoRef,
          current: !!videoRef.current,
          attempts,
          maxAttempts
        });
        reject(new Error('Elemento de vídeo não foi encontrado após 5 segundos'));
        return;
      }
      
      // Delay progressivo para dar mais chance ao DOM de se estabilizar
      const delay = attempts < 10 ? 100 : attempts < 30 ? 200 : 300;
      setTimeout(checkElement, delay);
    };
    
    // Começar imediatamente
    checkElement();
  });
};
