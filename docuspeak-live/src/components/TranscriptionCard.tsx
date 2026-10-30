import { FileText, Sparkles, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TranscriptionCardProps {
  transcript: string;
  summary: string;
}

export function TranscriptionCard({ transcript, summary }: TranscriptionCardProps) {
  if (!transcript && !summary) return null;

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Consultation Médicale - ${new Date().toLocaleDateString('fr-FR')}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
            }
            h1 {
              color: #0d9488;
              border-bottom: 2px solid #0d9488;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            h2 {
              color: #0891b2;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .section {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              border-left: 4px solid #0d9488;
            }
            .summary-section {
              border-left-color: #0891b2;
              background: #f0fdfa;
            }
            .date {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 20px;
            }
            pre {
              white-space: pre-wrap;
              font-family: inherit;
              margin: 0;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>📋 Consultation Médicale</h1>
          <p class="date">Date: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          
          ${transcript ? `
            <h2>📝 Transcription</h2>
            <div class="section">
              <pre>${transcript}</pre>
            </div>
          ` : ''}
          
          ${summary ? `
            <h2>✨ Résumé</h2>
            <div class="section summary-section">
              <pre>${summary}</pre>
            </div>
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToPDF} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporter en PDF
        </Button>
      </div>

      {transcript && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Transcription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{transcript}</p>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card className="border-secondary/50 bg-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-secondary" />
              Résumé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
