const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const OFEK_URL  = 'https://myofek.cet.ac.il/';
const SHARE_URL = 'https://zivklempner.github.io/g32';

const DAYS     = ['ראשון','שני','שלישי','רביעי','חמישי'];
const TIMES    = ['10:00','10:30','11:00','12:00','13:00'];
const SLOT_MINS = [[600,630],[630,660],[660,720],[720,780],[780,810]];

// ── Analytics (localStorage, per-device) ──────────────────

function trackVisit() {
  const data = getAnalytics();
  data.visits.push({ ts: Date.now() });
  if (data.visits.length > 500) data.visits = data.visits.slice(-500);
  saveAnalytics(data);
}

function trackClick(name) {
  const data = getAnalytics();
  data.clicks[name] = (data.clicks[name] || 0) + 1;
  saveAnalytics(data);
}

function getAnalytics() {
  try { return JSON.parse(localStorage.getItem('analytics') || '{"visits":[],"clicks":{}}'); }
  catch { return { visits: [], clicks: {} }; }
}

function saveAnalytics(data) {
  try { localStorage.setItem('analytics', JSON.stringify(data)); } catch {}
}

// ── Helpers ────────────────────────────────────────────────

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function findCurrentWeek(weeks) {
  const today = new Date(); today.setHours(0,0,0,0);
  const sorted = [...weeks].sort((a,b) => parseLocalDate(a.start) - parseLocalDate(b.start));
  for (const w of sorted) {
    const start = parseLocalDate(w.start);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    if (today >= start && today < end) return w;
  }
  const past = sorted.filter(w => parseLocalDate(w.start) <= today);
  return past.length ? past[past.length - 1] : sorted[0];
}

function classifyLink(url) {
  if (url.includes('ytek-il.zoom.us')) return { cls: 'ytec', icon: '📹' };
  if (url.includes('zoom.us'))         return { cls: 'zoom', icon: '🎥' };
  if (url.includes('meet.google.com')) return { cls: 'meet', icon: '📹' };
  return { cls: 'zoom', icon: '🔗' };
}

// ── Timetable renderer ─────────────────────────────────────

function renderTimetable(links, cells) {
  const table = document.getElementById('timetable');
  table.innerHTML = '';

  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  const corner = document.createElement('th');
  corner.className = 'tt-corner';
  headerRow.appendChild(corner);
  DAYS.forEach((day, di) => {
    const th = document.createElement('th');
    th.className = 'tt-day-header';
    th.dataset.day = di;
    th.textContent = day;
    headerRow.appendChild(th);
  });

  const tbody = table.createTBody();
  cells.forEach((row, ti) => {
    const tr = tbody.insertRow();
    tr.dataset.slot = ti;

    const timeTd = document.createElement('td');
    timeTd.className = 'tt-time';
    timeTd.textContent = TIMES[ti];
    tr.appendChild(timeTd);

    row.forEach((cell, di) => {
      const td = document.createElement('td');
      td.className = 'tt-cell';
      td.dataset.day = di;

      if (!cell) {
        td.classList.add('tt-empty');
      } else if (cell.task) {
        td.classList.add('tt-task');
        const a = document.createElement('a');
        a.href = OFEK_URL; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.className = 'tt-task-link';
        a.innerHTML = `<span class="tt-task-label">📝 משימה</span><span class="tt-subject">${cell.subject}</span>`;
        a.addEventListener('click', () => trackClick('📝 ' + cell.subject));
        td.appendChild(a);
      } else {
        const url = links[cell.teacher];
        const { cls, icon } = url ? classifyLink(url) : { cls: 'zoom', icon: '🎥' };
        td.classList.add('tt-lesson', `tt-${cls}`);
        const inner = `<span class="tt-icon">${icon}</span><span class="tt-teacher">${cell.teacher.split(' ')[0]}</span><span class="tt-subject">${cell.subject}</span>`;
        if (url) {
          const a = document.createElement('a');
          a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
          a.className = 'tt-link'; a.innerHTML = inner;
          a.addEventListener('click', () => trackClick(cell.teacher));
          td.appendChild(a);
        } else {
          td.innerHTML = inner;
        }
      }
      tr.appendChild(td);
    });
  });
}

// ── Live indicator ─────────────────────────────────────────
// Two separate pills:
//   now-pill  → what's happening RIGHT NOW (hidden outside school hours)
//   next-pill → next LIVE (non-task) class countdown

function updateLive(cells) {
  const now       = new Date();
  const dayOfWeek = now.getDay();
  const nowMin    = now.getHours() * 60 + now.getMinutes();

  const nowPill  = document.getElementById('now-pill');
  const nextPill = document.getElementById('next-lesson');

  // Clear row highlights; mark today column
  document.querySelectorAll('tr.tt-now').forEach(el => el.classList.remove('tt-now'));
  document.querySelectorAll('[data-day]').forEach(el =>
    el.classList.toggle('tt-today', parseInt(el.dataset.day) === dayOfWeek)
  );

  if (dayOfWeek > 4) {
    nowPill.style.display = 'none';
    nextPill.textContent = '🌟 סוף שבוע';
    nextPill.style.display = '';
    return;
  }

  // Find current slot (any) and next LIVE slot (skip tasks)
  let currentSlot  = -1;
  let nextLiveSlot = -1;

  for (let i = 0; i < SLOT_MINS.length; i++) {
    const [s, e] = SLOT_MINS[i];
    if (nowMin >= s && nowMin < e) {
      currentSlot = i;
    }
    if (nowMin < s && nextLiveSlot === -1) {
      const c = cells[i]?.[dayOfWeek];
      if (c && !c.task) nextLiveSlot = i;
    }
  }

  // ── Now pill ───────────────────────────────────────────
  if (currentSlot !== -1) {
    const rows = document.querySelectorAll('#timetable tbody tr');
    rows[currentSlot]?.classList.add('tt-now');

    const c = cells[currentSlot]?.[dayOfWeek];
    if (c) {
      const label = c.task ? `📝 ${c.subject}` : c.subject;
      nowPill.textContent  = `🟢 עכשיו: ${label}`;
      nowPill.style.display = '';
    } else {
      nowPill.style.display = 'none';
    }
  } else {
    nowPill.style.display = 'none';
  }

  // ── Next pill ──────────────────────────────────────────
  if (nextLiveSlot !== -1) {
    const c   = cells[nextLiveSlot][dayOfWeek];
    const min = SLOT_MINS[nextLiveSlot][0] - nowMin;
    nextPill.textContent  = `🔔 הבא: ${c.subject} — בעוד ${min} דק׳`;
    nextPill.style.display = '';
  } else if (nowMin < SLOT_MINS[0][0]) {
    nextPill.textContent  = '🌅 מתחילים ב-10:00';
    nextPill.style.display = '';
  } else {
    nextPill.textContent  = '🎉 כל השיעורים הסתיימו!';
    nextPill.style.display = '';
  }
}

// ── Today-only toggle ──────────────────────────────────────

function setupTodayToggle(autoOn) {
  const btn   = document.getElementById('today-toggle');
  const table = document.getElementById('timetable');

  const setOn = (on) => {
    const hasToday = table.querySelector('[data-day].tt-today');
    if (on && !hasToday) return;
    table.classList.toggle('today-only', on);
    btn.textContent = on ? '📅 כל הימים' : '📍 היום';
    btn.classList.toggle('active', on);
  };

  if (autoOn) setOn(true);
  btn.addEventListener('click', () => setOn(!table.classList.contains('today-only')));
}

// ── Share ──────────────────────────────────────────────────

function setupShare() {
  const btn = document.getElementById('share-btn');
  btn.addEventListener('click', async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'מערכת ג׳2 — צוות הדר', url: SHARE_URL }); return; }
      catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      showToast('🔗 הקישור הועתק!');
    } catch {
      showToast(SHARE_URL);
    }
  });
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Notifications ──────────────────────────────────────────

let _swReg = null;
let _notificationsScheduled = false;

async function setupNotifications(cells) {
  const btn = document.getElementById('notify-btn');
  if (!('Notification' in window)) return;

  const refresh = () => {
    const p = Notification.permission;
    if (p === 'granted') {
      btn.title = 'התראות פעילות ✓';
      btn.classList.add('notify-active');
      btn.style.display = 'flex';
      if (!_notificationsScheduled) scheduleNotifications(cells);
    } else if (p === 'denied') {
      btn.style.display = 'none';
    } else {
      btn.title = 'הפעל התראות';
      btn.style.display = 'flex';
    }
  };
  refresh();
  btn.addEventListener('click', async () => {
    if (Notification.permission === 'granted') return;
    await Notification.requestPermission();
    refresh();
  });
}

function scheduleNotifications(cells) {
  _notificationsScheduled = true;
  const now = new Date();
  const day = now.getDay();
  if (day > 4) return;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  SLOT_MINS.forEach(([start], si) => {
    const msUntil = (start - 5 - nowMin) * 60_000;
    if (msUntil <= 0) return;
    const cell = cells[si]?.[day];
    if (!cell) return;
    const label   = cell.task ? `📝 ${cell.subject}` : cell.subject;
    const teacher = cell.teacher ? ` עם ${cell.teacher.split(' ')[0]}` : '';
    setTimeout(() => {
      if (Notification.permission !== 'granted') return;
      const body = `${TIMES[si]} — ${label}${teacher}`;
      if (_swReg?.active) {
        _swReg.active.postMessage({ type: 'NOTIFY', title: '🔔 שיעור בעוד 5 דקות', body, tag: `lesson-${si}` });
      } else {
        new Notification('🔔 שיעור בעוד 5 דקות', { body, icon: 'favicon.svg', tag: `lesson-${si}` });
      }
    }, msUntil);
  });
}

// ── Dark mode ──────────────────────────────────────────────

function initDarkMode() {
  const btn = document.getElementById('dark-toggle');
  const stored = localStorage.getItem('theme');
  const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.dataset.theme = 'dark';
  btn.textContent = dark ? '☀️' : '🌙';
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    if (isDark) { delete document.documentElement.dataset.theme; }
    else { document.documentElement.dataset.theme = 'dark'; }
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    btn.textContent = isDark ? '🌙' : '☀️';
  });
}

// ── Service worker ─────────────────────────────────────────

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    _swReg = await navigator.serviceWorker.register('./sw.js');
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
  } catch (e) { console.warn('SW:', e); }
}

// ── Bootstrap ──────────────────────────────────────────────

async function init() {
  initDarkMode();
  registerSW();
  trackVisit();

  let links, scheduleData;
  try {
    const [lr, sr] = await Promise.all([fetch('links.json'), fetch('schedule.json')]);
    if (!lr.ok || !sr.ok) throw new Error();
    [links, scheduleData] = await Promise.all([lr.json(), sr.json()]);
  } catch {
    document.getElementById('teachers-grid').innerHTML =
      '<p style="color:#c00;text-align:center">שגיאה בטעינת הנתונים.</p>';
    return;
  }

  const week  = findCurrentWeek(scheduleData.weeks);
  const cells = week.cells;

  const wStart = parseLocalDate(week.start);
  const wEnd   = new Date(wStart); wEnd.setDate(wStart.getDate() + 4);
  const fmt = d => `${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]}`;
  document.getElementById('week-range').textContent =
    `${fmt(wStart)} – ${fmt(wEnd)} ${wEnd.getFullYear()}`;

  renderTimetable(links, cells);
  updateLive(cells);
  setInterval(() => updateLive(cells), 60_000);

  const isMobile = window.matchMedia('(max-width: 600px)').matches;
  setupTodayToggle(isMobile);
  setupNotifications(cells);
  setupShare();

  const grid = document.getElementById('teachers-grid');
  grid.innerHTML = '';
  for (const [name, url] of Object.entries(links)) {
    if (!url) continue;
    const { cls, icon } = classifyLink(url);
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.className = `teacher-btn ${cls}`;
    a.innerHTML = `<span class="btn-icon">${icon}</span><span class="btn-name">${name}</span>`;
    a.addEventListener('click', () => trackClick(name));
    grid.appendChild(a);
  }
}

document.addEventListener('DOMContentLoaded', init);
