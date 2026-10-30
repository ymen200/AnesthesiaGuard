import { useState, useRef } from "react";
import { Upload, FileAudio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onTranscribe: (transcript: string, summary: string) => void;
}

export function FileUpload({ onTranscribe }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8001/transcribe-file/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      onTranscribe(data.transcript || "", data.summary || "");
    } catch (err) {
      console.error("Erreur transcription fichier :", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragOver ? "border-primary bg-accent" : "border-border hover:border-primary/50",
          selectedFile && "border-secondary bg-secondary/10"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileAudio className="w-12 h-12 text-secondary" />
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <p className="font-medium">Glisser-déposer un fichier audio</p>
            <p className="text-sm text-muted-foreground">ou cliquer pour parcourir</p>
          </div>
        )}
      </div>

      <Button
        onClick={handleTranscribe}
        disabled={!selectedFile || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Transcription en cours...
          </>
        ) : (
          "Transcrire le fichier"
        )}
      </Button>
    </div>
  );
}
