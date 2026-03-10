import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Church, User, Clock, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore } from "@/store/useSettingsStore";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const updateCongregation = useSettingsStore((s) => s.updateCongregation);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    city: "",
    day: "Dimanche",
    time: "10:00",
    responsableName: "",
    responsablePhone: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const steps = [
    {
      id: "welcome",
      icon: Sparkles,
      title: "Bienvenue sur KBV",
      subtitle: "Application de coordination des visites de conférenciers",
      content: (
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-4xl font-black text-primary">K</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Configurons ensemble votre congrégation en quelques étapes. 
            Toutes vos données resteront privées sur cet appareil.
          </p>
        </div>
      ),
      canNext: true,
    },
    {
      id: "congregation",
      icon: Church,
      title: "Votre congrégation",
      subtitle: "Identifiez votre congrégation",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Nom de la congrégation
            </Label>
            <Input
              id="name"
              placeholder="ex: Lyon Centre"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Ville
            </Label>
            <Input
              id="city"
              placeholder="ex: Lyon"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="bg-muted border-border"
            />
          </div>
        </div>
      ),
      canNext: form.name.trim().length > 0 && form.city.trim().length > 0,
    },
    {
      id: "schedule",
      icon: Clock,
      title: "Jour et heure de réunion",
      subtitle: "Quand se tiennent vos réunions publiques ?",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Jour
            </Label>
            <Select value={form.day} onValueChange={(v) => update("day", v)}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Heure
            </Label>
            <Input
              id="time"
              type="time"
              value={form.time}
              onChange={(e) => update("time", e.target.value)}
              className="bg-muted border-border"
            />
          </div>
        </div>
      ),
      canNext: true,
    },
    {
      id: "responsable",
      icon: User,
      title: "Responsable accueil",
      subtitle: "Qui coordonne l'accueil des orateurs ? (optionnel)",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="respName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Nom du responsable
            </Label>
            <Input
              id="respName"
              placeholder="ex: Jean Dupont"
              value={form.responsableName}
              onChange={(e) => update("responsableName", e.target.value)}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="respPhone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Téléphone
            </Label>
            <Input
              id="respPhone"
              type="tel"
              placeholder="ex: 06 12 34 56 78"
              value={form.responsablePhone}
              onChange={(e) => update("responsablePhone", e.target.value)}
              className="bg-muted border-border"
            />
          </div>
        </div>
      ),
      canNext: true,
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  const handleFinish = () => {
    updateCongregation({
      name: form.name.trim() || "Ma congrégation",
      city: form.city.trim() || "",
      day: form.day,
      time: form.time,
      responsableName: form.responsableName.trim(),
      responsablePhone: form.responsablePhone.trim(),
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-background flex flex-col">
      {/* Progress */}
      <div className="safe-top px-6 pt-6 pb-2">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-bold">
          Étape {step + 1} sur {steps.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
          >
            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <currentStep.icon className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-black text-foreground">{currentStep.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{currentStep.subtitle}</p>
            </div>
            {currentStep.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-6 safe-bottom flex items-center gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStep((s) => s - 1)}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </Button>
        )}
        <Button
          size="lg"
          className="flex-1 gap-1"
          disabled={!currentStep.canNext}
          onClick={isLast ? handleFinish : () => setStep((s) => s + 1)}
        >
          {isLast ? (
            <>
              <Check className="w-4 h-4" />
              Commencer
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
