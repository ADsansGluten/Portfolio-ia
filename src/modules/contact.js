import { LINKS } from '../data/content.js';

/** Formulaire (Formspree) + vérification de la présence des PDF. */
export function initContact() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) {
      status.textContent = 'Merci de remplir les trois champs avec un email valide.';
      return;
    }
    // Pas d'endpoint configuré → on ouvre le client mail (aucune donnée perdue)
    if (!LINKS.formEndpoint) {
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      location.href = `mailto:${LINKS.email}?subject=${encodeURIComponent('Contact via portfolio — ' + name)}&body=${body}`;
      status.textContent = 'Formulaire non branché : ouverture de ton client mail.';
      return;
    }
    status.textContent = 'Envoi…';
    try {
      const r = await fetch(LINKS.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error();
      form.reset();
      status.textContent = 'Message envoyé. Merci !';
    } catch {
      status.textContent = `Échec de l'envoi. Écris-moi directement : ${LINKS.email}`;
    }
  });

  // PDF (CV) : s'ils sont absents, on masque ou désactive proprement le lien
  if (location.protocol === 'file:') return; // en ouverture locale, fetch() est bloqué : on laisse le lien tel quel
  document.querySelectorAll('[data-asset]').forEach((a) => {
    fetch(a.getAttribute('href'), { method: 'HEAD' }).then((r) => {
      if (!r.ok || !(r.headers.get('content-type') || '').includes('pdf')) throw new Error();
    }).catch(() => {
      if (a.hasAttribute('data-asset-hide')) { (a.closest('li') || a).hidden = true; return; }
      a.removeAttribute('href'); a.removeAttribute('download');
      a.textContent = 'PDF bientôt disponible';
      a.setAttribute('aria-disabled', 'true');
      a.style.opacity = 0.5;
    });
  });
}
