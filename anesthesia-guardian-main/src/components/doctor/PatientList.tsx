import { useState } from "react";
import { motion } from "framer-motion";
import { Search, User, Calendar, Activity, ChevronRight, AlertTriangle, Pill } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/lib/api";
import { usePatientStore } from "@/store/patientStore";

interface PatientListProps {
  onSelectPatient: (patient: Patient) => void;
}

export function PatientList({ onSelectPatient }: PatientListProps) {
  const { patients } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStopCount = (patient: Patient) => {
    return patient.medications.filter((m) => m.riskLevel === "STOP" || m.riskLevel === "High").length;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Bar Styled */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Rechercher par nom..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
        />
      </div>

      {/* Patient Cards */}
      <div className="grid gap-4">
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
                className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 border-slate-200 group bg-white overflow-hidden"
                onClick={() => onSelectPatient(patient)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center p-5">
                    
                    {/* Avatar & Status */}
                    <div className="relative mr-5">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <User className="w-7 h-7" />
                      </div>
                      {/* Badge ASA absolu sur l'avatar */}
                      <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                        patient.asaScore.includes("III") || patient.asaScore.includes("IV")
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}>
                        {patient.asaScore}
                      </div>
                    </div>

                    {/* Info Text */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 truncate mb-1">
                        {patient.name}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {patient.age} ans
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-slate-400" />
                          {patient.operationType}
                        </span>
                      </div>
                    </div>

                    {/* Medication Stats / Alerts */}
                    <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
                      <div className="text-right flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                          <Pill className="w-4 h-4 text-slate-400" />
                          {patient.medications.length} meds
                        </div>
                        
                        {stopCount > 0 ? (
                          <Badge variant="destructive" className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 border-red-200 shadow-none">
                            <AlertTriangle className="w-3 h-3" />
                            {stopCount} arrêt{stopCount > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                            RAS
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>

                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredPatients.length === 0 && (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">Aucun patient trouvé</p>
            <p className="text-slate-400 text-sm">Essayez une autre recherche</p>
          </div>
        )}
      </div>
    </div>
  );
}