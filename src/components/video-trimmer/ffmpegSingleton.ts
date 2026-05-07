// Lazy-loaded FFmpeg.wasm single instance for the video trimmer.
// Loads the core from unpkg CDN as Blob URLs (works around CORS).

import type { FFmpeg } from '@ffmpeg/ffmpeg';

let instance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

const CORE_VERSION = '0.12.6';
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

export const getFFmpeg = async (
  onLoadProgress?: (p: number) => void
): Promise<FFmpeg> => {
  if (instance) return instance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const [{ FFmpeg: FFmpegCtor }, util] = await Promise.all([
      import('@ffmpeg/ffmpeg'),
      import('@ffmpeg/util'),
    ]);

    const ff = new FFmpegCtor();

    ff.on('log', ({ message }) => {
      if (message && /error|invalid|fail/i.test(message)) {
        console.warn('[ffmpeg]', message);
      }
    });

    onLoadProgress?.(0.1);

    const coreURL = await util.toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript');
    onLoadProgress?.(0.4);
    const wasmURL = await util.toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm');
    onLoadProgress?.(0.85);

    await ff.load({ coreURL, wasmURL });

    onLoadProgress?.(1);
    instance = ff;
    return ff;
  })();

  try {
    return await loadPromise;
  } catch (e) {
    loadPromise = null;
    throw e;
  }
};

export const safeUnlink = async (ff: FFmpeg, name: string) => {
  try {
    await ff.deleteFile(name);
  } catch {
    // ignore
  }
};
