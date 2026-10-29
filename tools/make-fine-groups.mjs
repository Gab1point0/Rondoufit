// Génère src/data/fineGroups.generated.js : muscle précis (mode « optimisé ») de chaque exercice de musculation du catalogue,
// d'après le premier muscle cité dans sa fiche de mouvement (src/anim/info.js). À relancer si on ajoute un exercice ou change une fiche :
//   npx vite-node tools/make-fine-groups.mjs
import fs from 'node:fs';
import { EXERCISE_CATALOG } from '../src/data/catalog.js';
import { FAMILIES, INFO_FAMILY } from '../src/anim/info.js';
import { fineFromText } from '../src/data/fineRules.js';

// Exceptions : le premier muscle cité n'est pas celui qu'on veut suivre
export const OVERRIDES = { chinUp: 'Dos', deadHang: 'Dos', deadlift: 'Fessiers' };

// 2e muscle : uniquement les mouvements qui sollicitent vraiment DEUX muscles de façon marquée (ex. hip thrust : fessiers ET ischio-jambiers).
// Les muscles seulement « d'appoint » (triceps au développé couché…) ne comptent pas. Compté comme une série pour chacun des deux.
export const SECOND = {
  hipThrust: 'Ischio-jambiers', hipThrustMachine: 'Ischio-jambiers', gluteBridge: 'Ischio-jambiers',
  squat: 'Fessiers', squatSmith: 'Fessiers', squatFront: 'Fessiers', goblet: 'Fessiers', bulgarian: 'Fessiers', hackSquat: 'Fessiers', legPress: 'Fessiers',
  lunge: 'Fessiers', stepUp: 'Fessiers', beltSquat: 'Fessiers', trapBar: 'Fessiers', wallSit: 'Fessiers',
  deadlift: 'Ischio-jambiers', deadliftMachine: 'Ischio-jambiers', deadliftSumo: 'Quadriceps', rdl: 'Fessiers', goodMorning: 'Lombaires', backExtension: 'Fessiers', superman: 'Fessiers',
  pullUp: 'Biceps', chinUp: 'Biceps', pulldown: 'Biceps', pulldownMachine: 'Biceps', assistedPullUp: 'Biceps', barbellRow: 'Biceps', seatedRow: 'Biceps', rowMachine: 'Biceps', tBarRow: 'Biceps', dbRow: 'Biceps', invertedRow: 'Biceps',
  dips: 'Pectoraux', dipMachine: 'Pectoraux', assistedDip: 'Pectoraux', benchClose: 'Pectoraux', pushUpDiamond: 'Pectoraux',
  curl: 'Avant-bras', curlHammer: 'Avant-bras', curlIncline: 'Avant-bras', deadHang: 'Avant-bras',
  woodchop: 'Abdominaux', pallof: 'Abdominaux', abMachineOblique: 'Abdominaux',
};

const out = {};
const out2 = {};
for (const c of EXERCISE_CATALOG.filter(x => x.type === 'strength')) {
  const fam = INFO_FAMILY[c.id];
  if (!fam) continue;
  const g = OVERRIDES[fam] || fineFromText(FAMILIES[fam].m);
  if (g) out[c.id] = g;
  if (g && SECOND[fam] && SECOND[fam] !== g) out2[c.id] = SECOND[fam];
}
const NL = String.fromCharCode(10);
const dump = o => Object.keys(o).sort().map(k => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(o[k]) + ',').join(NL);
const text = ['// FICHIER GÉNÉRÉ par tools/make-fine-groups.mjs : ne pas modifier à la main.', 'export const FINE_BY_CATALOG_ID = {', dump(out), '};',
  '// 2e muscle (exercices qui en travaillent deux de façon marquée)', 'export const FINE_SECOND_BY_CATALOG_ID = {', dump(out2), '};', ''].join(NL);
fs.writeFileSync(new URL('../src/data/fineGroups.generated.js', import.meta.url), text);
console.log(Object.keys(out).length + " exercices cartographiés, " + Object.keys(out2).length + " avec 2e muscle");
