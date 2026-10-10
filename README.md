# GhostOS

GhostOS est un faux système d’exploitation rétro-futuriste qui tourne entièrement dans le navigateur. Parcourez les fichiers simulés, restaurez les fragments de mémoire d’ECHO et ouvrez l’archive abandonnée.

## Lancer en local

Aucune installation ni dépendance n’est nécessaire. Depuis la racine du projet, lancez un serveur statique :

```sh
python3 -m http.server 8000
```

Ouvrez ensuite <http://localhost:8000>. Les modules JavaScript natifs nécessitent un serveur HTTP; l’ouverture directe du fichier HTML peut être bloquée par le navigateur.

## Utilisation

- Double-cliquez une icône du bureau ou choisissez une application dans le menu Ghost.
- Déplacez les fenêtres par leur barre de titre; utilisez les commandes réduire, agrandir et fermer. Elles sont redimensionnables depuis leur bord inférieur droit.
- Les raccourcis `Ctrl+Alt+T`, `Ctrl+Alt+E`, `Ctrl+Alt+S` ouvrent respectivement le terminal, l’explorateur et les paramètres. `Ctrl+Shift+Échap` ouvre le gestionnaire des tâches; `Alt+F4` ferme la fenêtre active.
- Dans le terminal, `help` affiche les commandes. `ls`, `cd`, `cat`, `touch` et `mkdir` manipulent uniquement l’arborescence virtuelle. `scan` est un diagnostic narratif sans accès au matériel ou au réseau.
- Les réponses `echo`, `1997`, puis `silence` résolvent les trois fragments. Les indices sont dans les journaux et les fichiers virtuels.
- Les fichiers, thèmes, préférences, progression et applications ouvertes sont conservés dans le `localStorage` du navigateur. « Réinitialiser GhostOS » dans les paramètres efface ces données après confirmation.

## GitHub Pages

1. Poussez le contenu du dépôt vers GitHub.
2. Dans **Settings → Pages**, choisissez le déploiement depuis la branche principale et le dossier racine (`/`).
3. Enregistrez. GitHub Pages publiera `index.html`; les ressources utilisent des chemins relatifs et fonctionnent aussi si le dépôt est publié sous un sous-chemin.

## Sécurité et confidentialité

GhostOS est une fiction exécutée côté client. Il n’accède pas aux fichiers réels, n’exécute aucune commande système, ne contacte aucun backend et ne collecte aucune donnée. Les données enregistrées restent dans le stockage local du navigateur. La connexion réseau n’est nécessaire que pour charger la page elle-même.