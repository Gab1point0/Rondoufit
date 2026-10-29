// « Voir le mouvement » : animation, trajet, conseils, depuis les exercices, le Coach, la séance guidée et Noter séance.
import { afterEach, describe, expect, it } from 'vitest';
import { advance, clickEl, clickText, findByText, launch, pageText } from './harness';

const open = [];
afterEach(() => { while (open.length) open.pop().close(); });
const TIMEOUT = 120000;
const start = async () => { const h = await launch(); open.push(h); return h; };
const dialog = h => h.doc.querySelector('[role="dialog"][aria-label="Voir le mouvement"]');
const boutons = h => [...h.doc.querySelectorAll('button[aria-label="Voir le mouvement"]')];

describe('voir le mouvement', () => {
  it('depuis une carte d’exercice : animation, trajet, conseils', async () => {
    const h = await start();
    await clickEl(h, boutons(h)[0]);
    const d = dialog(h);
    expect(d).toBeTruthy();
    expect(d.querySelector('svg')).toBeTruthy();
    expect(d.querySelector('polyline[stroke-dasharray]')).toBeTruthy(); // trajet moteur en pointillés
    for (const t of ['Muscles travaillés', 'Installation et matériel', 'Le mouvement', 'Erreurs à éviter', 'Respiration et rythme']) expect(d.textContent, t).toContain(t);
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('l’animation avance, se met en pause et se règle avec la barre', async () => {
    const h = await start();
    await clickEl(h, boutons(h)[0]);
    const svgBefore = dialog(h).querySelector('svg').innerHTML;
    await advance(h, 1500);
    await new Promise(r => setTimeout(r, 120));
    const svgAfter = dialog(h).querySelector('svg').innerHTML;
    expect(svgAfter).not.toBe(svgBefore); // l'image a changé
    await clickText(h, 'Pause');
    expect(pageText(h)).toContain('Lecture');
    const slider = dialog(h).querySelector('input[type=range]');
    slider.value = '100';
    slider.dispatchEvent(new h.w.Event('input', { bubbles: true }));
    slider.dispatchEvent(new h.w.Event('change', { bubbles: true }));
    await advance(h);
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('plusieurs angles de vue : profil, face ou dos selon l’exercice', async () => {
    const h = await start();
    h.w.dispatchEvent(new h.w.CustomEvent('rondoufit-movement', { detail: { catalogId: 'pullups' } }));
    await advance(h);
    const groupe = dialog(h).querySelector('[role="group"][aria-label="Angle de vue"]');
    expect(groupe.textContent).toContain('Vue de profil');
    expect(groupe.textContent).toContain('Vue de dos');
    const avant = dialog(h).querySelector('svg').innerHTML;
    await clickEl(h, [...groupe.querySelectorAll('button')].find(b => b.textContent.includes('Vue de dos')));
    expect(dialog(h).querySelector('svg').innerHTML).not.toBe(avant);
    expect(dialog(h).querySelector('[aria-pressed="true"]').textContent).toContain('Vue de dos');
    // un exercice sans autre angle n'affiche pas le sélecteur
    h.w.dispatchEvent(new h.w.CustomEvent('rondoufit-movement', { detail: { catalogId: 'fp_plank' } }));
    await advance(h);
    expect(dialog(h).querySelector('[aria-label="Angle de vue"]')).toBeNull();
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('exercice personnalisé reconnu par son nom, sinon choix dans la liste', async () => {
    const h = await start();
    h.w.dispatchEvent(new h.w.CustomEvent('rondoufit-movement', { detail: { name: 'Squat gobelet maison' } }));
    await advance(h);
    expect(dialog(h).textContent).toContain('Squat');
    h.w.dispatchEvent(new h.w.CustomEvent('rondoufit-movement', { detail: { name: 'Danse du robot' } }));
    await advance(h);
    expect(dialog(h).textContent).toContain('pas d’animation');
    const select = dialog(h).querySelector('select');
    expect(select.options.length).toBeGreaterThan(100);
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('disponible dans Noter séance, le Coach et la séance guidée', async () => {
    const h = await start();
    await clickText(h, 'Noter Séance');
    expect(boutons(h).length).toBeGreaterThan(0);
    await clickText(h, 'Annuler').catch(() => {});
    const h2 = await start();
    await clickText(h2, '🧠 Coach');
    expect(boutons(h2).length).toBeGreaterThan(0);
    const [lancer] = [...findByText(h2, 'Lancer la séance guidée'), ...findByText(h2, 'Lancer cette séance guidée maintenant')];
    await clickText(h2, lancer.textContent.trim().slice(0, 30));
    expect(boutons(h2).length).toBeGreaterThan(0);
    await clickEl(h2, boutons(h2)[boutons(h2).length - 1]);
    expect(dialog(h2)).toBeTruthy();
    expect(h2.errors).toEqual([]);
  }, TIMEOUT);

  it('rythme, respiration, fantôme de la position visée et erreur fréquente', async () => {
    const h = await start();
    h.w.dispatchEvent(new h.w.CustomEvent('rondoufit-movement', { detail: { catalogId: 'squat' } }));
    await advance(h, 300);
    const d = dialog(h);
    expect(d.querySelector('[data-testid="breath"]').textContent).toMatch(/Expire|Inspire/);
    expect(d.querySelectorAll('svg[aria-hidden="true"]').length).toBe(1); // fantôme
    const groupe = d.querySelector('[role="group"][aria-label="Erreur fréquente"]');
    expect(groupe).toBeTruthy();
    await clickEl(h, [...groupe.querySelectorAll('button')].find(b => b.textContent.includes('Amplitude trop courte')));
    expect(dialog(h).querySelector('[data-testid="mistake-text"]').textContent).toContain('fantôme');
    await clickEl(h, [...groupe.querySelectorAll('button')].find(b => b.textContent.includes('Bonne exécution')));
    expect(dialog(h).querySelector('[data-testid="mistake-text"]')).toBeNull();
    expect(h.errors).toEqual([]);
  }, TIMEOUT);
});
