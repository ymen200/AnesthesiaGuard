import { create } from "zustand";
import { Patient, ScannedMedication, mockPatients } from "@/lib/api";

interface PatientStore {
  patients: Patient[];
  currentPatient: Patient | null;
  scannedMedications: ScannedMedication[]; // Pour le mode Patient (Scanner)
  
  setCurrentPatient: (patient: Patient | null) => void;
  addMedication: (medication: ScannedMedication) => void;
  clearMedications: () => void;
  updatePatientASA: (patientId: string, asaScore: string) => void;
  addMedicationToPatient: (patientId: string, medication: ScannedMedication) => void;
}

export const usePatientStore = create<PatientStore>((set) => ({
  // On charge les données mockées depuis api.ts
  patients: mockPatients,
  currentPatient: null,
  scannedMedications: [],
  
  setCurrentPatient: (patient) => set({ currentPatient: patient }),
  
  // Ajout d'un médicament dans le scanner Patient (Session temporaire)
  addMedication: (medication) =>
    set((state) => ({
      scannedMedications: [medication, ...state.scannedMedications],
    })),
  
  clearMedications: () => set({ scannedMedications: [] }),
  
  // Mise à jour du score ASA (quand l'IA le recalcule)
  updatePatientASA: (patientId, asaScore) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId ? { ...p, asaScore } : p
      ),
      // Si c'est le patient courant, on le met à jour aussi
      currentPatient: state.currentPatient?.id === patientId 
        ? { ...state.currentPatient, asaScore } 
        : state.currentPatient
    })),
  
  // Ajout définitif au dossier patient (Médecin)
  addMedicationToPatient: (patientId, medication) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId
          ? { ...p, medications: [...p.medications, medication] }
          : p
      ),
    })),
}));