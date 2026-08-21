/* The summit register: a guestbook backed by a Supabase table.
 * The key below is the publishable (anon) key; row-level security on the
 * table only lets it insert entries and read un-hidden ones. To hide a spam
 * entry, set hidden = true on that row in the Supabase dashboard.
 */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://cxbfuzqjlqipjyinhzqv.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_O4wTaAcq7R9QuMoqI8KOUg_qkhQw3lf';
  const REST = SUPABASE_URL + '/rest/v1/kili_guestbook';
  const HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
  };

  const form   = document.getElementById('regForm');
  const list   = document.getElementById('regList');
  const status = document.getElementById('regStatus');
  if (!form || !list) return;

  const fmtSigned = iso => new Date(iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  /* Entries are rendered with textContent only, so nothing a visitor types
     can become markup. */
  const entryNode = (e, no) => {
    const li = document.createElement('li');
    li.className = 'reg-entry';

    const head = document.createElement('div');
    head.className = 'reg-head';

    const num = document.createElement('span');
    num.className = 'reg-no';
    num.textContent = 'No. ' + String(no).padStart(3, '0');

    const name = document.createElement('b');
    name.className = 'reg-name';
    name.textContent = e.name;

    head.append(num, name);

    if (e.location) {
      const from = document.createElement('span');
      from.className = 'reg-from';
      from.textContent = e.location;
      head.append(from);
    }

    const when = document.createElement('span');
    when.className = 'reg-date';
    when.textContent = fmtSigned(e.created_at);
    head.append(when);

    const msg = document.createElement('p');
    msg.className = 'reg-msg';
    msg.textContent = e.message;

    li.append(head, msg);
    return li;
  };

  const note = (text, cls) => {
    const li = document.createElement('li');
    li.className = 'reg-note ' + (cls || '');
    li.textContent = text;
    return li;
  };

  const render = entries => {
    list.replaceChildren();
    if (!entries.length) {
      list.append(note('No one has signed yet. The first line is yours.'));
      return;
    }
    /* Newest first on the page, but numbered from the oldest signature,
       the way a register fills. */
    entries.forEach((e, i) => list.append(entryNode(e, entries.length - i)));
  };

  const load = () => fetch(
    REST + '?select=name,location,message,created_at&order=created_at.desc&limit=200',
    { headers: HEADERS }
  )
    .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(render)
    .catch(() => {
      list.replaceChildren(note('Couldn’t fetch the register just now. The page works without it; try again later.', 'is-error'));
    });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (form.elements.trail.value) return;   /* honeypot */

    const body = {
      name: form.elements.name.value.trim(),
      location: form.elements.location.value.trim() || null,
      message: form.elements.message.value.trim(),
    };
    if (!body.name || !body.message) return;

    const button = form.querySelector('button');
    button.disabled = true;
    status.textContent = 'Signing…';

    fetch(REST, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) })
      .then(res => {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = 'Signed. Karibu.';
        return load();
      })
      .catch(() => {
        status.textContent = 'That didn’t go through. Try once more?';
      })
      .then(() => { button.disabled = false; });
  });

  load();
})();
