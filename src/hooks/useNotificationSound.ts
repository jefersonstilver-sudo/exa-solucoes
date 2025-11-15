import { useState, useEffect, useCallback, useRef } from 'react';

interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-100
}

const STORAGE_KEY = 'orderNotificationSound';
const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 80
};

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

  // Play cash register sound using Web Audio API
  const playCashRegister = useCallback((volumeOverride?: number) => {
    const volume = volumeOverride !== undefined ? volumeOverride : settings.volume;
    
    if (!settings.enabled && volumeOverride === undefined) {
      return; // Don't play if disabled (unless it's a preview)
    }

    try {
      const audioContext = getAudioContext();
      const now = audioContext.currentTime;
      
      // Create gain node for volume control
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(volume / 100, now);
      masterGain.connect(audioContext.destination);

      // Bell sound (ding!)
      const bellOsc = audioContext.createOscillator();
      const bellGain = audioContext.createGain();
      
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(1200, now);
      bellOsc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      
      bellGain.gain.setValueAtTime(0.3, now);
      bellGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      bellOsc.connect(bellGain);
      bellGain.connect(masterGain);
      
      bellOsc.start(now);
      bellOsc.stop(now + 0.15);

      // Cash drawer opening sound (lower frequency sweep)
      const drawerOsc = audioContext.createOscillator();
      const drawerGain = audioContext.createGain();
      
      drawerOsc.type = 'sawtooth';
      drawerOsc.frequency.setValueAtTime(200, now + 0.1);
      drawerOsc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      
      drawerGain.gain.setValueAtTime(0, now + 0.1);
      drawerGain.gain.linearRampToValueAtTime(0.15, now + 0.15);
      drawerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      
      drawerOsc.connect(drawerGain);
      drawerGain.connect(masterGain);
      
      drawerOsc.start(now + 0.1);
      drawerOsc.stop(now + 0.35);

      // Coin sound (metallic clink)
      const coinOsc = audioContext.createOscillator();
      const coinGain = audioContext.createGain();
      
      coinOsc.type = 'square';
      coinOsc.frequency.setValueAtTime(800, now + 0.15);
      coinOsc.frequency.exponentialRampToValueAtTime(400, now + 0.25);
      
      coinGain.gain.setValueAtTime(0.2, now + 0.15);
      coinGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      coinOsc.connect(coinGain);
      coinGain.connect(masterGain);
      
      coinOsc.start(now + 0.15);
      coinOsc.stop(now + 0.25);
    } catch (err) {
      console.error('Failed to play cash register sound:', err);
    }
  }, [settings, getAudioContext]);

  // Toggle sound on/off
  const toggleSound = useCallback(() => {
    saveSettings({ ...settings, enabled: !settings.enabled });
  }, [settings, saveSettings]);

  // Set volume (0-100)
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    saveSettings({ ...settings, volume: clampedVolume });
  }, [settings, saveSettings]);

  // Play preview (always plays regardless of enabled state)
  const playPreview = useCallback(() => {
    playCashRegister(settings.volume);
  }, [playCashRegister, settings.volume]);

  return {
    enabled: settings.enabled,
    volume: settings.volume,
    toggleSound,
    setVolume,
    playPreview,
    playCashRegister
  };
};
