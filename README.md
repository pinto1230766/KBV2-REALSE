# Knowledge Base Voyager - KBV Lyon

Application de gestion des visites et des hôtes pour la congrégation de Lyon.

## Fonctionnalités

- Gestion des hôtes et des visites
- Calendrier de planification
- Tableau de bord avec statistiques
- Support hors ligne (PWA)
- Synchronisation cloud (optionnelle)
- Multilingue (Français, Português, Kriol)

## Comment modifier ce code ?

### Utiliser votre IDE préféré

Clonez le dépôt et travaillez localement :

```sh
# Cloner le dépôt
git clone https://github.com/pinto1230766/knowledge-base-voyager.git

# Aller dans le dossier du projet
cd knowledge-base-voyager

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

### Modifier directement sur GitHub

- Accédez au fichier souhaité
- Cliquez sur le bouton "Edit" (icône crayon)
- Faites vos modifications et committez

## Technologies utilisées

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Zustand (gestion d'état)
- Supabase (optionnel - synchronisation cloud)

## Configuration

### Variables d'environnement

Pour activer la synchronisation cloud, créez un fichier `.env` avec :

```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

## Déploiement

Ce projet peut être déployé sur n'importe quel hébergement statique (Vercel, Netlify, GitHub Pages, etc.).

```sh
# Build de production
npm run build
```

## Licence

MIT
