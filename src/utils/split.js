/**
 * Découpe un élément en mots / lettres (spans) pour les animations.
 * Les spans sont aria-hidden ; le texte complet reste accessible via aria-label.
 */
function wrap(el, perChar) {
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  if (!el.hasAttribute('aria-label') && !el.closest('[aria-label]')) el.setAttribute('aria-label', text);
  el.textContent = '';
  const items = [];
  text.split(' ').forEach((word, wi, arr) => {
    const w = document.createElement('span');
    w.className = perChar ? 'word' : 'w';
    w.setAttribute('aria-hidden', 'true');
    if (perChar) {
      w.style.display = 'inline-block';
      w.style.whiteSpace = 'nowrap';
      [...word].forEach((c) => {
        const ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = c;
        w.appendChild(ch);
        items.push(ch);
      });
    } else {
      w.textContent = word;
      items.push(w);
    }
    el.appendChild(w);
    if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return items;
}

export const splitChars = (el) => wrap(el, true);
export const splitWords = (el) => wrap(el, false);
