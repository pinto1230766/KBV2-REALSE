# Points de Vigilance — KBV2

## 1. Complexité de Maintenance Multi-Plateforme

### Constat

Le projet cible **3 plateformes** simultanément :

- **Web (PWA)** : build Vite standard + service worker
- **Mobile (Android/iOS)** : via Capacitor (`@capacitor/android`, `@capacitor/ios`)
- **Desktop** : via Electron (`electron-builder`)

### Risques identifiés

| Plateforme         | Stockage                                       | Spécificités                     |
|--------------------|------------------------------------------------|----------------------------------|
| Web/PWA            | `localStorage` (Zustand persist) + IndexedDB   | Service worker offline, share_target |
| Android            | `@capacitor/android` — stockage natif          | Notifications push, Haptics      |
| iOS                | `@capacitor/ios` — stockage natif              | Safe areas, standalone mode      |
| Desktop (Electron) | `electron/main.cjs` — fichier système          | Fenêtre native, menu système     |

### Code problématique

Dans `src/lib/syncCloud.ts` (ligne 243-258), la fonction `_safeStorageSet` utilise `localStorage` qui est **uniquement disponible en Web**. Sous Capacitor ou Electron, `localStorage` existe mais peut avoir des quotas très bas (5-10 Mo).

```typescript
function _safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (_err) {
    // Quota exceeded — remove existing keys to free space, then retry
  }
```

### Recommandations

1. **Abstraction du stockage** : Créer une interface `StorageAdapter` unique qui utilise le bon backend selon la plateforme :

```typescript
// src/lib/storageAdapter.ts
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function getStorageAdapter(): StorageAdapter {
  // Détection de l'environnement
  if (typeof window !== 'undefined' && window.electronAPI) {
    return new ElectronStorageAdapter();
  }
  if (typeof window !== 'undefined' && window.Capacitor) {
    return new CapacitorStorageAdapter();
  }
  return new WebStorageAdapter(); // localStorage par défaut
}
```

1. **Séparer les logiques spécifiques à chaque plateforme** dans des dossiers dédiés :

```
src/
  platform/
    web/
      pwa.ts
      serviceWorker.ts
    mobile/
      capacitor.ts
      haptics.ts
    desktop/
      electron.ts
      fileSystem.ts
```

1. **Tests cross-plateforme** : Ajouter des tests unitaires qui mockent chaque environnement.

---

## 2. Dépendances et Gestionnaire de Paquets (Bun)

### Constat

Le projet utilise **Bun** comme gestionnaire de paquets, avec un fichier `bun.lock` présent. Cependant, `package-lock.json` est également présent, signe d'une migration incomplète.

### Fichiers trouvés

- `bun.lock` — Package manager officiel
- `package-lock.json` — Ancien lock npm (obsolète ?)

### Problèmes potentiels

1. **Friction contributeurs** : Les contributeurs habitués à `npm` ou `yarn` peuvent obtenir des dépendances inconsistantes s'ils n'utilisent pas Bun.
2. **CI/CD mal configurée** : La CI doit explicitement installer Bun (pas inclus par défaut sur GitHub Actions).
3. **Lock file dupliqué** : Avoir `bun.lock` ET `package-lock.json` peut causer des confusions.

### Recommandations pour Bun

**a) Supprimer le fichier `package-lock.json`** (obsolète si Bun est le gestionnaire officiel) :

```bash
git rm package-lock.json
```

**b) Mettre à jour la CI/CD** (`.github/workflows/ci.yml`) pour installer Bun :

```yaml
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: latest
- run: bun install
- run: bun run typecheck
- run: bun run test
```

**c) Ajouter un fichier de configuration** à la racine pour forcer l'utilisation de Bun :

```bash
# .bunrc
package_manager = "bun@latest"
```

---

## 3. Synchronisation Supabase ↔ Local (Critique)

### Constat sur la synchronisation

La logique de synchronisation est dans `src/lib/syncCloud.ts` (367 lignes). Les données sont stockées localement via Zustand + `localStorage` (persist), et synchronisées avec Supabase.

### Analyse du code de sync

#### Points forts ✅

- **Comparaison par `updatedAt`** : La fonction `mergeItem` dans `src/lib/dedup.ts` utilise le timestamp pour déterminer le gagnant d'un conflit.
- **Filtrage des données d'exemple** : Les entrées "Jean Dupont / Marie Martin" sont nettoyées côté distant.
- **UUID déterministe** : `toUUID()` convertit les IDs locaux en UUID v4 valides pour Supabase.
- **Gestion des erreurs** : La plupart des appels Supabase ont un `try/catch` et un log.

#### Problèmes identifiés 🔴

##### Problème 1 : Perte totale des données locales à chaque sync (CRITIQUE)

```typescript
// src/lib/syncCloud.ts, ligne 271-279
localStorage.removeItem("kbv-speakers");
localStorage.removeItem("kbv-visits");
localStorage.removeItem("kbv-hosts");
localStorage.removeItem("kbv-notifications");
```

**Impact** : Si la connexion à Supabase échoue après cette suppression, **toutes les données locales sont perdues**. L'utilisateur perd son planning.

**Correction** : Ne supprimer les données locales **qu'après** avoir reçu avec succès les données distantes :

```typescript
// Version corrigée
const { data: remoteVisits, error: pullVisitsError } = await supabase.from("visits").select("*");
// ... pull speakers, hosts ...

// Maintenant seulement, nettoyer et réécrire
if (!pullVisitsError && !pullSpeakersError && !pullHostsError) {
  localStorage.removeItem("kbv-speakers");
  localStorage.removeItem("kbv-visits");
  localStorage.removeItem("kbv-hosts");
  // ... réécrire avec les données fusionnées
} else {
  // Garder les données locales intactes
  logger.warn("Sync partiel — données locales conservées");
}
```

##### Problème 2 : Race condition pendant le merge

```typescript
// ligne 303
const finalVisits = mergeVisits(localVisits.filter(...), cleanRemoteVisits);
useVisitStore.getState().setVisits(finalVisits);
```

**Impact** : Si l'utilisateur modifie une visite **pendant** la sync (entre le `getState()` et le `setVisits()`), les modifications sont perdues car écrasées par l'ancien `localVisits` lu au début.

**Correction** : Utiliser un mécanisme de "compare-and-swap" :

```typescript
async function safeMergeVisits(cleanRemote: Visit[]) {
  const current = useVisitStore.getState().visits;
  const merged = mergeVisits(current.filter(...), cleanRemote);
  useVisitStore.getState().setVisits(merged);
}
```

##### Problème 3 : Aucune gestion des conflits utilisateur

La politique "le plus récent gagne" est trop simpliste. Si un utilisateur modifie un champ sur son téléphone (ex: "notes") et un autre utilisateur modifie un champ différent (ex: "status") sur le même objet, l'une des modifications est entièrement perdue.

**Correction** : Implémenter un merge au niveau des champs (merge granulaire) plutôt que des objets entiers :

```typescript
// Au lieu d'écraser tout l'objet, merger champ par champ
function mergeVisitFields(local: Visit, remote: Visit): Visit {
  const merged = { ...local };
  for (const key of Object.keys(remote) as Array<keyof Visit>) {
    if (key === 'updatedAt' || key === 'visitId') continue;
    const localVal = local[key];
    const remoteVal = remote[key];
    // Si le champ distant est plus récent et différent, prendre le plus récent
    if (remoteVal !== undefined && remoteVal !== localVal) {
      merged[key] = remoteVal;
    }
  }
  merged.updatedAt = new Date().toISOString();
  return merged;
}
```

##### Problème 4 : Absence de file d'attente offline

Si l'utilisateur est hors ligne et modifie des données, ces modifications sont perdues lors de la sync car la fonction `syncCloud()` écrase tout avec les données Supabase.

**Correction** : Mettre en place un "outbox" (file d'attente) qui enregistre les opérations locales faites hors ligne et les rejoue après la sync :

```typescript
// src/store/useOutboxStore.ts
interface OutboxEntry {
  id: string;
  timestamp: string;
  type: "visit" | "speaker" | "host";
  action: "update" | "create" | "delete";
  payload: unknown;
}

// Après un sync réussi, rejouer la file d'attente
export async function flushOutbox() {
  const entries = useOutboxStore.getState().entries;
  for (const entry of entries) {
    await applyOutboxEntry(entry);
  }
  useOutboxStore.getState().clear();
}
```

---

## Résumé des Risques et Priorités

| # | Risque                                                                 | Gravité    | Probabilité | Priorité |
|---|------------------------------------------------------------------------|------------|-------------|----------|
| 1 | Perte données si échec Supabase après clear localStorage               | 🔴 Critique | Moyenne     | **URGENT** |
| 2 | Écrasement des modifications utilisateur pendant sync                  | 🔴 Élevé   | Faible      | **HAUTE** |
| 3 | Conflits non gérés (merge objet entier vs champs)                      | 🟡 Moyen   | Faible      | MOYENNE  |
| 4 | Pas de file d'attente offline                                          | 🟡 Moyen   | Faible      | MOYENNE  |
| 5 | `bun.lock` + `package-lock.json` dupliqués                              | 🟢 Faible  | Élevé       | BASSE    |
| 6 | Pas d'abstraction de stockage multi-plateforme                         | 🟢 Faible  | Moyen       | BASSE    |
