import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, Pill, AlertCircle, CheckCircle, ScanLine, Brain, ShieldCheck, ListPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api, ScannedMedication } from "@/lib/api";
import { usePatientStore } from "@/store/patientStore";
import { FloatingChatbot } from "@/components/patient/FloatingChatbot";

// --- 1. COMPOSANT CARTE RÉSULTAT (DESIGN AMÉLIORÉ) ---
function ResultCard({ medication, onDelete }: { medication: ScannedMedication, onDelete: () => void }) {
  // Détermine si c'est dangereux ou non
  const isStop = medication.riskLevel === "STOP" || medication.riskLevel === "High";

  return (
    <motion.div
      layout // Animation fluide quand une carte s'ajoute
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="mb-4"
    >
      <Card className={`overflow-hidden border-0 shadow-lg ${
        isStop ? "shadow-red-100" : "shadow-green-100"
      }`}>
        {/* BANDEAU DE TITRE COLORÉ */}
        <div className={`px-5 py-3 flex justify-between items-center text-white ${
           isStop 
           ? "bg-gradient-to-r from-red-500 to-red-600" 
           : "bg-gradient-to-r from-green-500 to-emerald-600"
        }`}>
          <div className="flex items-center gap-2">
            {isStop ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span className="text-sm font-bold uppercase tracking-wide">
              {isStop ? "ARRÊT REQUIS" : "AUTORISÉ"}
            </span>
          </div>
          <button 
            onClick={onDelete} 
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <CardContent className="p-5 bg-white">
          {/* Info Médicament */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{medication.commercialName}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <Pill size={14} className="text-blue-400"/> 
                <span className="font-medium text-blue-600">{medication.genericName}</span>
              </p>
            </div>
            {medication.confidence && (
              <Badge variant="outline" className="text-xs text-slate-400">
                IA: {Math.round(medication.confidence * 100)}%
              </Badge>
            )}
          </div>
          
          {/* Consigne IA */}
          <div className={`p-4 rounded-xl text-sm leading-relaxed border ${
            isStop 
            ? "bg-red-50 text-red-900 border-red-100" 
            : "bg-green-50 text-green-900 border-green-100"
          }`}>
            <p className="font-medium">{medication.instruction}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- 2. COMPOSANT PRINCIPAL ---
export function MedicationScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Liste locale pour l'affichage immédiat
  const [scannedList, setScannedList] = useState<ScannedMedication[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addMedication } = usePatientStore();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  // --- LOGIQUE SCAN ---
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Image requise."); return; }
    
    setIsScanning(true); setIsProcessing(true);
    
    try {
      // 1. OCR
      const ocrResult = await api.scanDrug(file);
      if (!ocrResult.drugName || ocrResult.drugName === "Non reconnu") {
        toast.error("Médicament non reconnu.");
        setIsScanning(false); setIsProcessing(false);
        return;
      }
      
      // 2. RAG (Protocole)
      const query = `Quelle est la consigne pour le médicament ${ocrResult.subCategory} (${ocrResult.drugName}) avant l'opération ?`;
      const protocolResult = await api.getProtocol(query);
      
      const medication: ScannedMedication = {
        id: Date.now().toString(),
        commercialName: ocrResult.drugName,
        genericName: ocrResult.subCategory,
        instruction: protocolResult.protocol,
        // On force le type pour être sûr de la couleur
        riskLevel: protocolResult.riskLevel as "STOP" | "CONTINUE", 
        confidence: ocrResult.confidence,
        scannedAt: new Date().toISOString(),
      };

      // 3. AJOUT À LA LISTE (En haut de la pile)
      setScannedList(prev => [medication, ...prev]);
      addMedication(medication);
      toast.success(`${ocrResult.drugName} ajouté !`);

    } catch (error) {
      console.error(error); toast.error("Erreur IA.");
    } finally {
      setIsScanning(false); setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMedication = (id: string) => {
    setScannedList(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 pb-24">
      
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <Pill size={18} />
            </div>
            <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600">
              AnesthesiaGuard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white px-3 py-1 text-slate-600">
              {scannedList.length} scan{scannedList.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Analysez vos médicaments</h2>
          <p className="text-slate-500">Scannez vos boîtes une par une pour construire votre dossier.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* === GAUCHE : SCANNER (5 colonnes) === */}
          <div className="lg:col-span-5 sticky top-24">
            <Card className="border-none shadow-xl shadow-blue-900/5 bg-white/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-0">
                <div
                  className={`
                    relative rounded-xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-6 p-8 border-2 border-dashed min-h-[450px]
                    ${dragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/50"}
                  `}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                  
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center z-10 animate-in fade-in zoom-in duration-300">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-blue-100 animate-pulse"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        </div>
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-slate-800">Analyse IA...</h3>
                      <p className="text-slate-500 mt-2 text-center max-w-[200px]">Identification et vérification du protocole</p>
                    </div>
                  ) : (
                    <>
                      <div className="relative group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute -inset-4 bg-blue-100/50 rounded-full blur-xl group-hover:bg-blue-200/50 transition-colors" />
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg flex items-center justify-center text-white relative z-10">
                          <Camera size={48} />
                        </div>
                        <div className="absolute -right-3 -top-3 bg-white p-2 rounded-full shadow-md z-20 text-blue-600">
                          <Upload size={20} />
                        </div>
                      </div>
                      <div className="text-center z-10">
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Scanner</h3>
                        <p className="text-slate-500">Cliquez ou glissez une photo ici</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: ScanLine, text: "OCR Rapide", color: "text-blue-500" },
                { icon: Brain, text: "IA Médicale", color: "text-purple-500" },
                { icon: ShieldCheck, text: "Sécurisé", color: "text-green-500" }
              ].map((badge, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border shadow-sm text-center flex flex-col items-center justify-center gap-2">
                  <badge.icon className={`w-5 h-5 ${badge.color}`} />
                  <span className="text-xs font-semibold text-slate-600">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* === DROITE : LISTE DES RÉSULTATS (7 colonnes) === */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <ListPlus className="text-blue-600" />
                Votre liste de médicaments
              </h3>
              {scannedList.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setScannedList([])} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" /> Tout effacer
                </Button>
              )}
            </div>

            <div className="space-y-4 min-h-[200px]">
              <AnimatePresence mode="popLayout">
                {scannedList.length > 0 ? (
                  scannedList.map((med) => (
                    <ResultCard 
                      key={med.id} 
                      medication={med} 
                      onDelete={() => removeMedication(med.id)} 
                    />
                  ))
                ) : (
                  // État Vide
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center bg-white/50 flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                      <Pill size={40} />
                    </div>
                    <h4 className="text-xl font-semibold text-slate-600">Aucun médicament</h4>
                    <p className="text-slate-400 mt-2 max-w-xs mx-auto">
                      Scannez votre premier médicament à gauche pour voir apparaître les consignes ici.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </main>
      <FloatingChatbot />
    </div>
  );
}