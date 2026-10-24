# Rondoufit — contexte du projet (à lire en premier)

Application de fitness façon RPG Pokémon pour **un seul utilisateur** (français, Gabin). Publiée sur GitHub Pages depuis `main` (repo `gab1point0/rondoufit`) : https://gab1point0.github.io/Rondoufit/

## Règles de travail avec l'utilisateur
- Parler **français**, réponses courtes, orientées résultat. L'utilisateur n'est pas développeur : instructions simples, pas de jargon.
- **Pousser sur `main` automatiquement** une fois les tests faits (autorisation permanente de l'utilisateur, 21/10/2026), puis **expliquer clairement ce qui a changé**. Ne pas publier de données personnelles. Pour un gros chantier (refonte, changement de sauvegarde…), demander avant de publier.
- Commits : message en français + trailers `Co-Authored-By` / `Claude-Session` demandés par l'environnement.
- Les évolutions sont des demandes de fonctionnalités ; lancer `npm test`, puis vérifier dans un navigateur (`npm run dev`) avant de livrer.

## Pile et commandes
Vite 8 · React 18 · Tailwind 3 (compilé, plus de CDN) · JavaScript/JSX (pas de TypeScript) · Vitest + jsdom pour les tests.
```
npm run dev      # serveur local http://localhost:5173
npm test         # tests : fusion/synchro (logique) + parcours complets de l'appli (faux navigateur)
npm run build    # dist/ (c'est ce que GitHub Actions publie)
npm run icons    # régénère public/icon-*.png depuis assets/icon-source.png
```
Déploiement : push sur `main` → `.github/workflows/deploy.yml` (tests + build + Pages). `vite.config.js` utilise `base: './'`. Application installable et utilisable hors ligne (`public/sw.js`, `public/manifest.webmanifest`).

## Organisation du code (`src/`)
```
main.jsx            point d'entrée (monte <App/>, enregistre le service worker)
App.jsx             assemble les hooks, l'en-tête, les onglets et les fenêtres
hooks/              la logique de l'appli, un hook par sujet :
                    useGameState (état + enregistrement local + synchro), useGithubSync, useToast, useRewards (trophées,
                    records, annuler), useLogSession (« Noter séance »), useLevelUp, useQuestForm, useQuickCardio,
                    useWeightLog, useGuidedSession, useDataTransfer (export/import/réinitialisation), useDerivedStats,
                    useQuestActions
tabs/               un fichier par onglet (Quêtes, Journal, Courbes, Poids, Bilan, Trophées)
modals/             fenêtres (noter une séance, objectif, course du jour, niveau supérieur, réinitialisation, sauvegarde GitHub)
components/         en-tête, bandeaux, séance guidée, minuteur de repos, dictée vocale, avatar, photos, coach/ (onglet Coach)
coach/              règles du coach (progression, planning, séances, note, conseils) — fonctions pures, sans React
voice/              dictée vocale : dictionnaire d'exercices + analyse de phrase
lib/                dates, stats, trophées, calories, progression, photos (IndexedDB), sons
data/               catalogue d'exercices, arènes, rangs/trophées, état de départ, normalisation de l'état
sync/               github.js (API Contents), merge.js (fusion à 3 voies), engine.js (algorithme), storage.js (réglages locaux)
legacy/             googleSheets.js : ancienne sauvegarde, gardée UNIQUEMENT pour la reprise unique des données
```
Accueil : la grande carte **Coach** (`components/CoachBanner.jsx` : prochaine séance, « Lancer ma séance », « Ouvrir le Coach ») est en haut de la page ; l'onglet Coach est le premier de `TabBar`. La dictée vocale (`VoiceWorkoutAssistant`) est un petit bouton « 🎤 Dicter » dans `header/HeaderActions.jsx` qui ouvre une fenêtre.

Pour modifier un écran : le fichier de `tabs/`, `modals/` ou `components/` correspondant. Pour une règle du coach : `coach/`. Pour ajouter un exercice : `data/catalog.js` (+ alias vocaux dans `voice/dictionary.js`).

## Modèle de données
État principal `gameState` : `xp, quests, weightHistory, unlockedAchievements, claimedChallenges, userWeightKg, targetWeightKg, coach, …`. Fusionné avec `INITIAL_STATE` (`data/initialState.js`) au chargement (`normalizeState`) : **tout nouveau champ doit avoir une valeur par défaut dans `INITIAL_STATE`**.

Quête : `{id, catalogId, name, category, type:'strength'|'cardio', unit:'kg'|'reps'|'min'|'km', goalMode, goalSets, goalReps, startValue, currentValue, goalValue, setDetails, history[], timed?}`. Entrées « Point de départ » reconnues par `isStartEntry`. Chaque quête et chaque entrée d'historique / pesée a un `id` unique (la fusion de la sauvegarde s'appuie dessus).

Exercices chronométrés (planche…) : `timed:true`, valeurs en secondes (`isTimedQuest`, `repUnit`, `timedAdvice`, `TIMED_PRESETS`), +5 s par progression. Salle de l'utilisateur : abdos obliques/transverses uniquement via *Hammer Strength Oblique Crunch* (`hs_oblique_crunch`) et *Technogym Total Abdominal* (`tg_total_abdominal`).

Coach (`coach/`, repères : ACSM 2009, Schoenfeld 2016/2017, Spiering 2021, Garthe 2011, Morton 2018, Bell 2023, Mifflin 1990, Epley 1985) : progression auto (`computeExerciseTarget`), planning hebdo avec volley jeudi/vendredi, matchs, créneaux de salle, mode 3 séances, durée cible 60 min, séance guidée, bilan, nutrition, objectifs hebdo. Ce n'est pas un avis médical.

## Niveaux, EXP, rangs (refonte du 21/10/2026)
- **Courbe** (`lib/levels.js`) : EXP cumulée pour le niveau L = 300 × (L−1)^1,6 (niveau 5 ≈ 2 800 EXP, 10 ≈ 10 000, 20 ≈ 33 000, 50 ≈ 150 000). Pour changer le rythme, ne toucher qu'à `XP_BASE` / `XP_EXPONENT`. Niveau max 100.
- **Rangs** (`data/gamification.js`, `RPG_RANKS`) : 7 rangs, du niveau 1 (Novice) au 50 (Maître des Arènes).
- **Épreuves de rang** (`data/trials.js`, `hooks/useRankTrial.js`, `modals/RankTrialModal.jsx`) : pour passer un rang il faut aussi réussir une épreuve (jours d'entraînement, semaines d'affilée, exercices niveau 2+, kcal). Tant qu'elle n'est pas réussie, le niveau reste bloqué juste avant le rang (`levelInfo.locked`) et l'EXP s'accumule en réserve. Réussies : `gameState.rankTrials` (niveaux des rangs).
- **EXP gagnée** : toujours via `computeXp(state, base, today, kind)` de `lib/xp.js` (jamais `xp: prev.xp + n`), avec `kind` = `'session'` (bonus de régularité +10 %/semaine d'affilée, max +50 %, puis plafond du jour), `'minor'` (plafond seulement) ou `'reward'` (trophées, défis, objectifs hebdo : tel quel). Plafond du jour : au-delà de 600 EXP gagnées dans la journée l'EXP de séance compte moitié. `computeXp` renvoie aussi le `patch` à fusionner dans l'état (`xp`, `xpWeeks` = EXP par semaine pour le Bilan, `xpDaily`).
- **Récompenses** (`data/rewards.js`, `modals/RewardsModal.jsx`) : thèmes de couleur, accessoires de Rondoudou et titres débloqués par niveau (`gameState.cosmetics`) ; le cadre de l'avatar change avec le rang.
- **Célébrations** (`hooks/useLevelCelebration.js`, `modals/RankUpModal.jsx`) : message à chaque niveau, grande fenêtre à chaque nouveau rang. **Bilan** : `components/XpProgress.jsx` (courbe d'EXP, dates estimées).
- Trophées : bonus d'EXP divisés par deux par rapport à l'ancienne version. La fusion de synchro additionne les gains `xp` / `xpWeeks` des deux appareils et réunit `rankTrials`.

## Corriger une séance, décider contre le coach
- **Corriger** (onglet Journal, bouton « ✏️ Corriger » → `components/EntryEditor.jsx`) : `handleEditSessionEntry` (`hooks/useQuestActions.js`) reconstruit l'entrée avec `lib/history.js` (`rebuildEntry` : meilleure série, séries validées, calories, note automatique régénérée si elle n'avait pas été réécrite) puis remet l'exercice à jour (`questAfterHistoryChange` : valeur actuelle, aide, séries d'après la dernière séance, historique trié par date). Le coach se base sur l'historique, donc il repart des valeurs corrigées. L'EXP déjà gagnée n'est pas recalculée. Annulable (`registerUndo`).
- **Tu décides** (onglet Coach, sous chaque exercice) : `quest.coachOverride = { entries, load?, assist?, repsDelta? }`, posé par `adjustTarget` (`components/coach/CoachPanel.jsx`) et appliqué en fin de `computeExerciseTarget` (`change: 'manual'`, `manual`, `suggested` = proposition d'origine). Valable seulement tant que le nombre de séances de l'exercice n'a pas changé (`entries`) : dès qu'une nouvelle séance est enregistrée, le coach recalcule.

## Sauvegarde : fichier JSON dans un dépôt GitHub privé
- **Local** : `localStorage` clé `rondoudou_save_v1` (ne jamais la renommer : elle contient les données des appareils existants). **Photos souvenirs** : IndexedDB `rondoufit_photos` (`lib/photos.js`, avec un index `{id: updatedAt}` dans localStorage `rondoufit:photoIdx`), **synchronisées** avec GitHub par `sync/photoSync.js` : un fichier `photos/<id>.json` par photo (JPEG ~900 px en base64 + date, note) dans le dépôt de données ; envoi 3 s après un ajout/modification/suppression, reprise au retour sur l'app et toutes les minutes. Suppression propagée dans les deux sens ; un appareil neuf ne supprime jamais rien ; si les photos locales disparaissent d'un coup (navigateur vidé) on les retélécharge. Mémoire de synchro : `rondoufit:photoSync`. Les écritures venant de GitHub passent par `PhotoDB.put(p, { remote: true })` / `del(id, { remote: true })` (pas de renvoi). Export/import JSON toujours disponible dans l'onglet Souvenirs.
- **GitHub** (remplace Google Sheets depuis la refonte) : `sync/` + `hooks/useGithubSync.js`. L'utilisateur renseigne dans l'appli (pastille ☁️ de l'en-tête → fenêtre « Sauvegarde GitHub ») compte, dépôt privé, fichier (`rondoufit-data.json`) et un **jeton fine-grained** (Contents : lecture/écriture) gardé uniquement dans son navigateur (`rondoufit:github`). Même principe que l'appli Carnet EPS.
- **Algorithme** (`sync/engine.js`, testé dans `src/sync/sync.test.js`) : lecture du fichier → si seul GitHub a changé on le reprend ; si seul cet appareil a changé on l'envoie ; si les deux ont changé on **fusionne à 3 voies** (`sync/merge.js` : séances/pesées réunies par `id`, suppressions respectées, trophées réunis, `xp` = somme des gains, sinon la version la plus récente gagne). Envoi 2 s après une modification, reprise au retour sur l'app et toutes les minutes.
- **Sécurités (à ne jamais casser)** : on n'écrase jamais GitHub si le fichier est illisible/invalide ; un appareil neuf (jamais modifié : `rondoudou_local_ts` = 0) ne peut pas écraser une sauvegarde existante ; une modification faite pendant une synchro n'est pas perdue (compteur de version). Les changements automatiques (trophées débloqués) passent par `setGameStateAuto` : sur un appareil jamais utilisé ils ne comptent pas comme une modification.
- Marqueurs locaux : `rondoufit:sync` (sha + état commun), `rondoufit:dirty`, `rondoudou_local_ts`. Un champ `_savedAt` (ms) est écrit dans le fichier.
- **Modifier les données à la place de l'utilisateur** : cloner le dépôt de données privé, éditer `rondoufit-data.json` (mêmes champs que `gameState`, ids uniques), mettre `_savedAt` à l'heure actuelle en ms, committer et pousser. Les appareils reprennent le changement (ou le fusionnent s'ils ont aussi modifié).
- **Reprise unique de l'ancien Google Sheets** : bouton dans la fenêtre « Sauvegarde GitHub » (`legacy/googleSheets.js`). À supprimer quand tous les appareils ont migré.

## Tester
- `npm test` : `src/sync/sync.test.js` (fusion + moteur avec faux GitHub) ; `tests/ui/*.test.js` : l'appli complète tourne dans jsdom (`tests/ui/harness.js` : horloge et hasard figés, faux GitHub, « singe » qui clique au hasard). Les minuteries ≥ 200 ms sont virtuelles : `advance(h, ms)`.
- Ajouter un test d'interface : s'inspirer de `tests/ui/app.test.js`. Ajouter un cas de synchro : `tests/ui/sync.test.js` (faux GitHub) ou `src/sync/sync.test.js` (logique pure).
- Ne **jamais** lancer une ancienne version (l'ancien `index.html` de Google Sheets) dans un navigateur de test : elle écrirait dans le vrai Google Sheets.

## Pièges connus
- **localStorage partagé avec Carnet EPS** (même domaine `gab1point0.github.io`) : toujours préfixer les nouvelles clés par `rondoufit:`, ne jamais toucher aux clés `carnet-eps:`.
- **Tailwind compilé** : écrire les noms de classes en entier (`'bg-pink-500'`), jamais `` `bg-${couleur}-500` `` (la classe ne serait pas générée). Tailwind 3 (pas 4).
- Les valeurs de départ (`INITIAL_STATE`) contiennent des données de démo (séances du jour) : ne pas les prendre pour des données réelles.
- Anciens objectifs conservés si on retire un exercice du catalogue (seul le catalogue change).
- Les hooks de `hooks/` reçoivent tout ce dont ils ont besoin en paramètre (pas de contexte global) : ajouter un paramètre plutôt qu'un import croisé.
