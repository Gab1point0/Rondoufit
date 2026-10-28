import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CrashScreen } from '../../src/components/ErrorBoundary';

describe('écran de secours', () => {
  it('propose de recharger et d’exporter les données', () => {
    const html = renderToStaticMarkup(CrashScreen({ message: 'boom' }));
    expect(html).toContain('Oups, un écran a planté');
    expect(html).toContain('Recharger');
    expect(html).toContain('Exporter mes données');
    expect(html).toContain('boom');
  });
});
