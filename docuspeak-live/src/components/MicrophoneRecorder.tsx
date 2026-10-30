import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudioWaveVisualizer } from "./AudioWaveVisualizer";

interface MicrophoneRecorderProps {
  onTranscribe: (transcript: string, summary: string) => void;
}

export function MicrophoneRecorder({ onTranscribe }: MicrophoneRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      setStream(mediaStream);
      chunksRef.current = [];

      // Use webm format which is widely supported
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsLoading(true);
        
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const formData = new FormData();
        
        // Determine file extension based on mime type
        const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
        formData.append("file", blob, `recording.${extension}`);

        try {
          const response = await fetch("http://localhost:8001/transcribe-file/", {
            method: "POST",
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          onTranscribe(data.transcript || "", data.summary || "");
        } catch (err) {
          console.error("Erreur transcription live :", err);
        } finally {
          setIsLoading(false);
          setDuration(0);
        }

        mediaStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      };

      // Collect data every second for reliability
      mediaRecorder.start(1000);
      setRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Erreur accès micro :", err);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {isLoading ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <p className="text-muted-foreground">Transcription en cours...</p>
        </div>
      ) : recording ? (
        <>
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                <Mic className="w-8 h-8 text-destructive-foreground" />
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive animate-ping" />
          </div>
          
          {/* Duration Timer */}
          <p className="text-2xl font-mono font-bold text-destructive">
            {formatDuration(duration)}
          </p>
          
          {/* Wave Visualizer */}
          <AudioWaveVisualizer stream={stream} isRecording={recording} />
          
          <p className="text-destructive font-medium">🔴 Enregistrement en cours...</p>
          <Button onClick={stopRecording} variant="destructive" size="lg">
            <Square className="w-4 h-4 mr-2" />
            Arrêter l'enregistrement
          </Button>
        </>
      ) : (
        <>
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Mic className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <Button onClick={startRecording} size="lg">
            <Mic className="w-4 h-4 mr-2" />
            Démarrer l'enregistrement
          </Button>
        </>
      )}
    </div>
  );
}
