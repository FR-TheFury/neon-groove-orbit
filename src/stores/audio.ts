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
      
      // Higher resolution for better frequency analysis
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
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
    const { analyser, frequencyData } = get();
    if (analyser && frequencyData) {
      analyser.getByteFrequencyData(frequencyData);
      
      // Calculate frequency bands
      const bufferLength = frequencyData.length;
      const bassEnd = Math.floor(bufferLength * 0.1);
      const midEnd = Math.floor(bufferLength * 0.5);
      
      let bassSum = 0, midSum = 0, trebleSum = 0;
      
      // Bass (0-10% of spectrum)
      for (let i = 0; i < bassEnd; i++) {
        bassSum += frequencyData[i];
      }
      
      // Mid (10-50% of spectrum)
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
      
      // Simple beat detection
      const beatDetected = bassLevel > 0.7;
      
      set({ bassLevel, midLevel, trebleLevel, beatDetected });
    }
  },

  resumeAudioContext: async () => {
    const { audioContext } = get();
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  },
}));