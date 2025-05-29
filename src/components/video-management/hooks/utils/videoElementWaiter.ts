
export const waitForVideoElement = (
  videoRef: React.RefObject<HTMLVideoElement>,
  setIsElementReady: (ready: boolean) => void
): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20; // 2 segundos com intervalos de 100ms
    
    const checkElement = () => {
      const video = videoRef.current;
      
      if (video) {
        console.log('✅ [PLAYER] Elemento de vídeo encontrado após', attempts, 'tentativas');
        setIsElementReady(true);
        resolve(video);
        return;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        console.error('❌ [PLAYER] Timeout: elemento de vídeo não encontrado após', maxAttempts, 'tentativas');
        reject(new Error('Elemento de vídeo não foi encontrado'));
        return;
      }
      
      console.log('⏳ [PLAYER] Aguardando elemento... tentativa', attempts);
      setTimeout(checkElement, 100);
    };
    
    checkElement();
  });
};
