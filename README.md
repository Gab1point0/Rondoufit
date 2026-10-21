# RondouFit

Application de fitness façon RPG (« From Grosdoudou to Rondoudou ») : quêtes de musculation, coach, séance guidée, journal, courbes, suivi du poids, trophées, souvenirs photo et dictée vocale. Utilisable sur téléphone et ordinateur, **même sans réseau** une fois ouverte.

Application en ligne : https://gab1point0.github.io/Rondoufit/

## Sauvegarde

Les données sont gardées sur l'appareil et synchronisées dans **un fichier d'un dépôt GitHub privé** (pastille ☁️ en haut de l'application → « Sauvegarde GitHub »). Chaque appareil lit et met à jour ce fichier ; si deux appareils modifient en même temps, les données sont fusionnées sans perte.

## Développer

```
npm install
npm run dev     # http://localhost:5173
npm test        # tests de la synchronisation et de l'interface
npm run build   # produit dist/
```

Le détail de l'organisation du code est dans [CLAUDE.md](CLAUDE.md).
