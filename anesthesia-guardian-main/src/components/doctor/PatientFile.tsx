import { motion } from "framer-motion";
import { ArrowLeft, User, Calendar, Activity, AlertCircle, CheckCircle, Pill, RefreshCw, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Patient, ScannedMedication } from "@/lib/api";
import { useState } from "react";

interface PatientFileProps {
  patient: Patient;
  onBack: () => void;
}

export function PatientFile({ patient, onBack }: PatientFileProps) {
  const [isRefreshingASA, setIsRefreshingASA] = useState(false);
  
  // Filtrage selon le RiskLevel retourné par l'API
  const stopMeds = patient.medications.filter((m) => m.riskLevel === "STOP" || m.riskLevel === "High");
  const continueMeds = patient.medications.filter((m) => m.riskLevel === "CONTINUE" || m.riskLevel === "Low");

  const handleRefreshASA = async () => {
    setIsRefreshingASA(true);
    // Simulation API Call (ici on appellerait l'endpoint d'évaluation IA)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshingASA(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="outline" size="icon" onClick={onBack} className="rounded-full h-10 w-10 border-slate-200 hover:bg-slate-100 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dossier Médical</h1>
          <p className="text-slate-500 text-sm">Vue anesthésiste</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* === COLONNE GAUCHE : INFO PATIENT + ASA === */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Carte Identité */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 text-blue-600 border-4 border-white shadow-lg">
                  <User className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
                <div className="flex justify-center gap-2 mt-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                    <Calendar className="w-3.5 h-3.5" /> {patient.age} ans
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                   <div className="flex items-center justify-center gap-2 text-slate-700 font-medium">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    {patient.operationType}
                   </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Carte ASA Score */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Score ASA
                </span>
                <Button variant="ghost" size="sm" onClick={handleRefreshASA} disabled={isRefreshingASA} className="h-7 text-xs text-blue-600 hover:bg-blue-50">
                  <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshingASA ? "animate-spin" : ""}`} /> 
                  IA Check
                </Button>
              </div>
              <CardContent className="p-6 text-center">
                <div className={`text-4xl font-extrabold mb-1 ${
                   patient.asaScore.includes("III") || patient.asaScore.includes("IV") 
                   ? "text-red-500" 
                   : "text-green-600"
                }`}>
                  {patient.asaScore}
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Classification IA</p>
                <div className="mt-4 text-sm bg-slate-50 p-3 rounded-lg text-slate-600 leading-snug">
                  {patient.asaScore === "ASA I" && "Patient en bonne santé."}
                  {patient.asaScore === "ASA II" && "Maladie systémique légère."}
                  {patient.asaScore === "ASA III" && "Maladie systémique sévère."}
                  {patient.asaScore === "ASA IV" && "Menace pronostic vital."}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* === COLONNE DROITE : MÉDICAMENTS === */}
        <div className="md:col-span-2 space-y-8">
          
          {/* SECTION STOP */}
          {stopMeds.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  À Arrêter impérativement
                  <span className="ml-2 text-sm font-normal text-slate-500">({stopMeds.length})</span>
                </h3>
              </div>
              <div className="grid gap-3">
                {stopMeds.map((med) => (
                  <DoctorMedicationCard key={med.id} med={med} type="STOP" />
                ))}
              </div>
            </motion.div>
          )}

          {/* SECTION CONTINUE */}
          {continueMeds.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Autorisé / À continuer
                  <span className="ml-2 text-sm font-normal text-slate-500">({continueMeds.length})</span>
                </h3>
              </div>
              <div className="grid gap-3">
                {continueMeds.map((med) => (
                  <DoctorMedicationCard key={med.id} med={med} type="CONTINUE" />
                ))}
              </div>
            </motion.div>
          )}

          {/* EMPTY STATE */}
          {patient.medications.length === 0 && (
             <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <Pill className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-semibold text-slate-600">Aucun traitement scanné</h3>
                <p className="text-slate-400 max-w-sm">Le patient n'a pas encore ajouté de médicaments à son dossier via l'application.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sous-composant pour afficher une carte médicament côté docteur
function DoctorMedicationCard({ med, type }: { med: ScannedMedication, type: "STOP" | "CONTINUE" }) {
  const isStop = type === "STOP";
  
  return (
    <Card className={`border-l-4 shadow-sm ${
      isStop ? "border-l-red-500 border-red-100 bg-red-50/30" : "border-l-green-500 border-green-100 bg-white"
    }`}>
      <CardContent className="p-4 flex gap-4 items-start">
        <div className={`mt-1 p-2 rounded-full ${isStop ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
          <Pill size={18} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <div>
              <span className="font-bold text-slate-800 text-lg">{med.commercialName}</span>
              <span className="text-slate-400 mx-2 text-sm">•</span>
              <span className="text-blue-600 font-medium italic">{med.genericName}</span>
            </div>
            {med.confidence && (
              <Badge variant="outline" className="text-[10px] text-slate-400 h-5">
                IA {Math.round(med.confidence * 100)}%
              </Badge>
            )}
          </div>
          
          <p className="text-slate-700 text-sm bg-white/50 p-2 rounded border border-slate-100/50 mt-2">
            <span className="font-semibold text-slate-900">Consigne : </span>
            {med.instruction}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}