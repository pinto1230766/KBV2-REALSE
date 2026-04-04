import { useState, useRef } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  UserPlus, 
  Home, 
  Calendar, 
  Users, 
  MessageCircle, 
  ArrowLeft,
  BookOpen,
  Lightbulb,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  Eye,
  ArrowRight,
  Send,
  Image
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

interface StepWithScreenshotProps {
  stepNumber: number;
  title: string;
  description: string;
  screenshotLabel: string;
}

function StepWithScreenshot({ stepNumber, title, description, screenshotLabel }: StepWithScreenshotProps) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
        {stepNumber}
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        {/* Description text instead of screenshot */}
        <div className="mt-2 px-3 py-2 bg-muted/50 rounded-lg border-l-4 border-primary/30">
          <p className="text-xs text-primary font-medium">{screenshotLabel}</p>
        </div>
      </div>
    </li>
  );
}

interface SectionProps {
  title: string;
  description: string;
  steps: Array<{ title: string; description: string; screenshot: string }>;
  tip: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function HelpSection({ title, description, steps, tip, icon, isOpen, onToggle }: SectionProps) {
  const { t } = useTranslation();
  
  return (
    <div className="border rounded-lg mb-4 overflow-hidden bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div className="text-left">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t">
          <ol className="mt-4 space-y-6">
            {steps.map((step, index) => (
              <StepWithScreenshot
                key={index}
                stepNumber={index + 1}
                title={step.title}
                description={step.description}
                screenshotLabel={step.screenshot}
              />
            ))}
          </ol>
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex gap-3">
            <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">💡 Conseil</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{tip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface UserManualPageProps {
  onBack?: () => void;
}

export function UserManualPage({ onBack }: UserManualPageProps) {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState<number[]>([0]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggleSection = (index: number) => {
    setOpenSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const scrollToSection = (index: number) => {
    setOpenSections([index]);
    setTimeout(() => {
      sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const sections = [
    {
      title: t("section1_title"),
      description: t("section1_desc"),
      steps: [
        { 
          title: "Ouvrir le menu Orateurs", 
          description: "Cliquez sur l'onglet 'Orateurs' en bas de l'écran",
          screenshot: "📱 Écran avec menu bas: Orateurs encadré en bleu"
        },
        { 
          title: t("add_speaker"), 
          description: "Appuyez sur le bouton '+' en haut à droite de l'écran",
          screenshot: "➕ Bouton '+' orange en haut à droite"
        },
        { 
          title: "Remplir les informations", 
          description: "Entrez le nom, téléphone et congrégation de l'orateur",
          screenshot: "📝 Formulaire avec champs: Nom, Téléphone, Congrégation"
        },
        { 
          title: "Sauvegarder", 
          description: "Appuyez sur 'Enregistrer' pour sauvegarder l'orateur",
          screenshot: "💾 Bouton 'Enregistrer' en vert"
        },
      ],
      tip: t("section1_tip"),
      icon: <UserPlus className="w-6 h-6" />,
    },
    {
      title: t("section2_title"),
      description: t("section2_desc"),
      steps: [
        { 
          title: "Ouvrir le menu Hôtes", 
          description: "Cliquez sur l'onglet 'Hôtes' en bas de l'écran",
          screenshot: "📱 Écran avec menu bas: Hôtes encadré en bleu"
        },
        { 
          title: t("add_host"), 
          description: "Appuyez sur le bouton '+' en haut à droite",
          screenshot: "➕ Bouton '+' orange en haut à droite"
        },
        { 
          title: "Remplir les informations", 
          description: "Entrez nom, téléphone, adresse et Choisissez le rôle (hébergement/transport/repas)",
          screenshot: "📝 Formulaire avec rôle sélectionné dans liste déroulante"
        },
        { 
          title: "Sauvegarder", 
          description: "Appuyez sur 'Enregistrer' pour sauvegarder l'hôte",
          screenshot: "💾 Bouton 'Enregistrer' en vert"
        },
      ],
      tip: t("section2_tip"),
      icon: <Home className="w-6 h-6" />,
    },
    {
      title: t("section3_title"),
      description: t("section3_desc"),
      steps: [
        { 
          title: "Ouvrir le Planning", 
          description: "Cliquez sur l'onglet 'Planning' en bas de l'écran",
          screenshot: "📱 Écran avec menu bas: Planning encadré en bleu"
        },
        { 
          title: "Créer une visite", 
          description: t("schedule_visit_btn"),
          screenshot: t("schedule_visit_screenshot")
        },
        { 
          title: "Sélectionner l'orateur", 
          description: "Choisissez l'orateur dans la liste déroulante",
          screenshot: "📋 Liste déroulante avec noms d'orateurs"
        },
        { 
          title: "Choisir la date et heure", 
          description: "Sélectionnez la date, l'heure et le lieu de la réunion",
          screenshot: "📅 Calendrier avec date sélectionnée en vert"
        },
        { 
          title: "Sauvegarder la visite", 
          description: "Appuyez sur 'Enregistrer' pour créer la visite",
          screenshot: "💾 Bouton 'Enregistrer' en vert"
        },
      ],
      tip: t("section3_tip"),
      icon: <Calendar className="w-6 h-6" />,
    },
    {
      title: t("section4_title"),
      description: t("section4_desc"),
      steps: [
        { 
          title: "Ouvrir une visite", 
          description: "Allez dans Planning et cliquez sur une visite existante",
          screenshot: "👆 Touche sur une visite dans la liste"
        },
        { 
          title: "Aller dans Accueil & Logistique", 
          description: "Cliquez sur l'onglet 'Accueil & Logistique'",
          screenshot: "📱 Onglets: Infos | Messages | Dépenses | Accueil & Logistique"
        },
        { 
          title: "Assigner un hôte", 
          description: "Appuyez sur 'Assigner un hôte'",
          screenshot: "👤 Bouton 'Assigner un hôte'"
        },
        { 
          title: "Choisir le rôle", 
          description: "Sélectionnez: hébergement, transport ou repas",
          screenshot: "📋 Menu avec 3 options: Hébergement, Transport, Repas"
        },
        { 
          title: "Sélectionner l'hôte", 
          description: "Choisissez l'hôte dans la liste et confirmez",
          screenshot: "✅ Hôte sélectionné avec coche verte"
        },
      ],
      tip: t("section4_tip"),
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: t("section5_title"),
      description: t("section5_desc"),
      steps: [
        { 
          title: "Accéder aux messages", 
          description: "Allez dans une visite, un orateur ou un hôte, puis cliquez sur l'onglet Messages",
          screenshot: "💬 Onglet Messages dans la page de détails"
        },
        { 
          title: "Types de messages disponibles", 
          description: "Vous avez accès à plusieurs types de messages: Message de visite, Message de confirmation, Message de rappel, Message de feedback",
          screenshot: "📋 Liste des modèles: Contact, Confirmation, Rappel, Feedback"
        },
        { 
          title: "Choisir un modèle", 
          description: "Sélectionnez un modèle de message prédéfini ou créez un message personnalisé",
          screenshot: "📝 Appuyez sur un modèle pour le sélectionner"
        },
        { 
          title: "Personnaliser le message", 
          description: "Vous pouvez modifier le texte avant d'envoyer. Le message se préremplit automatiquement avec les infos de la visite (nom, date, heure)",
          screenshot: "✏️ Modifiez le texte dans le champ de message"
        },
        { 
          title: "Envoyer via WhatsApp", 
          description: "Appuyez sur le bouton vert 'Envoyer via WhatsApp' pour ouvrir l'application",
          screenshot: "📤 Bouton vert avec logo WhatsApp"
        },
        { 
          title: "WhatsApp s'ouvre", 
          description: "Votre message est prérempli dans WhatsApp. Vérifiez et appuyez sur envoyer",
          screenshot: "✅ WhatsApp s'ouvre avec le message prêt"
        },
        { 
          title: "Envoyer depuis la liste", 
          description: "Vous pouvez aussi envoyer un message directement depuis la liste des orateurs ou hôtes en appuyant sur l'icône WhatsApp",
          screenshot: "💬 Icône WhatsApp à côté de chaque contact"
        },
      ],
      tip: t("section5_tip"),
      icon: <MessageCircle className="w-6 h-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/10 dark:bg-primary/20 p-4 border-b">
        <div className="max-w-2xl mx-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("back_to_settings")}
            </button>
          )}
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t("user_manual")}</h1>
              <p className="text-sm text-muted-foreground">{t("user_manual_desc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-green-800 dark:text-green-200 mb-1">
            {t("user_manual_welcome")}
          </h2>
          <p className="text-sm text-green-700 dark:text-green-300">
            {t("user_manual_intro")}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <Eye className="w-4 h-4" />
            <span>Les images ci-dessous montrent à quoi ressemblent les écrans</span>
          </div>
        </div>

        {/* Quick Icons Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserPlus className="w-4 h-4" />
            <span>{t("speakers")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Home className="w-4 h-4" />
            <span>{t("hosts")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{t("planning")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </div>
        </div>

        {/* Legend for screenshot placeholders */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">Légende des images:</p>
          <div className="flex flex-wrap gap-2 text-xs text-blue-700 dark:text-blue-300">
            <span>📱 = Écran</span>
            <span>➕ = Bouton ajouter</span>
            <span>📝 = Formulaire</span>
            <span>💾 = Sauvegarder</span>
            <span>📋 = Liste</span>
            <span>📅 = Calendrier</span>
            <span>👤 = Contact</span>
            <span>✅ = Validé</span>
            <span>💬 = Messages</span>
            <span>📤 = Envoyer</span>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground mb-2">Aller directement à:</p>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => scrollToSection(0)}
              className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors flex items-center gap-1"
            >
              <UserPlus className="w-3 h-3" />
              {t("speakers")}
            </button>
            <button 
              onClick={() => scrollToSection(1)}
              className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors flex items-center gap-1"
            >
              <Home className="w-3 h-3" />
              {t("hosts")}
            </button>
            <button 
              onClick={() => scrollToSection(2)}
              className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              {t("planning")}
            </button>
            <button 
              onClick={() => scrollToSection(3)}
              className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors flex items-center gap-1"
            >
              <Users className="w-3 h-3" />
              Hôtes & Visites
            </button>
            <button 
              onClick={() => scrollToSection(4)}
              className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors flex items-center gap-1"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </button>
          </div>
        </div>

        {/* Sections */}
        {sections.map((section, index) => (
          <div ref={(el) => { sectionRefs.current[index] = el; }} key={index}>
            <HelpSection
              title={section.title}
              description={section.description}
              steps={section.steps}
              tip={section.tip}
              icon={section.icon}
              isOpen={openSections.includes(index)}
              onToggle={() => toggleSection(index)}
            />
          </div>
        ))}

        {/* Contact Support */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">{t("need_help")}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {t("contact_support_emergency") || "Pour toute question urgente concernant l'application, contactez:"}
          </p>
          <p className="text-sm text-muted-foreground">
            <a href="mailto:pinto12397@gmail.com" className="text-primary hover:underline">pinto12397@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
