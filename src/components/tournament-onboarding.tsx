"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, Users, Calendar, ArrowRight, Check, 
  ChevronLeft, Loader2, Sparkles, Rocket 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TournamentOnboardingProps {
  onComplete?: () => void;
}

export function TournamentOnboarding({ onComplete }: TournamentOnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxPlayers: 64,
    startDate: "",
    entryFee: 0,
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTournament = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/tournament/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          maxPlayers: formData.maxPlayers,
          startDate: formData.startDate,
          entryFee: formData.entryFee,
          status: "ACTIVE",
          allowLateRegistration: true,
          autoStartGames: false,
          showLiveScores: true,
          enableStatistics: true,
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Erstellen");

      toast({
        title: "Ready for takeoff! 🚀",
        description: "Das Turnier wurde erfolgreich initialisiert.",
      });

      if (onComplete) onComplete();
      router.refresh();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Konnte Turnier nicht erstellen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Animation Variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep((prev) => prev + newDirection);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden font-sans text-slate-900">
      
      {/* Background Grid */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] bg-blue-50 opacity-50 blur-[100px]" />
      </div>

      <div className="w-full max-w-xl px-6 relative z-10">
        
        {/* Header / Progress */}
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-200">
               <Trophy className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">New Tournament</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <span>Schritt {step} von 3</span>
            <div className="flex gap-1">
               {[1, 2, 3].map((s) => (
                 <div 
                   key={s} 
                   className={cn(
                     "h-1.5 w-1.5 rounded-full transition-colors", 
                     step >= s ? "bg-slate-900" : "bg-slate-200"
                   )} 
                 />
               ))}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait" custom={direction}>
            
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                    Wie soll das Turnier heißen?
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Gib deinem Event eine Identität.
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">Turniername</Label>
                    <Input
                      id="name"
                      placeholder="z.B. Winter Cup 2025"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="h-14 text-lg bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-300"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-700 font-medium">Beschreibung (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Infos zum Modus, Location, etc..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="min-h-[120px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-all text-base"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: CONFIGURATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                    Die Rahmenbedingungen.
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Lege fest, wer mitspielt und wann es losgeht.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2">
                   <div className="space-y-2">
                     <Label className="text-slate-700">Max. Spieler</Label>
                     <div className="relative">
                        <Users className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <Input 
                           type="number" 
                           value={formData.maxPlayers}
                           onChange={(e) => handleInputChange("maxPlayers", parseInt(e.target.value))}
                           className="h-12 pl-10 text-lg bg-slate-50 border-slate-200"
                        />
                     </div>
                   </div>

                   <div className="space-y-2">
                     <Label className="text-slate-700">Startgebühr (€)</Label>
                     <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400 font-bold">€</span>
                        <Input 
                           type="number" 
                           step="0.01"
                           value={formData.entryFee}
                           onChange={(e) => handleInputChange("entryFee", parseFloat(e.target.value))}
                           className="h-12 pl-8 text-lg bg-slate-50 border-slate-200"
                        />
                     </div>
                   </div>

                   <div className="col-span-1 space-y-2 sm:col-span-2">
                     <Label className="text-slate-700">Startdatum</Label>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <Input 
                           type="date"
                           value={formData.startDate}
                           onChange={(e) => handleInputChange("startDate", e.target.value)}
                           className="h-12 pl-10 text-lg bg-slate-50 border-slate-200"
                        />
                     </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: REVIEW & LAUNCH */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                    Bereit zum Start?
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Überprüfe deine Eingaben bevor wir das Turnier live schalten.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-200/60">
                     <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Turnier</p>
                        <h3 className="text-xl font-bold text-slate-900">{formData.name}</h3>
                     </div>
                     <Badge className="bg-slate-900 hover:bg-slate-800">Draft</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                     <div>
                        <p className="text-slate-400 mb-1">Spieler</p>
                        <p className="font-semibold text-slate-900">{formData.maxPlayers}</p>
                     </div>
                     <div>
                        <p className="text-slate-400 mb-1">Gebühr</p>
                        <p className="font-semibold text-slate-900">{formData.entryFee > 0 ? `${formData.entryFee}€` : 'Kostenlos'}</p>
                     </div>
                     <div>
                        <p className="text-slate-400 mb-1">Datum</p>
                        <p className="font-semibold text-slate-900">
                           {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'TBA'}
                        </p>
                     </div>
                  </div>
                  
                  {formData.description && (
                     <div className="pt-2 text-sm text-slate-500 border-t border-slate-200/60 mt-2">
                        {formData.description}
                     </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={() => paginate(-1)}
            disabled={step === 1 || loading}
            className="text-slate-400 hover:text-slate-700"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Zurück
          </Button>

          <div className="flex items-center gap-4">
             {step === 1 && (
                <Button variant="ghost" className="text-slate-400 hover:text-slate-700" onClick={() => router.push("/dashboard")}>
                   Abbrechen
                </Button>
             )}
             
             {step < 3 ? (
                <Button 
                   onClick={() => paginate(1)} 
                   disabled={!formData.name}
                   className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 shadow-lg shadow-slate-900/20"
                >
                   Weiter <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
             ) : (
                <Button 
                   onClick={handleCreateTournament} 
                   disabled={loading}
                   className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 shadow-lg shadow-blue-600/20"
                >
                   {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Erstelle...
                      </>
                   ) : (
                      <>
                        <Rocket className="h-4 w-4 mr-2" /> Turnier starten
                      </>
                   )}
                </Button>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}