// Sources scientifiques par sport (prévention des blessures / préparation physique), recherchées en ligne (octobre 2026).
// ✔ (ok: true) = référence retrouvée et chiffres lus dans le résumé publié ; ◐ (ok: false) = référence réelle mais auteurs, revue ou chiffre
// non confirmés (le texte complet n'était pas accessible : à vérifier avant de s'en servir ailleurs). Les études portent sur des groupes,
// souvent des jeunes ou des sportifs d'élite, pas sur toi en particulier. Chaque sport a une phrase « preuves » honnête.
const COOLS = {
  ok: true, url: 'https://pubmed.ncbi.nlm.nih.gov/26537804/',
  text: 'Cools A.M., Johansson F.R., Borms D., Maenhout A. (2015), « Prevention of shoulder injuries in overhead athletes: a science-based approach », Braz J Phys Ther 19(5):331-339.',
  use: 'Revue (pas un essai) : force des rotateurs externes, contrôle de l’omoplate et mobilité sont les facteurs de risque à travailler chez les sportifs qui lancent / frappent au-dessus de la tête.',
};

export const SPORT_EVIDENCE = {
  volley: {
    note: 'Preuves limitées : le seul essai que j’ai consulté (un programme d’épaules en échauffement) n’a pas montré de bénéfice établi sur les blessures.',
    sources: [
      { ok: true, text: 'Tooth C. et al. (2023), « Prevention of shoulder injuries in volleyball players: the usefulness and efficiency of a warm-up routine », Phys Ther Sport (d’après un compte rendu de lecture).', use: 'Un programme d’épaules en échauffement n’a pas montré de bénéfice statistiquement établi.' },
      COOLS,
    ],
  },
  football: {
    note: 'Preuves mitigées : des méta-analyses rapportent moins de blessures avec les programmes de prévention (Nordic hamstring, FIFA 11+), mais une réanalyse récente juge l’effet du Nordic non concluant.',
    sources: [
      { ok: true, url: 'https://link.springer.com/article/10.1007/s40279-016-0638-2', text: 'Al Attar W.S.A., Soomro N., Sinclair P.J., Pappas E., Sanders R.H. (2017), « Effect of injury prevention programs that include the Nordic hamstring exercise on hamstring injury rates in soccer players: a systematic review and meta-analysis », Sports Med 47(5):907-916.', use: 'Méta-analyse de 5 études : les programmes incluant le Nordic hamstring ont réduit les blessures des ischio-jambiers (risque relatif 0,49 ; IC 95 % 0,29-0,83).' },
      { ok: true, url: 'https://www.sciencedirect.com/science/article/abs/pii/S0895435621002870', text: 'Impellizzeri F.M., McCall A., van Smeden M. (2021), « Why methods matter in a meta-analysis: a reappraisal showed inconclusive injury preventive effect of Nordic hamstring exercise », J Clin Epidemiol 140:111-124.', use: 'Réanalyse critique de la méta-analyse précédente : avec d’autres choix de méthode, l’effet protecteur du Nordic hamstring n’est plus concluant. À garder en tête.' },
      { ok: false, url: 'https://www.jsams.org/article/S1440-2440(22)00360-7/fulltext', text: 'Résumé de congrès (2022), « The FIFA 11+ injury prevention program reduces the incidence of knee injury among soccer players: a systematic review and meta-analysis of randomized controlled trials », J Sci Med Sport 25(Suppl 2):S2-S3 (auteurs non confirmés).', use: 'Environ 46 % de blessures du genou en moins (risque relatif 0,54 ; IC 95 % 0,43-0,69 ; 9 647 joueurs), à condition de bien suivre le programme.' },
    ],
  },
  basket: {
    note: 'Preuves modérées pour les chevilles (entraînement d’équilibre), surtout chez les lycéens ; peu de données chez les adultes.',
    sources: [
      { ok: true, url: 'https://www.semanticscholar.org/paper/The-Effect-of-a-Balance-Training-Program-on-the-of-McGuine-Keene/40982d66def778bfbed255e94ae008cc50d2da50', text: 'McGuine T.A., Keene J.S. (2006), « The effect of a balance training program on the risk of ankle sprains in high school athletes », Am J Sports Med 34(7):1103-1111.', use: 'Essai randomisé (765 lycéens, football et basket) : moins d’entorses aiguës avec un programme d’équilibre (1,13 contre 1,87 pour 1 000 expositions).' },
      { ok: false, url: 'https://journals.sagepub.com/doi/full/10.1177/19417381241231588', text: 'Berkey R., Sunesara A., Allen L., Pontiff R., DeVries A., Fisher S.R. (2024), « Ankle injury prevention programs for youth sports: a systematic review and meta-analysis ».', use: 'Revue de programmes de prévention de la cheville chez les jeunes (détails non relus).' },
    ],
  },
  handball: {
    note: 'Preuves mitigées : un grand essai chez des joueurs d’élite est positif pour l’épaule, un essai chez des amateurs ne trouve aucun effet.',
    sources: [
      { ok: true, url: 'https://doi.org/10.1136/bjsports-2016-096226', text: 'Andersson S.H., Bahr R., Clarsen B., Myklebust G. (2017), « Preventing overuse shoulder injuries among throwing athletes: a cluster-randomised controlled trial in 660 elite handball players », Br J Sports Med 51(14):1073-1080.', use: 'Programme d’épaule de l’OSTRC (rotations, omoplate) : 28 % de problèmes d’épaule en moins (OR 0,72 ; IC 95 % 0,52-0,98) ; pas significatif pour les problèmes importants.' },
      { ok: false, url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8919472/', text: 'Essai randomisé en grappes (579 handballeurs, surtout amateurs, 2022), « Multicomponent stretching and rubber band strengthening exercises do not reduce overuse shoulder injuries » (auteurs et revue non confirmés).', use: 'Aucune baisse significative des blessures de l’épaule de lancer avec ce programme (étirements + élastique).' },
      COOLS,
    ],
  },
  rugby: {
    note: 'Preuves modérées mais fragiles : chez des lycéens, un programme d’échauffement a surtout réduit les blessures quand il était fait au moins 3 fois par semaine (analyse faite après coup).',
    sources: [
      { ok: true, url: 'https://doi.org/10.1136/bjsports-2016-097434', text: 'Hislop M.D., Stokes K.A., Williams S., McKay C.D., England M.E., Kemp S.P.T., Trewartha G. (2017), « Reducing musculoskeletal injury and concussion risk in schoolboy rugby players with a pre-activity movement control exercise programme: a cluster randomised controlled trial », Br J Sports Med 51(15):1140-1146.', use: 'Essai en grappes, 3 188 joueurs de 14 à 18 ans : effet global non significatif (blessures RR 0,85 ; commotions RR 0,71, IC 0,48-1,05) ; équipes faisant ≥ 3 séances par semaine : RR 0,28 (blessures) et 0,41 (commotions), analyse a posteriori.' },
      { ok: false, url: 'https://pubmed.ncbi.nlm.nih.gov/34558993/', text: 'Attwood et al. (2021), « Eight weeks of self-resisted neck strength training improves neck strength in age-grade rugby union players: a pilot randomized controlled trial » (revue non confirmée).', use: 'Essai pilote (28 joueurs) : +24 % de force du cou, mais il mesure la force, pas la baisse des commotions.' },
    ],
  },
  tennis: {
    note: 'Preuves indirectes : je n’ai pas trouvé d’essai de prévention propre au tennis ; les repères viennent des sports « au-dessus de la tête ».',
    sources: [COOLS],
  },
  badminton: {
    note: 'Preuves très préliminaires : un seul petit essai, chez des jeunes joueurs.',
    sources: [
      { ok: false, url: 'https://pubmed.ncbi.nlm.nih.gov/39902842/', text: 'Étude préliminaire (2025), « A prospective randomised controlled trial investigating the impact of a musculoskeletal injury prevention warm-up program for youth badminton » (PubMed 39902842 ; auteurs et revue non confirmés ici).', use: 'Essai randomisé en grappes (273 jeunes, 8 semaines) : 70 % de blessures en moins (risque relatif 0,30 ; IC 95 % 0,12-0,75), mais très peu de blessures au total donc estimation imprécise.' },
      COOLS,
    ],
  },
  hockey: {
    note: 'Preuves limitées : une seule étude, non randomisée, sur une équipe professionnelle.',
    sources: [
      { ok: true, url: 'https://pubmed.ncbi.nlm.nih.gov/12239001/', text: 'Tyler T.F., Nicholas S.J., Campbell R.J., Donellan S., McHugh M.P. (2002), « The effectiveness of a preseason exercise program to prevent adductor muscle strains in professional ice hockey players », Am J Sports Med 30(5):680-683.', use: '33 joueurs à faible force d’adducteurs, 6 semaines de renforcement : 0,71 élongation pour 1 000 expositions contre 3,2 les saisons précédentes (étude prospective, sans groupe témoin randomisé).' },
    ],
  },
  course: {
    note: 'Musculation et économie de course : preuves assez solides chez des coureurs entraînés. Prévention des blessures : résultats mitigés selon les essais.',
    sources: [
      { ok: true, url: 'https://pubmed.ncbi.nlm.nih.gov/26694507/', text: 'Balsalobre-Fernández C., Santos-Concejero J., Grivas G.V. (2016), « Effects of strength training on running economy in highly trained runners: a systematic review with meta-analysis of controlled trials », J Strength Cond Res 30(8):2361-2368.', use: 'Méta-analyse de 5 essais (93 coureurs de haut niveau) : effet important de la musculation sur l’économie de course (différence standardisée ≈ -1,4). Elle mesure la performance, pas les blessures.' },
      { ok: false, url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11127851/', text: '« Do exercise-based prevention programs reduce injury in endurance runners? A systematic review and meta-analysis » (2024 ; auteurs et chiffres non confirmés).', use: 'Revue sur la prévention des blessures chez les coureurs d’endurance : les résultats des essais sont contrastés.' },
    ],
  },
  cyclisme: {
    note: 'Aucune étude solide trouvée sur la musculation préventive chez les cyclistes : les exercices proposés sont des repères généraux. Seule piste documentée : le réglage du vélo pour le bas du dos.',
    sources: [
      { ok: false, url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12907770/', text: '« Effects of bike-fitting on lower back pain in cyclists: a systematic review » (2026 ; auteurs non confirmés).', use: 'Toutes les études incluses rapportent moins de douleurs du bas du dos après un réglage individualisé du vélo ; protocoles variés, suivi court.' },
    ],
  },
  natation: {
    note: 'Preuves préliminaires : les programmes testés améliorent l’équilibre de force des rotateurs, mais aucun essai trouvé ne montre moins de douleurs d’épaule.',
    sources: [
      { ok: true, url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11899141/', text: 'Tavares N., Vilas-Boas J.P., Castro M.A. (2025), « Effect of preventive exercise programs for swimmer’s shoulder injury on rotator cuff torque and balance in competitive swimmers: a randomized controlled trial », Healthcare 13(5):538.', use: 'Essai à 3 groupes (12 semaines, haltères ou élastiques, contre placebo) : moins de déséquilibre des rotateurs et pas de perte de force, alors que le groupe témoin en perd. Mesure la force, pas les blessures.' },
      COOLS,
    ],
  },
  combat: {
    note: 'Preuves indirectes : la musculation améliore la force, la puissance et l’équilibre des sportifs de combat, mais je n’ai pas trouvé d’étude montrant moins de blessures.',
    sources: [
      { ok: false, url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9961120/', text: 'Cid-Calfucura I., Herrera-Valenzuela T. et al. (2023), « Effects of strength training on physical fitness of Olympic combat sports athletes: a systematic review », Int J Environ Res Public Health 20(4):3516 (ordre des auteurs à vérifier).', use: 'Revue de 20 études (504 participants) : la musculation améliore la force maximale, la puissance, la souplesse et l’équilibre. Elle ne mesure pas les blessures.' },
    ],
  },
  escalade: {
    note: 'Preuves limitées : un seul essai (force et exercices excentriques, 3 à 4 fois par semaine pendant un an) a réduit les blessures d’épaule et de coude.',
    sources: [
      { ok: true, url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10756908/', text: 'Quarmby A., Zhang M., Geisler M., Javorsky T., Mugele H., Cassel M., Lawley J. (2023), « Risk factors and injury prevention strategies for overuse injuries in adult climbers: a systematic review », Front Sports Act Living.', use: 'Revue de 34 études : la seule piste de prévention solide vient d’un essai de force / excentrique (épaule, coude) ; échauffement, étirements et strapping ne sont pas liés au risque ; intensité élevée, bloc et manque de force des doigts = plus de risque.' },
    ],
  },
  danse: {
    note: 'Preuves préliminaires : un petit essai dans une compagnie de ballet professionnelle (39 danseurs) rapporte beaucoup moins de blessures, à confirmer.',
    sources: [
      { ok: true, url: 'https://journals.sagepub.com/doi/full/10.1177/2325967120937643', text: 'Vera A.M., Barrera B.D., Peterson L.E., Yetter T.R., Dong D., Delgado D.A., McCulloch P.C., Varner K.E., Harris J.D. (2020), « An injury prevention program for professional ballet: a randomized controlled investigation », Orthop J Sports Med 8(7).', use: '39 danseurs, 30 minutes d’exercices 3 fois par semaine pendant 52 semaines : environ 82 % de blessures en moins (rapport de risque 0,18) ; une seule compagnie, petit effectif.' },
    ],
  },
  autre: {
    note: 'Pas de source propre à ton sport : ce sont des repères généraux de préparation physique (pratique courante).',
    sources: [],
  },
};
