// Suivi des muscles : mode simplifié (5 grands groupes) / optimisé (14 muscles), dans les options et dans l'assistant d'accueil.
import { afterEach, describe, expect, it } from 'vitest';
import { DEMO_STATE } from './demo';
import { advance, clickEl, clickText, launch, pageText, setInput } from './harness';

const open = [];
afterEach(() => { while (open.length) open.pop().close(); });
const TIMEOUT = 120000;
const NEUTRAL = { __classic: '1' };
const saved = h => JSON.parse(h.w.localStorage.getItem('rondoudou_save_v1'));
const byTest = (h, id) => h.doc.querySelector(`[data-testid="${id}"]`);
const next = async h => clickEl(h, byTest(h, 'ob-next'));
const fill = async (h, id, v) => setInput(h, h.doc.getElementById(id), v);

describe('suivi des muscles : deux modes', () => {
  it('dans les options : bascule simplifié ⇄ optimisé, les filtres d’exercices suivent', async () => {
    const h = await launch({ storage: { ...NEUTRAL, rondoudou_save_v1: JSON.stringify({ ...DEMO_STATE, onboarded: true }) } });
    open.push(h);
    await advance(h, 300);
    await clickText(h, 'Exercices');
    await advance(h, 300);
    expect(pageText(h)).not.toContain('Triceps');
    const more = h.doc.querySelector('button[aria-label="Réglages et données"]');
    await clickEl(h, more);
    expect(byTest(h, 'toggle-muscle-mode').textContent).toContain('simplifié');
    await clickEl(h, byTest(h, 'toggle-muscle-mode'));
    await advance(h, 400);
    expect(saved(h).muscleMode).toBe('optimized');
    expect(byTest(h, 'toggle-muscle-mode').textContent).toContain('optimisé');
    // on referme le menu : les filtres de l'onglet sont maintenant les muscles précis
    const close = h.doc.querySelector('button[aria-label="Fermer"]');
    if (close) await clickEl(h, close);
    await advance(h, 300);
    const t = pageText(h);
    for (const m of ['Biceps', 'Triceps', 'Quadriceps']) expect(t, m).toContain(m);
    // retour au mode simple
    await clickEl(h, h.doc.querySelector('button[aria-label="Réglages et données"]'));
    await clickEl(h, byTest(h, 'toggle-muscle-mode'));
    await advance(h, 400);
    expect(saved(h).muscleMode).toBe('simple');
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('dans l’assistant d’accueil : choix du mode, enregistré sur le compte', async () => {
    const h = await launch({ empty: true, storage: NEUTRAL });
    open.push(h);
    await advance(h, 300);
    await fill(h, 'ob-name', 'Léa');
    await next(h);
    await fill(h, 'ob-age', '28'); await fill(h, 'ob-h', '168'); await fill(h, 'ob-w', '64'); await fill(h, 'ob-t', '60');
    await next(h);
    expect(byTest(h, 'muscle-mode-choice')).toBeTruthy();
    await clickEl(h, byTest(h, 'goal-force'));
    await clickEl(h, byTest(h, 'mode-optimized'));
    await next(h);
    await next(h);
    await clickEl(h, byTest(h, 'ex-barbell_curl'));
    await clickEl(h, byTest(h, 'ex-squat'));
    await next(h);
    await next(h); // sport : aucun
    await next(h); // sauvegarde : plus tard
    await clickEl(h, byTest(h, 'ob-finish'));
    await advance(h, 400);
    const s = saved(h);
    expect(s.muscleMode).toBe('optimized');
    expect(s.quests.length).toBe(2);
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('par défaut, l’assistant garde le mode simplifié', async () => {
    const h = await launch({ empty: true, storage: NEUTRAL });
    open.push(h);
    await advance(h, 300);
    await fill(h, 'ob-name', 'Max');
    await next(h);
    await fill(h, 'ob-w', '75');
    for (let i = 0; i < 8 && !byTest(h, 'ob-finish'); i++) await next(h);
    await clickEl(h, byTest(h, 'ob-finish'));
    await advance(h, 400);
    expect(saved(h).muscleMode).toBe('simple');
  }, TIMEOUT);
});
