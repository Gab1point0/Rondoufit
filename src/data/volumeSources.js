// Sources des repères de séries du coach (mode optimisé). Recherche faite le 29/10/2026 ; résumés d'après les résumés des articles et des sites
// de vulgarisation, pas d'après les textes complets : à relire avant de citer un chiffre précis.
// Règle de transparence : les muscles pour lesquels on n'a pas trouvé d'étude directe (mollets, avant-bras, abdos, lombaires, hanches, obliques)
// sont marqués « estimation » et leurs repères sont prudents.

export const VOLUME_SOURCES = [
  { id: 'iversen2021', short: 'Iversen 2021', text: 'Environ 4 séries par semaine et par muscle suffisent pour un gain de muscle détectable (dose minimale efficace).' },
  { id: 'schoenfeld2017', short: 'Schoenfeld 2017', text: 'Méta-analyse : plus de séries par semaine = plus de muscle, avec un effet clair jusqu’à 10 séries (peu de données au-delà).' },
  { id: 'bazvalle2022', short: 'Baz-Valle 2022', text: 'Chez des pratiquants entraînés : 12 à 20 séries par muscle et par semaine ; au-delà de 20, un avantage seulement pour les triceps.' },
  { id: 'pelland2024', short: 'Pelland 2024 (prépublication)', text: 'Les gains augmentent avec le volume mais avec un rendement décroissant, beaucoup plus marqué pour la force que pour le muscle. Les séries « indirectes » (le triceps au développé couché) comptent pour environ une demi-série.' },
  { id: 'schoenfeld2016', short: 'Schoenfeld 2016', text: 'Travailler un muscle 2 fois par semaine donne plus de muscle qu’une seule fois, à volume égal ; 3 fois n’est pas démontré meilleur. Une revue de 2019 trouve peu de différence quand le volume total est le même.' },
  { id: 'recup', short: 'Récupération (Morán-Navarro 2017)', text: 'La récupération dépend surtout de la proximité de l’échec et du volume, pas d’une règle fixe par taille de muscle : on garde donc un repère prudent d’environ 48 h avant de retravailler le même muscle.' },
  { id: 'hq', short: 'Rapport ischios/quadriceps (revues 2023)', text: 'Le rapport de force ischios/quadriceps prédit mal les blessures ; en revanche renforcer les ischios (ex. Nordic) réduit les blessures des ischios chez les sportifs. Le coach le signale donc comme un conseil, pas comme un seuil de danger.' },
  { id: 'rp', short: 'Repères Renaissance Periodization (non académique)', text: 'Biceps ≈ 6 à 20, triceps ≈ 6 à 18, mollets ≈ 8 à 20 séries par semaine (valeurs relayées par des sites tiers, à prendre comme point de départ).' },
];

export const EVIDENCE_LABEL = { forte: 'preuves solides', moyenne: 'preuves limitées', estimation: 'estimation prudente' };
