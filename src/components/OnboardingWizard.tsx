import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Church, User, Clock, Check, Sparkles, Globe, MapPin, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSpeakerStore } from "@/store/useSpeakerStore";
import { useHostStore } from "@/store/useHostStore";
import { useVisitStore } from "@/store/useVisitStore";
import type { Language } from "@/store/visitTypes";
import { useTranslation } from "@/hooks/useTranslation";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const LANGUAGES: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: "fr", name: "Français", nativeName: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Português", nativeName: "Português", flag: "🇵🇹" },
  { code: "cv", name: "Cape Verdean Creole", nativeName: "Kriol Kabuverdianu", flag: "🇨🇻" },
];

interface OnboardingWizardProps {
  onComplete: () => void;
  onShowUserManual?: () => void;
}

export function OnboardingWizard({ onComplete, onShowUserManual }: OnboardingWizardProps) {
  const updateCongregation = useSettingsStore((s) => s.updateCongregation);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
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
      id: "language",
      icon: Globe,
      title: t("welcome"),
      subtitle: t("app_description"),
      content: (
        <div className="space-y-4 text-center">
          <div className="grid grid-cols-3 gap-4 pt-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setSelectedLanguage(lang.code);
                  setLanguage(lang.code);
                }}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedLanguage === lang.code
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-5xl">{lang.flag}</span>
                <span className="text-sm font-bold text-foreground">{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>
      ),
      canNext: selectedLanguage !== null,
    },
    {
      id: "welcome",
      icon: Globe,
      title: selectedLanguage === "cv" ? "Bun vinda" : selectedLanguage === "pt" ? "Bem-vindo" : "Bienvenue",
      subtitle: selectedLanguage === "cv" ? "Aplicason di koordenamentu di vizitas" : selectedLanguage === "pt" ? "Aplicativo de coordenação de visitas" : "Application de coordination des visites",
      content: (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {selectedLanguage === "cv" ? "Konfigurans jundu bo kongregason em kalker etapas. Tudu bo dadus ta fica privadu na dispositivo." : selectedLanguage === "pt" ? "Vamos configurar sua congregação em algumas etapas. Todos os seus dados permanecerão privados neste dispositivo." : "Configurons ensemble votre congrégation en quelques étapes. Toutes vos données resteront privées sur cet appareil."}
          </p>
        </div>
      ),
      canNext: true,
    },
    {
      id: "congregation",
      icon: MapPin,
      title: t("congregation_profile"),
      subtitle: "",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("congregation_name")}
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
              {t("city")}
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
      title: form.name ? `${form.name}` : t("schedule"),
      subtitle: selectedLanguage === "cv" ? "Koru ki reunions publiku ta sta?" : selectedLanguage === "pt" ? "Quando se reúnem as reuniões públicas?" : "Quand se tiennent vos réunions publiques ?",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("day")}
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
              {t("time")}
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
      title: form.name ? `${form.name}` : t("reception_manager"),
      subtitle: selectedLanguage === "cv" ? "Keni ta koordena akolimentu di oradores? (opasonal)" : selectedLanguage === "pt" ? "Quem coordena o acolhimento dos oradores? (opcional)" : "Qui coordonne l'accueil des orateurs ? (optionnel)",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="respName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("full_name")}
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
              {t("phone")}
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
    
    // Add sample data for demonstration
    const addSpeaker = useSpeakerStore.getState().addSpeaker;
    const addHost = useHostStore.getState().addHost;
    const addVisit = useVisitStore.getState().addVisit;
    
    // Sample speaker
    addSpeaker({
      id: "sample-speaker-1",
      nom: "Jean Dupont",
      congregation: form.name.trim() || "Ma congrégation",
      telephone: "+33 6 12 34 56 78",
      email: "jean.dupont@email.com",
      notes: "Ancien responsable du programme",
      householdType: "single",
    });
    
    // Sample host
    addHost({
      id: "sample-host-1",
      nom: "Marie Martin",
      adresse: "123 Rue de la Paix, Paris",
      telephone: "+33 6 98 76 54 32",
      email: "marie.martin@email.com",
      capacity: 4,
      role: "hebergement",
      notes: "Grande maison avec jardin",
    });
    
    // Sample visit (next month)
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const visitDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15, 11, 0);
    
    addVisit({
      visitId: "V-" + Date.now(),
      nom: "Jean Dupont",
      congregation: form.name.trim() || "Ma congrégation",
      visitDate: visitDate.toISOString(),
      status: "scheduled",
      locationType: "kingdom_hall",
      talkNoOrType: "1",
      talkTheme: "L'amour de Dieu",
      speakerPhone: "+33 6 12 34 56 78",
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
      <div className="px-6 pb-6 safe-bottom flex flex-col items-center gap-3">
        <Button
          size="lg"
          className="w-full gap-1"
          disabled={!currentStep.canNext}
          onClick={() => {
            // Set language when moving from language step
            if (step === 0 && selectedLanguage) {
              setLanguage(selectedLanguage);
            }
            if (isLast) handleFinish();
            else setStep((s) => s + 1);
          }}
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
