import { useEffect, useState } from 'react';

// Charge au poids du corps : un seul nombre. Négatif = aide élastique (−10 = 10 kg d'aide), 0 = poids du corps seul.
// `assist` = aide en kg (positive) ; `onAssist` reçoit l'aide en kg. Une valeur positive (lest) est ramenée à 0 : pour du lest, on choisit « Charge en kg ».
const show = assist => (Number(assist) > 0 ? String(-Number(assist)) : '0');

export function SignedKgInput({ assist, onAssist, className, testId }) {
  const [text, setText] = useState(show(assist));
  useEffect(() => {
    // l'extérieur a changé (nouvel exercice, changement de mesure…) : on réaffiche, sauf pendant la frappe d'un nombre équivalent
    setText(prev => (Number(prev.replace(',', '.')) === -(Number(assist) || 0) || (prev === '-' && !Number(assist)) ? prev : show(assist)));
  }, [assist]);
  return (
    <input
      type="text"
      inputMode="decimal"
      data-testid={testId}
      value={text}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9.,-]/g, '');
        setText(raw);
        const n = Number(raw.replace(',', '.'));
        if (raw === '' || raw === '-' || Number.isNaN(n)) return;
        onAssist(n >= 0 ? 0 : Math.round(-n * 2) / 2);
      }}
      onBlur={() => setText(show(assist))}
      className={className}
    />
  );
}
