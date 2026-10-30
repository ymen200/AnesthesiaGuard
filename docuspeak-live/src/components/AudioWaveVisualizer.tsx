import { useEffect, useRef } from "react";

interface AudioWaveVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

export function AudioWaveVisualizer({ stream, isRecording }: AudioWaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!stream || !isRecording || !canvasRef.current) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>);

      ctx.fillStyle = "hsl(var(--background))";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      // Get computed colors from CSS variables
      const computedStyle = getComputedStyle(canvas);
      const primaryColor = `hsl(${computedStyle.getPropertyValue('--primary').trim()})`;
      const secondaryColor = `hsl(${computedStyle.getPropertyValue('--secondary').trim()})`;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArrayRef.current[i] / 255) * canvas.height * 0.8;

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, secondaryColor);
        ctx.fillStyle = gradient;

        const y = (canvas.height - barHeight) / 2;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      audioContext.close();
    };
  }, [stream, isRecording]);

  if (!isRecording) return null;

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={80}
      className="rounded-lg bg-background border"
    />
  );
}
