import { useState, useRef, useEffect } from "react";
import { 
  Phone, 
  PhoneOff, 
  Copy, 
  Check, 
  Loader2, 
  Users, 
  Mic, 
  MicOff, 
  Clock,
  Shield,
  Activity,
  AlertTriangle,
  HeartPulse,
  UserRound,
  Stethoscope,
  Volume2,
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AudioWaveVisualizer } from "./AudioWaveVisualizer";

interface LiveCallProps {
  onTranscribe: (transcript: string, summary: string) => void;
}

type CallStatus = "idle" | "creating" | "waiting" | "connecting" | "connected" | "ended";
type UserRole = "doctor" | "patient";

export function LiveCall({ onTranscribe }: LiveCallProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [userRole, setUserRole] = useState<UserRole>("doctor");
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("excellent");
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const { toast } = useToast();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerMuted;
      setIsSpeakerMuted(!isSpeakerMuted);
    }
  };

  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ],
    });

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
        
        // Setup audio analysis for remote speaking detection
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(event.streams[0]);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        
        const checkAudio = () => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setIsRemoteSpeaking(average > 20);
          if (callStatus === "connected") {
            requestAnimationFrame(checkAudio);
          }
        };
        checkAudio();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected") {
        setCallStatus("connected");
        setConnectionQuality("excellent");
        startTimer();
      } else if (pc.iceConnectionState === "checking") {
        setConnectionQuality("good");
      } else if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setConnectionQuality("poor");
        endCall();
      }
    };

    return pc;
  };

  const startRecording = (stream: MediaStream) => {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
      ? 'audio/webm' 
      : 'audio/mp4';
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    recorder.start(1000);
    recorderRef.current = recorder;
  };

  const createRoom = async () => {
    setCallStatus("creating");
    const code = generateCode();
    setRoomCode(code);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      localStreamRef.current = stream;
      startRecording(stream);

      const pc = setupPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const channel = supabase.channel(`call:${code}`);
      channelRef.current = channel;

      channel
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
        })
        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          await pc.addIceCandidate(new RTCIceCandidate(payload));
        })
        .on("broadcast", { event: "join" }, async () => {
          setCallStatus("connecting");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ type: "broadcast", event: "offer", payload: offer });
        })
        .subscribe();

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({ type: "broadcast", event: "ice-candidate", payload: event.candidate });
        }
      };

      setCallStatus("waiting");
      toast({ 
        title: "Salle créée", 
        description: "Partagez le code avec votre patient",
      });
    } catch (err) {
      console.error("Error creating room:", err);
      toast({ title: "Erreur", description: "Impossible d'accéder au microphone", variant: "destructive" });
      setCallStatus("idle");
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) return;
    setCallStatus("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = stream;
      startRecording(stream);

      const pc = setupPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const channel = supabase.channel(`call:${joinCode.toUpperCase()}`);
      channelRef.current = channel;

      channel
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({ type: "broadcast", event: "answer", payload: answer });
        })
        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          await pc.addIceCandidate(new RTCIceCandidate(payload));
        })
        .subscribe(() => {
          channel.send({ type: "broadcast", event: "join", payload: {} });
        });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({ type: "broadcast", event: "ice-candidate", payload: event.candidate });
        }
      };

      setRoomCode(joinCode.toUpperCase());
    } catch (err) {
      console.error("Error joining room:", err);
      toast({ title: "Erreur", description: "Impossible de rejoindre l'appel", variant: "destructive" });
      setCallStatus("idle");
    }
  };

  const endCall = async () => {
    setCallStatus("ended");
    stopTimer();
    setIsMuted(false);
    setIsSpeakerMuted(false);

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      recorderRef.current.onstop = async () => {
        setIsTranscribing(true);
        const mimeType = recorderRef.current?.mimeType || 'audio/webm';
        const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const formData = new FormData();
        formData.append("file", blob, `call.${extension}`);

        try {
          const response = await fetch("http://localhost:8001/transcribe-file/", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          onTranscribe(data.transcript || "", data.summary || "");
          toast({ 
            title: "Transcription terminée", 
            description: "Le résumé de la consultation est disponible",
          });
        } catch (err) {
          console.error("Error transcribing call:", err);
          toast({ 
            title: "Erreur de transcription", 
            description: "Impossible de transcrire l'appel", 
            variant: "destructive" 
          });
        } finally {
          setIsTranscribing(false);
          setCallStatus("idle");
        }
      };
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    pcRef.current?.close();
    channelRef.current?.unsubscribe();

    pcRef.current = null;
    localStreamRef.current = null;
    channelRef.current = null;
    setRoomCode("");
    setJoinCode("");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast({ title: "Copié!", description: "Code copié dans le presse-papiers" });
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      stopTimer();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      pcRef.current?.close();
      channelRef.current?.unsubscribe();
    };
  }, []);

  // Transcribing state
  if (isTranscribing) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <Badge variant="secondary" className="animate-pulse">
              <Activity className="w-3 h-3 mr-1" />
              Analyse IA
            </Badge>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="font-medium text-foreground">Transcription en cours...</p>
          <p className="text-sm text-muted-foreground">
            Analyse de la consultation par intelligence artificielle
          </p>
        </div>
      </div>
    );
  }

  // Idle state - Room creation/join
  if (callStatus === "idle" || callStatus === "ended") {
    return (
      <div className="space-y-8">
        {/* Role Selection */}
        <div className="flex justify-center gap-4">
          <Button
            variant={userRole === "doctor" ? "default" : "outline"}
            onClick={() => setUserRole("doctor")}
            className="flex items-center gap-2"
          >
            <Stethoscope className="w-4 h-4" />
            Médecin
          </Button>
          <Button
            variant={userRole === "patient" ? "default" : "outline"}
            onClick={() => setUserRole("patient")}
            className="flex items-center gap-2"
          >
            <UserRound className="w-4 h-4" />
            Patient
          </Button>
        </div>

        {/* Security Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-xs gap-1 px-3 py-1">
            <Shield className="w-3 h-3 text-secondary" />
            Communication chiffrée de bout en bout
          </Badge>
        </div>

        {/* Create Room - For Doctors */}
        {userRole === "doctor" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Démarrer une consultation</h3>
              <p className="text-sm text-muted-foreground">
                Créez une salle sécurisée et partagez le code avec votre patient
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <Button 
                onClick={createRoom} 
                size="lg" 
                className="w-full max-w-xs h-14 text-lg gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                <Phone className="w-5 h-5" />
                Créer une salle
              </Button>
            </div>
          </div>
        )}

        {/* Join Room - For Patients */}
        {userRole === "patient" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Rejoindre une consultation</h3>
              <p className="text-sm text-muted-foreground">
                Entrez le code fourni par votre médecin
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
              <Input
                placeholder="CODE À 6 CHIFFRES"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-muted/50"
              />
              <Button 
                onClick={joinRoom} 
                disabled={joinCode.length < 6}
                size="lg"
                className="w-full h-12"
              >
                <Users className="w-4 h-4 mr-2" />
                Rejoindre
              </Button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
            <HeartPulse className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground text-center">Audio HD</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
            <Shield className="w-5 h-5 text-secondary" />
            <span className="text-xs text-muted-foreground text-center">Sécurisé</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground text-center">Transcription IA</span>
          </div>
        </div>
      </div>
    );
  }

  // Creating/Connecting state
  if (callStatus === "creating" || callStatus === "connecting") {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="font-medium text-foreground">
            {callStatus === "creating" ? "Création de la salle..." : "Connexion sécurisée..."}
          </p>
          <p className="text-sm text-muted-foreground">
            {callStatus === "creating" 
              ? "Préparation de l'environnement audio" 
              : "Établissement du canal chiffré"}
          </p>
        </div>
      </div>
    );
  }

  // Waiting for participant
  if (callStatus === "waiting") {
    return (
      <div className="flex flex-col items-center gap-8 py-8">
        {/* Animated waiting indicator */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center animate-pulse">
            <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center shadow-inner">
              <Users className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          </div>
        </div>

        {/* Status */}
        <div className="text-center space-y-2">
          <Badge variant="secondary" className="mb-2">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
          <p className="font-medium">Salle prête pour la consultation</p>
          <p className="text-sm text-muted-foreground">
            Partagez ce code avec votre patient
          </p>
        </div>

        {/* Room Code */}
        <div className="bg-gradient-to-br from-muted to-muted/50 rounded-2xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-mono font-bold tracking-[0.3em] text-foreground">
              {roomCode}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={copyCode}
              className="h-10 w-10 rounded-full hover:bg-primary/10"
            >
              {copied ? (
                <Check className="w-5 h-5 text-secondary" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>Canal sécurisé • Chiffrement E2E</span>
        </div>

        <Button variant="outline" onClick={endCall} className="gap-2">
          <PhoneOff className="w-4 h-4" />
          Annuler
        </Button>
      </div>
    );
  }

  // Connected - Active call
  if (callStatus === "connected") {
    return (
      <div className="flex flex-col items-center gap-6 py-6">
        {/* Call Header */}
        <div className="w-full flex items-center justify-between px-4">
          <Badge 
            variant="outline" 
            className={`gap-1 ${
              connectionQuality === "excellent" 
                ? "text-secondary border-secondary" 
                : connectionQuality === "good"
                ? "text-yellow-500 border-yellow-500"
                : "text-destructive border-destructive"
            }`}
          >
            <Activity className="w-3 h-3" />
            {connectionQuality === "excellent" ? "Excellente" : connectionQuality === "good" ? "Bonne" : "Faible"}
          </Badge>
          
          <Badge variant="secondary" className="gap-1">
            <Shield className="w-3 h-3" />
            Chiffré
          </Badge>
        </div>

        {/* Participants Visualization */}
        <div className="flex items-center justify-center gap-8 py-4">
          {/* Local user (You) */}
          <div className="flex flex-col items-center gap-3">
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              !isMuted 
                ? "bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30" 
                : "bg-muted"
            }`}>
              {userRole === "doctor" ? (
                <Stethoscope className="w-8 h-8 text-primary-foreground" />
              ) : (
                <UserRound className="w-8 h-8 text-primary-foreground" />
              )}
              {isMuted && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium">Vous</span>
          </div>

          {/* Connection line */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-transparent rounded" />
            <HeartPulse className="w-5 h-5 text-secondary animate-pulse" />
            <div className="w-8 h-0.5 bg-gradient-to-l from-secondary to-transparent rounded" />
          </div>

          {/* Remote user */}
          <div className="flex flex-col items-center gap-3">
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRemoteSpeaking 
                ? "bg-gradient-to-br from-secondary to-secondary/60 shadow-lg shadow-secondary/30" 
                : "bg-muted"
            }`}>
              {userRole === "doctor" ? (
                <UserRound className="w-8 h-8 text-secondary-foreground" />
              ) : (
                <Stethoscope className="w-8 h-8 text-secondary-foreground" />
              )}
              {isRemoteSpeaking && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary animate-ping" />
              )}
            </div>
            <span className="text-sm font-medium">
              {userRole === "doctor" ? "Patient" : "Médecin"}
            </span>
          </div>
        </div>

        {/* Audio Visualizer */}
        {localStreamRef.current && (
          <AudioWaveVisualizer stream={localStreamRef.current} isRecording={!isMuted} />
        )}

        {/* Call Duration */}
        <div className="flex items-center gap-3 bg-muted/50 px-6 py-3 rounded-full">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-xl font-medium">{formatDuration(callDuration)}</span>
        </div>

        {/* Room Code */}
        <p className="text-xs text-muted-foreground">Code: {roomCode}</p>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4">
          {/* Mute button */}
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="lg"
            onClick={toggleMute}
            className="w-14 h-14 rounded-full p-0 shadow-md"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* End call button */}
          <Button 
            variant="destructive" 
            size="lg" 
            onClick={endCall} 
            className="h-14 px-8 rounded-full shadow-lg gap-2 text-base"
          >
            <PhoneOff className="w-5 h-5" />
            Terminer
          </Button>

          {/* Speaker button */}
          <Button
            variant={isSpeakerMuted ? "destructive" : "outline"}
            size="lg"
            onClick={toggleSpeaker}
            className="w-14 h-14 rounded-full p-0 shadow-md"
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>

        {/* Recording indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span>Enregistrement en cours pour transcription</span>
        </div>

        <audio ref={remoteAudioRef} autoPlay />
      </div>
    );
  }

  return null;
}