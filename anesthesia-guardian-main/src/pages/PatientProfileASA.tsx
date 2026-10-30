import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Activity, User, Save, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function PatientProfileASA() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form State matching your Python PatientProfile model
  const [formData, setFormData] = useState({
    age: 55,
    weight: 85,
    height: 175,
    is_smoker: true,
    is_alcoholic: false,
    has_diabetes: false,
    has_hypertension: true,
    has_respiratory_issues: false,
    recent_events: "Essoufflement à l'effort",
    detected_medications: ["BISOPROLOL", "AMLODIPINE"] // Simulated data from previous scan
  });

  const handleCalculateASA = async () => {
    setLoading(true);
    try {
      // Call your Python Backend
      const response = await fetch("http://localhost:8050/asa/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);
      toast.success("Score ASA calculé avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion au serveur IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/patient">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-600" />
            Mon Profil & Score ASA
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* LEFT: FORM */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Informations Médicales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Âge</Label>
                    <Input 
                      type="number" 
                      value={formData.age} 
                      onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Poids (kg)</Label>
                    <Input 
                      type="number" 
                      value={formData.weight} 
                      onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taille (cm)</Label>
                    <Input 
                      type="number" 
                      value={formData.height} 
                      onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-sm text-slate-500">Antécédents & Mode de vie</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>Fumeur</Label>
                    <Switch checked={formData.is_smoker} onCheckedChange={(v) => setFormData({...formData, is_smoker: v})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Diabète</Label>
                    <Switch checked={formData.has_diabetes} onCheckedChange={(v) => setFormData({...formData, has_diabetes: v})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Hypertension</Label>
                    <Switch checked={formData.has_hypertension} onCheckedChange={(v) => setFormData({...formData, has_hypertension: v})} />
                  </div>
                   <div className="flex items-center justify-between">
                    <Label>Problèmes Respiratoires</Label>
                    <Switch checked={formData.has_respiratory_issues} onCheckedChange={(v) => setFormData({...formData, has_respiratory_issues: v})} />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                    <Label>Événements Récents</Label>
                    <Input 
                      value={formData.recent_events} 
                      onChange={(e) => setFormData({...formData, recent_events: e.target.value})}
                    />
                </div>

                <Button 
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" 
                    size="lg"
                    onClick={handleCalculateASA}
                    disabled={loading}
                >
                  {loading ? (
                      <>Calcul en cours...</>
                  ) : (
                      <><Calculator className="mr-2 w-4 h-4" /> Calculer mon Score ASA</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* RIGHT: RESULT */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full bg-slate-900 text-white border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="text-emerald-400" />
                        Analyse IA
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center">
                            <Activity className="w-16 h-16 mb-4 opacity-20" />
                            <p>Cliquez sur "Calculer" pour obtenir votre classification de risque anesthésique.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-center p-6 rounded-xl bg-slate-800 border border-slate-700">
                                <span className="text-sm text-slate-400 uppercase tracking-wider">Score Estimé</span>
                                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mt-2">
                                    {result.score}
                                </h2>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-slate-300">Justification de l'IA :</h4>
                                <div className="p-4 rounded-lg bg-slate-800/50 text-sm leading-relaxed border border-slate-700">
                                    {/* Usually the backend returns JSON in 'raw_analysis', here we simulate parsing it or just showing raw */}
                                    {result.raw_analysis}
                                </div>
                            </div>
                            
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 items-start">
                                <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-amber-500" />
                                <p className="text-xs text-amber-200">
                                    Ce score est une estimation basée sur vos déclarations. Seul le médecin anesthésiste peut valider le score final lors de la consultation.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
          </motion.div>

        </div>
      </main>
    </div>
  );
}