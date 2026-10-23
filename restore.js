// Recovery: restore points kept on this device (one per day, plus one before any risky merge or restore),
// and a Settings section that lists every copy of the data this browser can find (cloud, restore points,
// the last version synced here, data saved without an account) so one can be merged back in.
(() => {
  'use strict';
  const { S, t, esc, save, on, toast } = ML;

  ML.addStrings({
    fr: {
      set_restore: 'Récupération', rs_hint: 'Si des données ont disparu, choisis une copie ci-dessous et touche « Récupérer » : elle est fusionnée avec ce que tu as maintenant, rien n’est effacé.',
      rs_cloud: 'Copie en ligne (cloud)', rs_snap_daily: 'Point de restauration du {d}', rs_snap_before: 'Avant une fusion de sécurité ({d})', rs_snap_restore: 'Avant une récupération ({d})', rs_snap_start: 'Au démarrage du {d}',
      rs_base: 'Dernière version synchronisée sur cet appareil', rs_guest: 'Données sans compte sur cet appareil', rs_other: 'Autre compte sur cet appareil', rs_old: 'Ancienne version de l’app',
      rs_line: '{xp} XP · {tasks} tâches · {sessions} sessions · {notes} pages · {events} événements', rs_saved: 'enregistrée le {d}',
      rs_get: 'Récupérer', rs_done: 'Données récupérées et fusionnées.', rs_none: 'Aucune autre copie trouvée sur cet appareil.', rs_loading: 'Recherche des copies…', rs_current: 'Maintenant : {line}',
    },
    en: {
      set_restore: 'Recovery', rs_hint: 'If data disappeared, pick a copy below and tap "Recover": it is merged with what you have now, nothing is deleted.',
      rs_cloud: 'Online copy (cloud)', rs_snap_daily: 'Restore point from {d}', rs_snap_before: 'Before a safety merge ({d})', rs_snap_restore: 'Before a recovery ({d})', rs_snap_start: 'At startup on {d}',
      rs_base: 'Last version synced on this device', rs_guest: 'Data saved without an account on this device', rs_other: 'Another account on this device', rs_old: 'Older app version',
      rs_line: '{xp} XP · {tasks} tasks · {sessions} sessions · {notes} pages · {events} events', rs_saved: 'saved {d}',
      rs_get: 'Recover', rs_done: 'Data recovered and merged.', rs_none: 'No other copy found on this device.', rs_loading: 'Looking for copies…', rs_current: 'Now: {line}',
    },
  });

  /* ---------- Restore points ---------- */
  const snapKey = () => 'mli-snaps:' + ML.storageKey();
  const readSnaps = () => { try { return JSON.parse(localStorage.getItem(snapKey())) || []; } catch (e) { return []; } };
  const meaningful = d => d && ((d.sessions && d.sessions.length) || (d.tasks && d.tasks.some(x => !x.sample)) || (+d.xp > 0) || (d.notes && d.notes.pages && d.notes.pages.length));
  // the key + day today's daily point was confirmed for: after that, saves skip the full stringify + parse of every point
  let dailyFor = '';
  function snapshot(reason = 'daily') {
    if (reason === 'daily' && dailyFor === snapKey() + '|' + ML.today()) return;
    if (!meaningful(S)) return;
    if (JSON.stringify(S).length > 600000) return; // very large data: keep the space for the live copy
    let list = readSnaps();
    if (reason === 'daily' && list.some(s => s.reason === 'daily' && s.day === ML.today())) { dailyFor = snapKey() + '|' + ML.today(); return; }
    list.push({ at: Date.now(), day: ML.today(), reason, data: JSON.parse(JSON.stringify(S)) });
    const keep = (r, n) => list.filter(s => s.reason === r).slice(-n);
    list = [...keep('daily', 3), ...keep('start-check', 2), ...list.filter(s => !['daily', 'start-check'].includes(s.reason)).slice(-2)].sort((a, b) => a.at - b.at);
    for (let i = 0; i < 4; i++) { // if storage is full, drop the oldest point and retry
      try { localStorage.setItem(snapKey(), JSON.stringify(list)); if (list.some(s => s.reason === 'daily' && s.day === ML.today())) dailyFor = snapKey() + '|' + ML.today(); return; } catch (e) { if (list.length <= 1) return; list.shift(); }
    }
  }
  ML.snapshot = snapshot;
  let snapT = null;
  on('saved', () => { clearTimeout(snapT); snapT = setTimeout(() => snapshot('daily'), 5000); });
  on('loaded', () => snapshot('start-check'));

  /* ---------- Finding every copy ---------- */
  const fmtDay = ts => new Date(ts).toLocaleString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const summary = d => t('rs_line', {
    xp: (+d.xp || 0).toLocaleString(ML.locale()), tasks: (d.tasks || []).filter(x => !x.sample).length, sessions: (d.sessions || []).length,
    notes: (d.notes && d.notes.pages ? d.notes.pages.length : 0), events: (d.events || []).length,
  });
  function localCopies() {
    const out = [], cur = ML.storageKey(), uid = ML.auth && ML.auth.user && ML.auth.user.id;
    readSnaps().slice().reverse().forEach((s, i) => out.push({ id: 'snap' + i, label: t(s.reason === 'daily' ? 'rs_snap_daily' : s.reason === 'before-restore' ? 'rs_snap_restore' : s.reason === 'before-merge' ? 'rs_snap_before' : 'rs_snap_start', { d: fmtDay(s.at) }), data: s.data }));
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i); let label = null;
        if (k === cur || !k) continue;
        if (uid && k === 'mli-sync-base:' + uid) label = t('rs_base');
        else if (k === ML.GUEST_KEY) label = t('rs_guest');
        else if (k.startsWith('merlins-lockin-v2:u:')) label = t('rs_other');
        else if (k === 'merlins-lockin-v1') label = t('rs_old');
        if (!label) continue;
        let d = null; try { d = JSON.parse(localStorage.getItem(k)); } catch (e) {}
        if (k === 'merlins-lockin-v1' && d) d = { tasks: d.tasks || [], sessions: (d.log || []).map(l => ({ at: l.at, mins: l.mins, title: l.title, full: true })), xp: 0 };
        if (meaningful(d)) out.push({ id: k, label, data: d });
      }
    } catch (e) {}
    return out;
  }
  let found = null;
  async function scan() {
    found = localCopies();
    if (ML.auth && ML.auth.user) {
      try { const c = await ML.auth.cloudCopy(); if (meaningful(c)) found.unshift({ id: 'cloud', label: t('rs_cloud'), data: c }); } catch (e) {}
    }
    const el = document.getElementById('rs-list'); if (el) el.innerHTML = listHtml();
  }
  const listHtml = () => !found ? `<p class="hint">${esc(t('rs_loading'))}</p>` : !found.length ? `<p class="hint">${esc(t('rs_none'))}</p>`
    : `<ul class="rs-list">${found.map((c, i) => `<li><div><b>${esc(c.label)}</b><small>${esc(summary(c.data))}${c.data._savedAt ? ' · ' + esc(t('rs_saved', { d: fmtDay(c.data._savedAt) })) : ''}</small></div><button type="button" class="small" data-rs="${i}">${esc(t('rs_get'))}</button></li>`).join('')}</ul>`;

  // Recovery = union merge of the chosen copy into the current state (nothing is deleted), then pushed to the cloud
  async function recover(copy) {
    snapshot('before-restore');
    const merge = ML.auth && ML.auth.merge3;
    const merged = merge ? merge(undefined, JSON.parse(JSON.stringify(S)), JSON.parse(JSON.stringify(copy.data)), true, '') : copy.data;
    ML.applyRemote(merged);
    ML.saveNow();
    try { if (ML.auth && ML.auth.user) await ML.auth.forcePush(); } catch (e) {}
    toast(t('rs_done'), { ms: 5000 });
    if (ML.renderSettings) ML.renderSettings();
  }

  ML.settingsSection({
    order: 6,
    render: () => `<h3>${esc(t('set_restore'))}</h3><p class="hint">${esc(t('rs_hint'))}</p>
      <p class="hint">${esc(t('rs_current', { line: summary(S) }))}</p><div id="rs-list">${listHtml()}</div>`,
    bind: r => {
      found = null; scan();
      const box = r.querySelector('#rs-list');
      let armed = null;
      box.addEventListener('click', e => {
        const b = e.target.closest('[data-rs]'); if (!b || !found) return;
        if (armed !== b) { armed = b; b.textContent = t('tap_again'); setTimeout(() => { if (armed === b) { armed = null; b.textContent = t('rs_get'); } }, 3000); return; }
        armed = null; recover(found[+b.dataset.rs]);
      });
    },
  });
})();
