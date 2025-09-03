import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onUploadComplete: (trackId: string) => void;
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload audio files.",
        variant: "destructive",
      });
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage with progress simulation
      let progressInterval: NodeJS.Timeout;
      
      const simulateProgress = () => {
        let currentProgress = 0;
        progressInterval = setInterval(() => {
          currentProgress += Math.random() * 15;
          if (currentProgress >= 90) {
            setProgress(90);
            clearInterval(progressInterval);
          } else {
            setProgress(currentProgress);
          }
        }, 200);
      };
      
      simulateProgress();

      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(filePath, file);

      clearInterval(progressInterval);
      setProgress(100);

      if (uploadError) throw uploadError;

      // Get audio duration
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(file);
      audio.src = audioUrl;
      
      const duration = await new Promise<number>((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration);
          URL.revokeObjectURL(audioUrl);
        });
      });

      // Save track metadata to database
      const { data: track, error: dbError } = await supabase
        .from('tracks')
        .insert({
          user_id: user.id,
          storage_path: filePath,
          filename: file.name,
          duration,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Upload Complete!",
        description: "Your audio file has been uploaded successfully.",
      });

      onUploadComplete(track.id);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [user, toast, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "glass border-neon-pulse cursor-pointer transition-all duration-300 p-8",
        isDragActive && "border-neon-cyan scale-105 glow-cyan",
        uploading && "cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="text-center space-y-4">
        {uploading ? (
          <>
            <Music className="w-16 h-16 mx-auto text-neon-cyan animate-pulse" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Uploading...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-16 h-16 mx-auto text-neon-magenta" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-neon-cyan">
                {isDragActive ? 'Drop your audio file here' : 'Upload Audio File'}
              </h3>
              <p className="text-muted-foreground">
                Drag & drop or click to select • MP3, WAV, OGG • Max 50MB
              </p>
            </div>
            
            {!user && (
              <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Sign in required to upload files</span>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}