# Images du projet KBV

Ce dossier contient les images utilisées par l'application.

## Structure des dossiers :

```
images/
├── speakers/    # Photos des orateurs
│   └── PLACEHOLDER.md
├── hosts/      # Photos des hôtes
│   └── PLACEHOLDER.md
└── screenshots/ # Captures d'écran pour la documentation
```

## Comment ajouter des photos :

### Pour les orateurs :
1. Exportez les données JSON depuis l'app
2. Extrayez les photos base64
3. Sauvegardez en JPG/PNG dans `images/speakers/`
4. Nommez le fichier avec le nom de l'orateur

### Pour les hôtes :
1. Même procédé
2. Sauvegardez dans `images/hosts/`

## Accès dans le code :
- `/images/speakers/nom-orateur.jpg`
- `/images/hosts/nom-hote.jpg`