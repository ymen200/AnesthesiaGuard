import { useState, useCallback } from "react";
import { Shield, Activity } from "lucide-react";
import { ModeSelector } from "@/components/ModeSelector";
import { FileUpload } from "@/components/FileUpload";
import { MicrophoneRecorder } from "@/components/MicrophoneRecorder";
import { LiveCall } from "@/components/LiveCall";
import { TranscriptionCard } from "@/components/TranscriptionCard";
import { ConsultationHistory, ConsultationRecord } from "@/components/ConsultationHistory";
import { Badge } from "@/components/ui/badge";

type Mode = "file" | "micro" | "live";

const Index = () => {
  const [mode, setMode] = useState<Mode>("file");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [history, setHistory] = useState<ConsultationRecord[]>([]);

  const handleTranscribe = useCallback((newTranscript: string, newSummary: string) => {
    setTranscript(newTranscript);
    setSummary(newSummary);

    // Add to history
    if (newTranscript) {
      const record: ConsultationRecord = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: mode,
        transcript: newTranscript,
        summary: newSummary,
      };
      setHistory((prev) => [record, ...prev]);
    }
  }, [mode]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setTranscript("");
    setSummary("");
  };

  const handleDeleteRecord = (id: string) => {
    setHistory((prev) => prev.filter((record) => record.id !== id));
  };

  const handleSelectRecord = (record: ConsultationRecord) => {
    setTranscript(record.transcript);
    setSummary(record.summary);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
                  <Shield className="w-7 h-7" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-secondary animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Anesthesia<span className="text-primary">Guard</span>
                </h1>
                <p className="text-xs text-muted-foreground">Téléconsultation Médicale Sécurisée</p>
              </div>
            </div>
            <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
              <Activity className="w-3 h-3 text-secondary" />
              IA Active
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Mode Selector */}
          <section>
            <ModeSelector mode={mode} setMode={handleModeChange} />
          </section>

          {/* Active Mode Content */}
          <section className="bg-card rounded-xl border p-6 shadow-sm">
            {mode === "file" && <FileUpload onTranscribe={handleTranscribe} />}
            {mode === "micro" && <MicrophoneRecorder onTranscribe={handleTranscribe} />}
            {mode === "live" && <LiveCall onTranscribe={handleTranscribe} />}
          </section>

          {/* Results */}
          <section>
            <TranscriptionCard transcript={transcript} summary={summary} />
          </section>

          {/* History */}
          <section>
            <ConsultationHistory 
              records={history} 
              onDelete={handleDeleteRecord}
              onSelect={handleSelectRecord}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
