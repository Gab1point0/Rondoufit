import { pick } from '../edition';

// Sport régulier (collectif ou non) de l'utilisateur : le coach évite les jambes lourdes la veille, garde de l'énergie le jour J,
// compte l'endurance, et propose une préparation physique adaptée. `coach.sport` = identifiant ci-dessous ('' = sport non précisé).
// Le volley est le sport par défaut de l'édition de Gabin ; l'édition « amis » démarre sans sport précisé.
//
// Les listes d'exercices de préparation sont des repères généraux de préparation physique (pratique courante), PAS des protocoles
// validés par des études : seules les mentions « volley » citent une source (voir coach/labels.js).
const VOLLEY_NOTE = 'Attention : les preuves de réduction des blessures chez les volleyeurs restent limitées.';
const GENERAL_NOTE = 'Ce sont des repères généraux de préparation physique (pratique courante), pas un protocole validé : adapte-les à tes sensations et à tes blessures éventuelles.';

export const SPORTS = [
  {
    id: 'volley', label: 'volley', cap: 'Volley', de: 'de volley', poss: 'ton volley', icon: '🏐', shoulders: true,
    title: 'épaules et gainage', note: VOLLEY_NOTE,
    intro: 'Le volley sollicite beaucoup les épaules et les jambes. Renforcer la coiffe des rotateurs, le haut du dos et le tronc est une pratique courante en prévention.',
    exercises: ['fp_ext_rotation', 'fp_face_pull', 'fp_plank'],
  },
  {
    id: 'football', label: 'football', cap: 'Football', de: 'de football', poss: 'ton football', icon: '⚽',
    title: 'ischio-jambiers, adducteurs et gainage', note: GENERAL_NOTE,
    intro: 'Le football demande des sprints, des changements de direction et des frappes : les ischio-jambiers, les adducteurs, les mollets et le tronc sont très sollicités. Les renforcer est une pratique courante en préparation physique.',
    exercises: ['fp_leg_curl_lying', 'fp_adductors', 'fp_calf_standing', 'fp_plank'],
  },
  {
    id: 'basket', label: 'basket', cap: 'Basket', de: 'de basket', poss: 'ton basket', icon: '🏀', shoulders: true,
    title: 'jambes explosives, chevilles et épaules', note: GENERAL_NOTE,
    intro: 'Le basket enchaîne sauts, réceptions et appuis : les quadriceps, les fessiers, les mollets (chevilles) et les épaules travaillent beaucoup.',
    exercises: ['fp_step_up', 'fp_calf_standing', 'fp_glute_bridge', 'fp_ext_rotation'],
  },
  {
    id: 'handball', label: 'handball', cap: 'Handball', de: 'de handball', poss: 'ton handball', icon: '🤾', shoulders: true,
    title: 'épaules, tronc et genoux', note: GENERAL_NOTE,
    intro: 'Le handball sollicite fortement l’épaule (tirs), le tronc et les genoux (appuis, changements de direction).',
    exercises: ['fp_ext_rotation', 'fp_face_pull', 'fp_plank', 'fp_leg_curl_lying'],
  },
  {
    id: 'rugby', label: 'rugby', cap: 'Rugby', de: 'de rugby', poss: 'ton rugby', icon: '🏉', shoulders: true,
    title: 'chocs, jambes et haut du dos', note: GENERAL_NOTE,
    intro: 'Le rugby cumule chocs, poussées et sprints : jambes puissantes, haut du dos, trapèzes et tronc solides sont une pratique courante de préparation.',
    exercises: ['fp_shrugs_db', 'fp_face_pull', 'fp_rdl', 'fp_plank'],
  },
  {
    id: 'tennis', label: 'tennis', cap: 'Tennis', de: 'de tennis', poss: 'ton tennis', icon: '🎾', shoulders: true,
    title: 'épaule, avant-bras et rotation du tronc', note: GENERAL_NOTE,
    intro: 'Le tennis répète des gestes asymétriques : la coiffe des rotateurs, les avant-bras et la rotation du tronc sont très sollicités.',
    exercises: ['fp_ext_rotation', 'fp_wrist_curl', 'fp_pallof', 'fp_calf_standing'],
  },
  {
    id: 'badminton', label: 'badminton', cap: 'Badminton', de: 'de badminton', poss: 'ton badminton', icon: '🏸', shoulders: true,
    title: 'épaule, fentes et mollets', note: GENERAL_NOTE,
    intro: 'Le badminton demande des fentes explosives, des appuis rapides et des gestes d’épaule répétés.',
    exercises: ['fp_ext_rotation', 'fp_walking_lunge', 'fp_calf_standing', 'fp_plank'],
  },
  {
    id: 'hockey', label: 'hockey', cap: 'Hockey', de: 'de hockey', poss: 'ton hockey', icon: '🏒',
    title: 'adducteurs, hanches et tronc', note: GENERAL_NOTE,
    intro: 'Le hockey sollicite fortement les adducteurs, les hanches et le tronc (position penchée, patinage ou courses).',
    exercises: ['fp_adductors', 'fp_abductors', 'fp_plank', 'fp_rdl'],
  },
  {
    id: 'course', label: 'course à pied', cap: 'Course à pied', de: 'de course à pied', poss: 'ta course à pied', icon: '🏃',
    title: 'mollets, ischio-jambiers et fessiers', note: GENERAL_NOTE,
    intro: 'La course répète des milliers d’appuis : mollets, ischio-jambiers, fessiers et tronc solides aident à encaisser le volume.',
    exercises: ['fp_calf_standing', 'fp_rdl', 'fp_glute_bridge', 'fp_side_plank'],
  },
  {
    id: 'cyclisme', label: 'cyclisme', cap: 'Cyclisme', de: 'de cyclisme', poss: 'ton cyclisme', icon: '🚴',
    title: 'bas du dos, tronc et haut du corps', note: GENERAL_NOTE,
    intro: 'Le vélo travaille surtout les cuisses ; le bas du dos, le tronc et le haut du corps (souvent peu sollicités) sont une bonne base de complément.',
    exercises: ['fp_back_extension', 'fp_plank', 'fp_face_pull', 'fp_rdl'],
  },
  {
    id: 'natation', label: 'natation', cap: 'Natation', de: 'de natation', poss: 'ta natation', icon: '🏊', shoulders: true,
    title: 'épaules, dos et gainage', note: GENERAL_NOTE,
    intro: 'La natation sollicite l’épaule (rotations répétées), le grand dorsal et le tronc ; la musculation à sec les complète bien.',
    exercises: ['fp_ext_rotation', 'fp_face_pull', 'fp_plank', 'fp_superman_hold'],
  },
  {
    id: 'combat', label: 'sport de combat', cap: 'Sport de combat', de: 'de sport de combat', poss: 'ton sport de combat', icon: '🥊', shoulders: true,
    title: 'rotation du tronc, épaules et cou', note: GENERAL_NOTE,
    intro: 'Boxe, arts martiaux : rotations rapides du tronc, épaules endurantes et gainage sont très sollicités.',
    exercises: ['fp_pallof', 'fp_ext_rotation', 'fp_plank', 'fp_rdl'],
  },
  {
    id: 'escalade', label: 'escalade', cap: 'Escalade', de: 'd’escalade', poss: 'ton escalade', icon: '🧗', shoulders: true,
    title: 'tirage, avant-bras et épaules', note: GENERAL_NOTE,
    intro: 'L’escalade sollicite le tirage, la prise (avant-bras) et la stabilité des épaules ; l’équilibre poussée / tirage et le gainage sont une pratique courante.',
    exercises: ['fp_dead_hang', 'fp_wrist_curl', 'fp_ext_rotation', 'fp_plank'],
  },
  {
    id: 'danse', label: 'danse', cap: 'Danse', de: 'de danse', poss: 'ta danse', icon: '💃',
    title: 'chevilles, hanches et gainage', note: GENERAL_NOTE,
    intro: 'La danse demande équilibre, mobilité des hanches, chevilles solides et gainage.',
    exercises: ['fp_calf_standing', 'fp_glute_bridge', 'fp_plank', 'fp_abductors'],
  },
  {
    id: 'autre', label: 'sport', cap: 'Sport', de: 'de sport', poss: 'ton sport', icon: '🎽',
    title: 'tronc et équilibre musculaire', note: GENERAL_NOTE,
    intro: 'Un tronc solide et un bon équilibre entre poussée et tirage servent à presque tous les sports.',
    exercises: ['fp_plank', 'fp_face_pull', 'fp_rdl'],
  },
];

const GENERIC = SPORTS.find(s => s.id === 'autre');

/** Sport par défaut d'un réglage de coach sans choix explicite : volley pour l'édition de Gabin, rien pour l'édition amis. */
export const DEFAULT_SPORT = pick('volley', '');

/** Fiche d'un sport ; réglage absent (undefined) → sport par défaut de l'édition ; '' ou inconnu → « sport » générique. */
export const sportInfo = id => SPORTS.find(s => s.id === (id === undefined ? DEFAULT_SPORT : id)) || GENERIC;
