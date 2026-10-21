# Rondoufit — contexte du projet (à lire en premier)

Application de fitness façon RPG Pokémon pour **un seul utilisateur** (français, Gabin). Publiée sur GitHub Pages depuis `main` (repo `gab1point0/rondoufit`).

## Règles de travail avec l'utilisateur
- Parler **français**, réponses courtes, orientées résultat.
- **Pousser sur `main` automatiquement** une fois les tests faits (autorisation permanente de l'utilisateur, 21/10/2026), puis **expliquer clairement ce qui a changé**. Ne pas publier de données personnelles.
- Livrer aussi `index.html` à l'utilisateur quand il le demande (il teste souvent depuis son téléphone).
- Commits : message en français + trailers `Co-Authored-By` / `Claude-Session` demandés par l'environnement.
- Les évolutions sont des demandes de fonctionnalités ; vérifier dans un navigateur (Playwright) avant de livrer.

## Architecture
- **Un seul fichier `index.html`** (~520 Ko) : React 18 + Babel + Tailwind par CDN, tout le code dans `<script type="text/babel">`.
- Sauvegarde : `localStorage` clé `rondoudou_save_v1` + horodatage `rondoudou_local_ts`, et **Google Sheets** via un Google Apps Script (`SCRIPT_URL` en haut du fichier). Feuille « Save RondouFIT », JSON complet en cellule A2 (champ `_savedAt` = horodatage ms).
- **Photos souvenirs** : IndexedDB `rondoufit_photos` (hors synchro Google), export/import JSON dans l'onglet « 📸 Souvenirs ».
- État principal `gameState` : `xp, quests, weightHistory, unlockedAchievements, claimedChallenges, userWeightKg, targetWeightKg, coach, …`. Fusionné avec `INITIAL_STATE` au chargement (les nouveaux champs doivent avoir un défaut).
- Quête : `{id, catalogId, name, category, type:'strength'|'cardio', unit:'kg'|'reps'|'min'|'km', goalMode, goalSets, goalReps, startValue, currentValue, goalValue, setDetails, history[], timed?}`. Entrées « Point de départ » reconnues par `isStartEntry`.

## Fonctions principales
- **Catalogue d'exercices** (`BASE_EXERCISE_CATALOG`, `NEW_STRENGTH_ROWS`, alias vocaux). Salle de l'utilisateur : abdos obliques/transverses uniquement via les machines *Hammer Strength Oblique Crunch* (`hs_oblique_crunch`) et *Technogym Total Abdominal* (`tg_total_abdominal`).
- **Exercices chronométrés** (planche, etc.) : `timed:true`, valeurs en secondes (`isTimedQuest`, `repUnit`, `timedAdvice`, `TIMED_PRESETS`) ; +5 s par progression ; chrono en séance guidée.
- **🧠 Coach** (règles issues d'études : ACSM 2009, Schoenfeld 2016/2017, Spiering 2021, Garthe 2011, Morton 2018, Bell 2023, Mifflin 1990, Epley 1985) : progression auto (`computeExerciseTarget`), planning hebdo avec volley jeudi/vendredi, matchs, créneaux de salle, mode 3 séances (Full body / Jambes / Haut du corps), durée cible 60 min (repos inclus), séance guidée, bilan, nutrition, objectifs hebdo. Fonctions `coach*` insérées avant `function RestTimer`. Ce n'est pas un avis médical.
- **Photos** : `PhotoDB`, `usePhotos`, `SessionPhoto` (bilan de fin de séance, rappel), `PhotoCalendar` (calendrier mensuel + export PNG), `PhotoReminder` (bandeau).
- **Synchro sécurisée** (`App`, `loadCloud`) : ne jamais écrire sur le cloud s'il n'a pas pu être lu (`cloudOk`), la version la plus récente gagne (`_savedAt` vs `rondoudou_local_ts`), relecture au retour sur l'app. *Contexte : un téléphone avait écrasé le Sheets avec l'état de départ.*

## Tester (environnement cloud sans CDN)
Le cloud bloque les CDN et npm : `tools/uitest/` construit l'app avec esbuild + React installés dans `/opt/npm-tools` et la teste avec Playwright (Chromium dans `/opt/pw-browsers`).
```
bash tools/uitest/build.sh          # extrait le babel de index.html -> app.js
python3 tools/uitest/run.py         # séance guidée + bilan
python3 tools/uitest/t9.py          # photos
python3 tools/uitest/t10.py         # scénarios de synchro (faux serveur Google)
```
Les requêtes `script.google.com` sont interceptées/avortées en test. Les scripts supposent `/tmp/uitest` (voir `build.sh`/`page.html`, à adapter si besoin).

## Pièges connus
- Modifier une quête existante côté Sheets : écrire `_savedAt` récent, sinon les appareils ne reprennent pas le cloud.
- Les valeurs de départ de l'app contiennent des données de démo (séances du jour) : ne pas les prendre pour des données réelles.
- Anciens objectifs conservés si on retire un exercice du catalogue (seul le catalogue change).
