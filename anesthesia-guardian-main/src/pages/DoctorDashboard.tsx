import { useState } from "react";
import { motion } from "framer-motion";
import { Search, User, Calendar, Activity, ChevronRight, Users, Pill, AlertCircle, LayoutGrid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/lib/api";
import { usePatientStore } from "@/store/patientStore";

// --- COMPOSANT STATS (Les 3 cartes du haut) ---
function DashboardStats({ patients }: { patients: Patient[] }) {
  // Calculs simples pour les stats
  const totalPatients = patients.length;
  const totalStop = patients.reduce((acc, p) => acc + p.medications.filter(m => m.riskLevel === "STOP" || m.riskLevel === "High").length, 0);
  const totalContinue = patients.reduce((acc, p) => acc + p.medications.filter(m => m.riskLevel === "CONTINUE" || m.riskLevel === "Low").length, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Carte 1 : Patients Actifs */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{totalPatients}</div>
            <div className="text-sm text-slate-500">Patients actifs</div>
          </div>
        </CardContent>
      </Card>

      {/* Carte 2 : À arrêter */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <span className="font-bold text-lg">{totalStop}</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{totalStop}</div>
            <div className="text-sm text-slate-500">Médicaments à arrêter</div>
          </div>
        </CardContent>
      </Card>

      {/* Carte 3 : Peuvent continuer */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="font-bold text-lg">{totalContinue}</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{totalContinue}</div>
            <div className="text-sm text-slate-500">Peuvent continuer</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- COMPOSANT PRINCIPAL ---
export function DoctorDashboard({ onSelectPatient }: { onSelectPatient: (patient: Patient) => void }) {
  const { patients } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStopCount = (patient: Patient) => 
    patient.medications.filter((m) => m.riskLevel === "STOP" || m.riskLevel === "High").length;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <LayoutGrid className="text-blue-600" />
          Tableau de bord
        </h1>
        <p className="text-slate-500 mt-1">Gérez vos patients et consultez leurs dossiers médicaux en temps réel</p>
      </div>

      {/* Stats Cards */}
      <DashboardStats patients={patients} />

      {/* Section Liste */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users size={20} className="text-blue-500"/> Liste des patients
        </h2>

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
          />
        </div>

        {/* Liste des cartes patients */}
        <div className="space-y-4">
          {filteredPatients.map((patient, index) => {
            const stopCount = getStopCount(patient);
            
            return (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 border-slate-200 bg-white group"
                  onClick={() => onSelectPatient(patient)}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    
                    {/* Gauche : Info Patient */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                        <User size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800">{patient.name}</h3>
                          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50">
                            {patient.asaScore}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} /> {patient.age} ans
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity size={14} /> {patient.operationType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Droite : Résumé Médicaments */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-700">
                          {patient.medications.length} médicaments
                        </div>
                        {stopCount > 0 && (
                          <div className="text-xs text-red-500 font-medium">
                            {stopCount} à arrêter
                          </div>
                        )}
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}