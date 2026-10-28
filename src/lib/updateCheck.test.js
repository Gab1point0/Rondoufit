import { describe, expect, it } from 'vitest';
import { appScriptName } from './updateCheck';

describe('détection de mise à jour', () => {
  it('lit le nom du fichier d’application dans la page', () => {
    expect(appScriptName('<script type="module" crossorigin src="./assets/index-BibgGFjH.js"></script>')).toBe('index-BibgGFjH.js');
    expect(appScriptName('<script src="/src/main.jsx"></script>')).toBe('');
    expect(appScriptName('')).toBe('');
  });
});
