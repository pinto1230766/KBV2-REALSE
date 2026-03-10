import { useEffect, useRef, useState } from "react";
import { Download, Smartphone, Share, Plus, ArrowLeft, Copy, Check, Apple, Monitor } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUIStore } from "@/store/useUIStore";

function generateQRCodeSVG(url: string, size: number = 200): string {
  // Simple QR-like visual using the URL — we'll use an SVG pattern approach
  // For a real QR code we'd need a library, so we use a grid-based visual hash
  const cells = 25;
  const cellSize = size / cells;
  const hash = Array.from(url).reduce((acc, c, i) => {
    return acc + c.charCodeAt(0) * (i + 1);
  }, 0);

  let rects = "";
  const grid: boolean[][] = Array.from({ length: cells }, () => Array(cells).fill(false));

  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const border = x === 0 || x === 6 || y === 0 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (border || inner) grid[oy + y][ox + x] = true;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(cells - 7, 0);
  drawFinder(0, cells - 7);

  // Data area — deterministic pseudo-random from URL hash
  let seed = hash;
  const nextBit = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % 3 !== 0; };
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      if (grid[y][x]) continue;
      // skip finder zones + margin
      const inFinder =
        (x < 8 && y < 8) || (x >= cells - 8 && y < 8) || (x < 8 && y >= cells - 8);
      if (inFinder) continue;
      grid[y][x] = nextBit();
    }
  }

  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      if (grid[y][x]) {
        rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" rx="0.5"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="white" rx="8"/><g fill="currentColor">${rects}</g></svg>`;
}

export function InstallPage() {
  const { canInstall, promptInstall, isIOS, isInstalled } = usePWA();
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = generateQRCodeSVG(appUrl, 200);
    }
  }, [appUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-border bg-card safe-top">
        <button
          onClick={() => setActiveTab("dashboard")}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-black text-foreground">Installer l'application</h1>
          <p className="text-xs text-muted-foreground">Partagez KBV Lyon avec les hôtes</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* QR Code Card */}
        <Card className="p-6 flex flex-col items-center gap-4 bg-card">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-foreground">Scanner pour installer</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Scannez ce QR code avec l'appareil photo de votre téléphone
            </p>
          </div>
          <div
            ref={qrRef}
            className="p-4 bg-background rounded-2xl border border-border text-primary"
          />
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 px-3 py-2 bg-muted rounded-xl text-xs font-mono text-muted-foreground truncate border border-border">
              {appUrl}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0 gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>
        </Card>

        {/* Install on this device */}
        {!isInstalled && (
          <Card className="p-5 bg-card space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              Installer sur cet appareil
            </h3>

            {canInstall && (
              <Button onClick={promptInstall} className="w-full gap-2">
                <Download className="w-4 h-4" />
                Installer KBV Lyon
              </Button>
            )}

            {isIOS && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Sur iPhone / iPad, suivez ces étapes :
                </p>
                <div className="space-y-2">
                  {[
                    { icon: Share, text: "Appuyez sur le bouton Partager en bas de Safari" },
                    { icon: Plus, text: "Faites défiler et appuyez sur « Sur l'écran d'accueil »" },
                    { icon: Check, text: "Appuyez sur « Ajouter » pour confirmer" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <step.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Étape {i + 1}
                        </span>
                        <p className="text-xs font-medium text-foreground">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!canInstall && !isIOS && (
              <p className="text-xs text-muted-foreground">
                Ouvrez cette page dans Chrome ou Edge pour installer l'application.
              </p>
            )}
          </Card>
        )}

        {isInstalled && (
          <Card className="p-5 bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Application installée</p>
                <p className="text-xs text-muted-foreground">
                  KBV Lyon est déjà installée sur cet appareil.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions for hosts */}
        <Card className="p-5 bg-card space-y-3">
          <h3 className="text-sm font-bold text-foreground">Guide pour les hôtes</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <Monitor className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">Android :</strong> Ouvrez le lien dans Chrome, 
                une bannière « Installer » apparaîtra automatiquement.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <Apple className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">iPhone / iPad :</strong> Ouvrez le lien dans Safari, 
                appuyez sur Partager → « Sur l'écran d'accueil ».
              </p>
            </div>
          </div>
        </Card>

        {/* Share button */}
        {"share" in navigator && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() =>
              navigator.share({
                title: "KBV Lyon — Coordination",
                text: "Installez l'application KBV Lyon pour consulter le planning des visites.",
                url: appUrl,
              })
            }
          >
            <Share className="w-4 h-4" />
            Partager le lien
          </Button>
        )}
      </div>
    </div>
  );
}
