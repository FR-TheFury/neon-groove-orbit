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
  
  // Actions
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  initializeAudio: (audioElement: HTMLAudioElement) => void;
  updateFrequencyData: () => void;
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

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),

  initializeAudio: (audioElement) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioElement);
    
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    
    set({ 
      audioContext, 
      analyser, 
      frequencyData, 
      audioElement 
    });
  },

  updateFrequencyData: () => {
    const { analyser, frequencyData } = get();
    if (analyser && frequencyData) {
      analyser.getByteFrequencyData(frequencyData);
    }
  },
}));