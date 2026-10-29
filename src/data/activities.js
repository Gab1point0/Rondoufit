// Activités annexes : sports collectifs, sports de raquette, plein air et cardio.
// Chaque activité a un « mode » (par défaut son identifiant) qui donne sa dépense : MET brut à intensité modérée, issu du
// Compendium des activités physiques (Ainsworth 2011), ajusté ensuite par le ressenti (RPE) dans lib/calories.js.
//   unité : 'min' (durée seule) ou 'km' (distance + durée) ; le dénivelé n'existe que pour la course et la marche (lib/calories.js).
// [id, nom, groupe, unité, MET, icône, durée habituelle (min), départ, objectif, mode?]

export const ACTIVITY_GROUPS = ['Course & marche', 'Cardio salle & cours', 'Sports collectifs', 'Sports de raquette', 'Plein air', 'Eau & glisse'];

const T = 'Sports collectifs';
const R = 'Sports de raquette';
const O = 'Plein air';
const W = 'Eau & glisse';
const C = 'Cardio salle & cours';

const ROWS = [
  // ---- Sports collectifs ----
  ['fp_football', 'Football', T, 'min', 7.0, '⚽', 90, 60, 120],
  ['fp_futsal', 'Futsal / Foot en salle', T, 'min', 7.0, '🥅', 60, 45, 90],
  ['fp_beach_soccer', 'Beach soccer / Footvolley', T, 'min', 8.0, '🏖️', 45, 30, 90],
  ['fp_basket', 'Basket-ball', T, 'min', 7.5, '🏀', 60, 45, 90],
  ['fp_basket3x3', 'Basket 3x3 / Streetball', T, 'min', 7.5, '🏀', 45, 30, 75],
  ['fp_handball', 'Handball', T, 'min', 8.0, '🤾', 60, 45, 90],
  ['fp_rugby15', 'Rugby à XV', T, 'min', 8.3, '🏉', 80, 60, 100],
  ['fp_rugby7', 'Rugby à 7 / Rugby à toucher', T, 'min', 7.0, '🏉', 40, 30, 70],
  ['fp_beach_volley', 'Beach-volley', T, 'min', 6.0, '🏐', 60, 45, 90],
  ['fp_waterpolo', 'Water-polo', T, 'min', 10.0, '🤽', 45, 30, 75],
  ['fp_field_hockey', 'Hockey sur gazon', T, 'min', 7.8, '🏑', 70, 50, 90],
  ['fp_ice_hockey', 'Hockey sur glace', T, 'min', 8.0, '🏒', 60, 45, 90],
  ['fp_roller_hockey', 'Roller hockey', T, 'min', 7.3, '🏒', 60, 45, 90],
  ['fp_floorball', 'Floorball / Unihockey', T, 'min', 7.5, '🏑', 60, 45, 90],
  ['fp_baseball', 'Baseball / Softball', T, 'min', 5.0, '⚾', 90, 60, 120],
  ['fp_cricket', 'Cricket', T, 'min', 4.6, '🏏', 120, 90, 180],
  ['fp_american_football', 'Football américain / Flag', T, 'min', 8.0, '🏈', 60, 45, 90],
  ['fp_ultimate', 'Ultimate (frisbee)', T, 'min', 8.0, '🥏', 60, 45, 90],
  ['fp_netball', 'Netball', T, 'min', 6.8, '🥅', 60, 45, 90],
  ['fp_lacrosse', 'Lacrosse', T, 'min', 8.0, '🥍', 60, 45, 90],
  ['fp_dodgeball', 'Balle au prisonnier / Dodgeball', T, 'min', 5.0, '🔴', 45, 30, 60],
  ['fp_tchoukball', 'Tchoukball', T, 'min', 6.0, '🤾', 45, 30, 60],
  ['fp_kinball', 'Kin-ball', T, 'min', 4.5, '🔵', 45, 30, 60],
  ['fp_korfball', 'Korfball', T, 'min', 6.5, '🧺', 60, 45, 90],
  ['fp_gaelic', 'Football gaélique / Hurling', T, 'min', 8.0, '🍀', 60, 45, 90],
  ['fp_pelote', 'Pelote basque / Jeu de paume', T, 'min', 6.0, '🎾', 45, 30, 75],
  ['fp_petanque', 'Pétanque / Boules', T, 'min', 3.0, '🎯', 90, 60, 150],
  // ---- Sports de raquette ----
  ['fp_tennis', 'Tennis', R, 'min', 7.3, '🎾', 60, 45, 120],
  ['fp_badminton', 'Badminton', R, 'min', 5.5, '🏸', 60, 45, 90],
  ['fp_squash', 'Squash', R, 'min', 7.3, '🟡', 45, 30, 75],
  ['fp_padel', 'Padel', R, 'min', 6.0, '🎾', 60, 45, 90],
  ['fp_tabletennis', 'Tennis de table', R, 'min', 4.0, '🏓', 45, 30, 90],
  ['fp_pickleball', 'Pickleball', R, 'min', 4.8, '🏓', 60, 45, 90],
  // ---- Course nature et marche (avec dénivelé) ----
  ['fp_hiking', 'Randonnée', O, 'km', 6.0, '🥾', 180, 8, 25, 'hike'],
  ['fp_trail', 'Trail / Course nature', O, 'km', 9.0, '⛰️', 90, 8, 30, 'trail'],
  ['fp_nordic', 'Marche nordique', O, 'km', 6.8, '🥢', 60, 5, 15, 'nordic'],
  ['fp_orienteering', 'Course d’orientation', O, 'km', 9.0, '🧭', 60, 4, 12, 'trail'],
  // ---- Vélo ----
  ['fp_road_bike', 'Vélo de route', O, 'km', 8.0, '🚴', 90, 20, 100],
  ['fp_mtb', 'VTT', O, 'km', 8.5, '🚵', 90, 15, 60],
  ['fp_city_bike', 'Vélo de ville / trajet quotidien', O, 'km', 6.0, '🚲', 30, 5, 20],
  ['fp_ebike', 'Vélo à assistance électrique', O, 'km', 4.5, '🔋', 60, 15, 60],
  // ---- Montagne et nature ----
  ['fp_climbing', 'Escalade (bloc / voie)', O, 'min', 7.5, '🧗', 90, 60, 150],
  ['fp_via_ferrata', 'Via ferrata', O, 'min', 7.0, '🪢', 180, 120, 300],
  ['fp_mountaineering', 'Alpinisme / Randonnée glaciaire', O, 'min', 8.0, '🏔️', 300, 180, 480],
  ['fp_horse', 'Équitation', O, 'min', 5.5, '🐎', 60, 45, 120],
  ['fp_golf', 'Golf (à pied)', O, 'min', 4.8, '⛳', 240, 180, 300],
  ['fp_parkour', 'Parkour / Course d’obstacles', O, 'min', 8.0, '🤸', 60, 45, 90],
  // ---- Neige et glace ----
  ['fp_ski_alpine', 'Ski alpin', O, 'min', 5.3, '⛷️', 240, 180, 360],
  ['fp_ski_xc', 'Ski de fond', O, 'km', 9.0, '🎿', 90, 10, 40],
  ['fp_snowboard', 'Snowboard', O, 'min', 5.3, '🏂', 240, 180, 360],
  ['fp_snowshoe', 'Raquettes à neige', O, 'km', 8.0, '❄️', 120, 5, 15],
  ['fp_ice_skating', 'Patinage sur glace', W, 'min', 7.0, '⛸️', 60, 45, 90],
  // ---- Eau et glisse ----
  ['fp_swim', 'Natation (piscine)', W, 'km', 6.8, '🏊', 45, 1, 4],
  ['fp_open_water', 'Nage en eau libre', W, 'km', 8.0, '🌊', 60, 1, 5],
  ['fp_aquagym', 'Aquagym', W, 'min', 5.5, '💦', 45, 30, 60],
  ['fp_aquabike', 'Aquabike', W, 'min', 6.8, '🚲', 45, 30, 60],
  ['fp_aquajogging', 'Aquajogging', W, 'min', 6.0, '🏊', 45, 30, 60],
  ['fp_kayak', 'Kayak / Canoë', W, 'km', 5.0, '🛶', 90, 5, 25],
  ['fp_rowing_out', 'Aviron (extérieur)', W, 'km', 7.0, '🚣', 60, 6, 20],
  ['fp_sup', 'Paddle (stand-up paddle)', W, 'km', 6.0, '🏄', 60, 4, 15],
  ['fp_surf', 'Surf / Bodyboard', W, 'min', 3.0, '🏄', 120, 60, 180],
  ['fp_windsurf', 'Planche à voile / Kitesurf', W, 'min', 5.0, '🪁', 120, 60, 180],
  ['fp_sailing', 'Voile', W, 'min', 3.0, '⛵', 180, 120, 300],
  ['fp_snorkeling', 'Snorkeling / Plongée libre', W, 'min', 5.0, '🤿', 60, 30, 90],
  ['fp_roller', 'Roller / Patins à roulettes', W, 'km', 7.5, '🛼', 60, 8, 30],
  ['fp_skateboard', 'Skateboard', W, 'min', 5.0, '🛹', 60, 30, 120],
  ['fp_scooter', 'Trottinette', W, 'km', 5.0, '🛴', 30, 5, 20],
  // ---- Cardio en salle et cours collectifs ----
  ['fp_spinning', 'Cycle indoor / RPM / Spinning', C, 'min', 8.5, '🚴', 45, 30, 60],
  ['fp_step', 'Step (cours collectif)', C, 'min', 7.0, '🪜', 45, 30, 60],
  ['fp_zumba', 'Zumba / Danse fitness', C, 'min', 6.5, '💃', 45, 30, 60],
  ['fp_aerobic', 'Aérobic / Body Attack', C, 'min', 7.3, '🤸', 45, 30, 60],
  ['fp_dance', 'Danse (salsa, rock, danse de salon)', C, 'min', 4.8, '🕺', 60, 45, 120],
  ['fp_cardio_boxing', 'Cardio-boxing / Body Combat', C, 'min', 7.8, '🥊', 45, 30, 60],
  ['fp_circuit', 'Circuit training', C, 'min', 8.0, '🔁', 45, 30, 60],
  ['fp_battle_ropes', 'Battle ropes (cordes ondulatoires)', C, 'min', 8.0, '🪢', 15, 10, 30],
  ['fp_sled', 'Traîneau (sled push / pull)', C, 'min', 8.0, '🛷', 15, 10, 30],
  ['fp_trampoline', 'Trampoline / Rebounding', C, 'min', 4.5, '🤾', 30, 20, 45],
];

export const ACTIVITIES = ROWS.map(r => ({
  id: r[0], name: r[1], group: r[2], unit: r[3], met: r[4], icon: r[5], dur: r[6], start: r[7], goal: r[8], mode: r[9] || r[0],
}));

/** MET brut par mode (utilisé par calculateCardioCalories pour tout ce qui n'est pas course / marche). */
export const ACTIVITY_MET = Object.fromEntries(ACTIVITIES.filter(a => !['hike', 'trail', 'nordic'].includes(a.mode)).map(a => [a.mode, a.met]));

/** Groupe de chaque activité qui existait déjà avant la liste complète. */
export const LEGACY_GROUP = {
  running_endurance: 'Course & marche', running_interval: 'Course & marche', brisk_walk: 'Course & marche', incline_walk: 'Course & marche', fp_treadmill: 'Course & marche',
  fp_bike: C, fp_assault_bike: C, fp_elliptical: C, fp_rower: C, fp_stairs: C, fp_skierg: C, fp_jumprope: C, fp_hiit: C, fp_boxing: C, fp_group_class: C, fp_recumbent: C, fp_climbmill: C,
  volleyball: T,
};
