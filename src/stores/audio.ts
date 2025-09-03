import { create } from 'zustand';

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  frequencyData: Uint8Array | null;
  audioElement: HTMLAudioElement | null;
  bassLevel: number;
  midLevel: number;
  trebleLevel: number;
  beatDetected: boolean;
  smoothedBass: number;
  smoothedMid: number;
  smoothedTreble: number;
  
  // Actions
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  initializeAudio: (audioElement: HTMLAudioElement) => Promise<void>;
  updateFrequencyData: () => void;
  resumeAudioContext: () => Promise<void>;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  audioContext: null,
  analyser: null,
  frequencyData: null,
  audioElement: null,
  bassLevel: 0,
  midLevel: 0,
  trebleLevel: 0,
  beatDetected: false,
  smoothedBass: 0,
  smoothedMid: 0,
  smoothedTreble: 0,

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),

  initializeAudio: async (audioElement) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioElement);
      
      // Ultra-fast response for 2D-like fluidity
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.1;
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      
      set({ 
        audioContext, 
        analyser, 
        frequencyData, 
        audioElement 
      });
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  },

  updateFrequencyData: () => {
    const { analyser, frequencyData, smoothedBass, smoothedMid, smoothedTreble } = get();
    if (analyser && frequencyData) {
      analyser.getByteFrequencyData(frequencyData);
      
      // Optimized frequency bands
      const bufferLength = frequencyData.length;
      const bassEnd = Math.floor(bufferLength * 0.15);
      const midEnd = Math.floor(bufferLength * 0.5);
      
      let bassSum = 0, midSum = 0, trebleSum = 0;
      
      // Bass (0-15% of spectrum)
      for (let i = 0; i < bassEnd; i++) {
        bassSum += frequencyData[i];
      }
      
      // Mid (15-50% of spectrum)
      for (let i = bassEnd; i < midEnd; i++) {
        midSum += frequencyData[i];
      }
      
      // Treble (50-100% of spectrum)
      for (let i = midEnd; i < bufferLength; i++) {
        trebleSum += frequencyData[i];
      }
      
      const bassLevel = bassSum / bassEnd / 255;
      const midLevel = midSum / (midEnd - bassEnd) / 255;
      const trebleLevel = trebleSum / (bufferLength - midEnd) / 255;
      
      // Ultra-fast interpolation for instant visual response
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const newSmoothedBass = lerp(smoothedBass, bassLevel, 0.7);
      const newSmoothedMid = lerp(smoothedMid, midLevel, 0.7);
      const newSmoothedTreble = lerp(smoothedTreble, trebleLevel, 0.7);
      
      // Enhanced beat detection
      const beatDetected = bassLevel > 0.25 && bassLevel > smoothedBass * 1.4;
      
      set({ 
        bassLevel, 
        midLevel, 
        trebleLevel, 
        beatDetected,
        smoothedBass: newSmoothedBass,
        smoothedMid: newSmoothedMid,
        smoothedTreble: newSmoothedTreble
      });
    }
  },

  resumeAudioContext: async () => {
    const { audioContext } = get();
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  },
}));