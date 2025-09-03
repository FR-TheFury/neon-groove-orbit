import { useEffect, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { useAudioStore } from '@/stores/audio';

interface AudioControlsProps {
  audioUrl?: string;
}

export default function AudioControls({ audioUrl }: AudioControlsProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    setPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    initializeAudio,
    updateFrequencyData,
  } = useAudioStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.src = audioUrl;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      initializeAudio(audio);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      updateFrequencyData();
    };

    const handleEnded = () => {
      setPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, setDuration, setCurrentTime, setPlaying, initializeAudio, updateFrequencyData]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    setPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio && duration) {
      const newTime = (value[0] / 100) * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) {
    return (
      <Card className="glass p-4">
        <p className="text-center text-muted-foreground">No audio loaded</p>
      </Card>
    );
  }

  return (
    <>
      <audio ref={audioRef} preload="metadata" />
      
      <Card className="glass p-4 space-y-4">
        {/* Play/Pause Button */}
        <div className="flex items-center justify-center">
          <Button
            variant="neon"
            size="lg"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[duration ? (currentTime / duration) * 100 : 0]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-neon-cyan" />
          <Slider
            value={[volume * 100]}
            onValueChange={(value) => setVolume(value[0] / 100)}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>
      </Card>
    </>
  );
}