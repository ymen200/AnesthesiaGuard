import axios from "axios";

const API_URL = "http://localhost:8050";

// --- TYPES ---
export interface ScannedMedication {
  id: string;
  commercialName: string;
  genericName: string;
  instruction: string;
  riskLevel: "STOP" | "CONTINUE" | "High" | "Low";
  confidence?: number;
  scannedAt?: string;
}

export interface Medication extends ScannedMedication {}

export interface ProtocolResponse {
  protocol: string;
  riskLevel: "High" | "Low";
}

export interface OcrResponse {
  drugName: string;
  subCategory: string;
  confidence: number;
}

export interface PatientProfile {
  age: number;
  weight: number;
  height: number;
  is_smoker: boolean;
  is_alcoholic: boolean;
  has_diabetes: boolean;
  has_hypertension: boolean;
  has_respiratory_issues: boolean;
  recent_events: string;
  detected_medications: string[];
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  operationType: string;
  asaScore: string;
  medications: ScannedMedication[];
  weight?: number;
  height?: number;
  is_smoker?: boolean;
  is_alcoholic?: boolean;
  has_diabetes?: boolean;
  has_hypertension?: boolean;
  has_respiratory_issues?: boolean;
  recent_events?: string;
}

// --- API ---
export const api = {
  scanDrug: async (file: File): Promise<OcrResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(`${API_URL}/ocr/scan`, formData);
    return response.data;
  },

  getProtocol: async (query: string): Promise<ProtocolResponse> => {
    const response = await axios.post(`${API_URL}/rag/protocol`, { query });
    return response.data;
  },

  evaluateAsa: async (profile: PatientProfile) => {
    const response = await axios.post(`${API_URL}/asa/evaluate`, profile);
    return response.data;
  }
};

// --- LE MOCK QUE TON FICHIER CHERCHE ---
export const mockPatients: Patient[] = [
  {
    id: "1",
    name: "Jean Dupont",
    age: 65,
    operationType: "Prothèse totale de hanche",
    asaScore: "ASA II",
    medications: [],
    weight: 85,
    height: 175
  }
];