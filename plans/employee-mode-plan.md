# Plan: Mode d'emploi (Guide Utilisateur)

## Objectif

Créer une page d'aide complète accessible depuis les Paramètres, avec un bouton dans l'Onboarding (fin étape 5) pour aider les utilisateurs non-techniques.

## Structure du Plan

### 1. Nouvelle Page: usermanualPage.tsx

- **Emplacement**: `src/components/UserManualPage.tsx`
- **Contenu**: Guide complet avec sections pliables
- **Navigation**: Accessible depuis Paramètres + lien depuis Onboarding

### 2. Sections d'Aide à Créer

| # | Section | Description |
| --- | --- | --- |
| 1 | **Créer un orateur** | Comment ajouter un nouvel orateur avec nom, téléphone, congrégation |
| 2 | **Créer un hôte** | Comment ajouter un hôte pour hébergement/transport/repas |
| 3 | **Planning sans Google Sheet** | Comment créer et gérer les visites manuellement |
| 4 | **Gestion des hôtes** | Comment assigner des hôtes à une visite |
| 5 | **Messages WhatsApp** | Guide simplifié pour envoyer des messages |

### 3. Intégrations Requises

#### A. Paramètres (SettingsPage.tsx)

- Ajouter une nouvelle option "Mode Employé / Aide"
- Icône: HelpCircle ou BookOpen

#### B. OnboardingWizard (étape 5)

- Ajouter un bouton "Consulter le guide complet"
- Lien vers la nouvelle page EmployeeModePage

### 4. Traductions (useTranslation.ts)

Ajouter les nouvelles clés:

```typescript
employee_mode: { fr: "Mode d'emploi", cv: "Modu di Usu", pt: "Modo de Uso" },
employee_mode_desc: { fr: "Guide complet pour les utilisateurs", ... },
create_speaker_title: { fr: "Créer un orateur", ... },
// ... etc pour chaque section
```

### 5. Design UI

- Utiliser des composants UI existants (Accordion, Card, Button)
- Sections dépliables pour chaque fonction
- Instructions étape par étape
- Support 3 langues: FR, PT, CV

## Étapes d'Implémentation

```markdown
1. [ ] Ajouter traductions dans useTranslation.ts
2. [ ] Créer EmployeeModePage.tsx avec toutes les sections
3. [ ] Intégrer dans SettingsPage.tsx
4. [ ] Ajouter bouton dans OnboardingWizard étape 5
5. [ ] Tester et vérifier l'intégration
```

## Fichiers à Modifier

| Fichier | Action |
| --- | --- |
| `src/hooks/useTranslation.ts` | Ajouter traductions |
| `src/components/UserManualPage.tsx` | **Créer** - nouvelle page |
| `src/components/SettingsPage.tsx` | Ajouter lien vers EmployeeModePage |
| `src/components/OnboardingWizard.tsx` | Ajouter bouton à l'étape 5 |
| `src/App.tsx` | Ajouter route/navigation vers EmployeeModePage |

## Notes Techniques

- Utiliser `Accordion` de shadcn/ui pour les sections
- Ajouter des icônes Lucide pour chaque section
- La page doit être responsive (mobile-first)
- Stocker les données en local (localStorage) - déjà implémenté
