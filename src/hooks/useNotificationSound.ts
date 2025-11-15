import { useState, useEffect, useCallback, useRef } from 'react';

export type SoundType = 'cash-register' | 'coins-drop' | 'cha-ching' | 'money-count' | 'coin-insert';

interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-100
  soundType: SoundType;
}

const STORAGE_KEY = 'orderNotificationSound';
const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 80,
  soundType: 'cha-ching'
};

export const SOUND_OPTIONS = [
  { value: 'cash-register' as SoundType, label: '💰 Caixa Registradora', description: 'Som clássico de caixa registradora com sino' },
  { value: 'cha-ching' as SoundType, label: '🔔 Cha-Ching!', description: 'Som animado de dinheiro entrando' },
  { value: 'coins-drop' as SoundType, label: '🪙 Moedas Caindo', description: 'Som de moedas caindo em pilha' },
  { value: 'money-count' as SoundType, label: '💵 Contando Dinheiro', description: 'Som de notas sendo contadas' },
  { value: 'coin-insert' as SoundType, label: '🎰 Moeda na Máquina', description: 'Som de moeda sendo inserida' }
];

export const useNotificationSound = () => {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
      } catch (e) {
        console.error('Failed to parse sound settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback((newSettings: SoundSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  // Initialize AudioContext on first interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play sound based on type
  const playSound = useCallback((soundType: SoundType, volumeOverride?: number) => {
    const volume = volumeOverride !== undefined ? volumeOverride : settings.volume;
    
    if (!settings.enabled && volumeOverride === undefined) {
      return;
    }

    try {
      const audioContext = getAudioContext();
      const now = audioContext.currentTime;
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(volume / 100, now);
      masterGain.connect(audioContext.destination);

      switch (soundType) {
        case 'cash-register':
          playCashRegisterSound(audioContext, now, masterGain);
          break;
        case 'cha-ching':
          playChaChing(audioContext, now, masterGain);
          break;
        case 'coins-drop':
          playCoinsDropSound(audioContext, now, masterGain);
          break;
        case 'money-count':
          playMoneyCountSound(audioContext, now, masterGain);
          break;
        case 'coin-insert':
          playCoinInsertSound(audioContext, now, masterGain);
          break;
      }
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  }, [settings, getAudioContext]);

  // Cash Register: Classic register with bell
  const playCashRegisterSound = (audioContext: AudioContext, now: number, masterGain: GainNode) => {
    // Bell
    const bell = audioContext.createOscillator();
    const bellGain = audioContext.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(1400, now);
    bell.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    bellGain.gain.setValueAtTime(0.4, now);
    bellGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    bell.connect(bellGain).connect(masterGain);
    bell.start(now);
    bell.stop(now + 0.2);

    // Drawer
    const drawer = audioContext.createOscillator();
    const drawerGain = audioContext.createGain();
    drawer.type = 'sawtooth';
    drawer.frequency.setValueAtTime(180, now + 0.15);
    drawer.frequency.exponentialRampToValueAtTime(60, now + 0.4);
    drawerGain.gain.setValueAtTime(0, now + 0.15);
    drawerGain.gain.linearRampToValueAtTime(0.2, now + 0.2);
    drawerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    drawer.connect(drawerGain).connect(masterGain);
    drawer.start(now + 0.15);
    drawer.stop(now + 0.45);
  };

  // Cha-Ching: Upbeat money sound
  const playChaChing = (audioContext: AudioContext, now: number, masterGain: GainNode) => {
    // "Cha" - rising tone
    const cha = audioContext.createOscillator();
    const chaGain = audioContext.createGain();
    cha.type = 'sine';
    cha.frequency.setValueAtTime(600, now);
    cha.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
    chaGain.gain.setValueAtTime(0.3, now);
    chaGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    cha.connect(chaGain).connect(masterGain);
    cha.start(now);
    cha.stop(now + 0.12);

    // "Ching" - high bell
    const ching = audioContext.createOscillator();
    const chingGain = audioContext.createGain();
    ching.type = 'sine';
    ching.frequency.setValueAtTime(1600, now + 0.1);
    ching.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
    chingGain.gain.setValueAtTime(0.4, now + 0.1);
    chingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    ching.connect(chingGain).connect(masterGain);
    ching.start(now + 0.1);
    ching.stop(now + 0.3);

    // Resonance
    const res = audioContext.createOscillator();
    const resGain = audioContext.createGain();
    res.type = 'sine';
    res.frequency.setValueAtTime(800, now + 0.15);
    resGain.gain.setValueAtTime(0.15, now + 0.15);
    resGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    res.connect(resGain).connect(masterGain);
    res.start(now + 0.15);
    res.stop(now + 0.4);
  };

  // Coins Drop: Multiple coins falling
  const playCoinsDropSound = (audioContext: AudioContext, now: number, masterGain: GainNode) => {
    const coinTimes = [0, 0.05, 0.09, 0.14, 0.18, 0.23, 0.27];
    coinTimes.forEach((time, i) => {
      const coin = audioContext.createOscillator();
      const coinGain = audioContext.createGain();
      const freq = 900 - i * 50;
      coin.type = 'sine';
      coin.frequency.setValueAtTime(freq, now + time);
      coin.frequency.exponentialRampToValueAtTime(freq * 0.8, now + time + 0.05);
      coinGain.gain.setValueAtTime(0.25, now + time);
      coinGain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.08);
      coin.connect(coinGain).connect(masterGain);
      coin.start(now + time);
      coin.stop(now + time + 0.08);
    });
  };

  // Money Count: Bill counting sound
  const playMoneyCountSound = (audioContext: AudioContext, now: number, masterGain: GainNode) => {
    const countTimes = [0, 0.08, 0.16, 0.24];
    countTimes.forEach((time, i) => {
      const snap = audioContext.createOscillator();
      const snapGain = audioContext.createGain();
      snap.type = 'square';
      snap.frequency.setValueAtTime(200 + i * 50, now + time);
      snap.frequency.exponentialRampToValueAtTime(100, now + time + 0.03);
      snapGain.gain.setValueAtTime(0.2, now + time);
      snapGain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.04);
      snap.connect(snapGain).connect(masterGain);
      snap.start(now + time);
      snap.stop(now + time + 0.04);
    });
  };

  // Coin Insert: Slot machine style
  const playCoinInsertSound = (audioContext: AudioContext, now: number, masterGain: GainNode) => {
    // Insert sound
    const insert = audioContext.createOscillator();
    const insertGain = audioContext.createGain();
    insert.type = 'sine';
    insert.frequency.setValueAtTime(1200, now);
    insert.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    insertGain.gain.setValueAtTime(0.3, now);
    insertGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    insert.connect(insertGain).connect(masterGain);
    insert.start(now);
    insert.stop(now + 0.2);

    // Clink at bottom
    const clink = audioContext.createOscillator();
    const clinkGain = audioContext.createGain();
    clink.type = 'sine';
    clink.frequency.setValueAtTime(800, now + 0.2);
    clinkGain.gain.setValueAtTime(0.25, now + 0.2);
    clinkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    clink.connect(clinkGain).connect(masterGain);
    clink.start(now + 0.2);
    clink.stop(now + 0.3);
  };

  // Toggle sound on/off
  const toggleSound = useCallback(() => {
    saveSettings({ ...settings, enabled: !settings.enabled });
  }, [settings, saveSettings]);

  // Set volume (0-100)
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    saveSettings({ ...settings, volume: clampedVolume });
  }, [settings, saveSettings]);

  // Set sound type
  const setSoundType = useCallback((soundType: SoundType) => {
    saveSettings({ ...settings, soundType });
  }, [settings, saveSettings]);

  // Play preview (always plays regardless of enabled state)
  const playPreview = useCallback(() => {
    playSound(settings.soundType, settings.volume);
  }, [playSound, settings.soundType, settings.volume]);

  // Play notification (respects enabled state)
  const playNotificationSound = useCallback(() => {
    playSound(settings.soundType);
  }, [playSound, settings.soundType]);

  return {
    enabled: settings.enabled,
    volume: settings.volume,
    soundType: settings.soundType,
    toggleSound,
    setVolume,
    setSoundType,
    playPreview,
    playNotificationSound
  };
};
