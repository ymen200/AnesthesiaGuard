import { useState } from "react";
import { History, ChevronDown, ChevronUp, FileText, Sparkles, Clock, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ConsultationRecord {
  id: string;
  timestamp: Date;
  type: "file" | "micro" | "live";
  transcript: string;
  summary: string;
}

interface ConsultationHistoryProps {
  records: ConsultationRecord[];
  onDelete: (id: string) => void;
  onSelect: (record: ConsultationRecord) => void;
}

export function ConsultationHistory({ records, onDelete, onSelect }: ConsultationHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const getTypeLabel = (type: ConsultationRecord["type"]) => {
    switch (type) {
      case "file": return "Fichier";
      case "micro": return "Enregistrement";
      case "live": return "Appel Live";
    }
  };

  const getTypeColor = (type: ConsultationRecord["type"]) => {
    switch (type) {
      case "file": return "bg-primary/10 text-primary";
      case "micro": return "bg-destructive/10 text-destructive";
      case "live": return "bg-secondary/10 text-secondary";
    }
  };

  if (records.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer pb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Historique ({records.length})
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(record.type)}`}>
                        {getTypeLabel(record.type)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {record.timestamp.toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(record);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(record.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div 
                    className="cursor-pointer"
                    onClick={() => setExpandedRecordId(
                      expandedRecordId === record.id ? null : record.id
                    )}
                  >
                    {expandedRecordId === record.id ? (
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="font-medium flex items-center gap-1 mb-1">
                            <FileText className="w-3 h-3" /> Transcription
                          </p>
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {record.transcript}
                          </p>
                        </div>
                        {record.summary && (
                          <div>
                            <p className="font-medium flex items-center gap-1 mb-1">
                              <Sparkles className="w-3 h-3" /> Résumé
                            </p>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                              {record.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {record.transcript.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
