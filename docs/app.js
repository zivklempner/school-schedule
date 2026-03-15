const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const OFEK_URL = 'https://myofek.cet.ac.il/';

const DAYS  = ['ראשון','שני','שלישי','רביעי','חמישי'];
const TIMES = ['10:00','10:30','11:00','12:00','13:00'];
// [start, end] in minutes from midnight
const SLOT_MINS = [[600,630],[630,660],[660,720],[720,780],[780,810]];

// ── Helpers ────────────────────────────────────────────────────────────

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function findCurrentWeek(weeks) {
  const today = new Date(); today.setHours(0,0,0,0);
  const sorted = [...weeks].sort((a,b) => parseLocalDate(a.start) - parseLocalDate(b.start));
  for (const w of sorted) {
    const start = parseLocalDate(w.start);
    const end   = new Date(start); end.setDate(start.getDate() + 7);
    if (today >= start && today < end) return w;
  }
  // Fallback: most recent past week, or first future
  const past = sorted.filter(w => parseLocalDate(w.start) <= today);
  return past.length ? past[past.length - 1] : sorted[0];
}

function classifyLink(url) {
  if (url.includes('ytek-il.zoom.us')) return { cls: 'ytec', icon: '📹' };
  if (url.includes('zoom.us'))         return { cls: 'zoom', icon: '🎥' };
  if (url.includes('meet.google.com')) return { cls: 'meet', icon: '📹' };
  return { cls: 'zoom', icon: '🔗' };
}

// ── Timetable renderer ─────────────────────────────────────────────────

function renderTimetable(links, cells) {
  const table = document.getElementById('timetable');
  table.innerHTML = '';

  // Header
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

  // Body
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
          td.appendChild(a);
        } else {
          td.innerHTML = inner;
        }
      }
      tr.appendChild(td);
    });
  });
}

// ── Live: today highlight + now row + countdown ────────────────────────

function updateLive(cells) {
  const now       = new Date();
  const dayOfWeek = now.getDay();
  const nowMin    = now.getHours() * 60 + now.getMinutes();
  const pill      = document.getElementById('next-lesson');

  // Clear previous now-row
  document.querySelectorAll('tr.tt-now').forEach(el => el.classList.remove('tt-now'));

  // Mark today's column
  document.querySelectorAll('[data-day]').forEach(el =>
    el.classList.toggle('tt-today', parseInt(el.dataset.day) === dayOfWeek)
  );

  if (dayOfWeek > 4) {
    pill.textContent = '🌟 סוף שבוע — נתראה ביום ראשון!';
    return;
  }

  let currentSlot = -1, nextSlot = -1;
  for (let i = 0; i < SLOT_MINS.length; i++) {
    if (nowMin >= SLOT_MINS[i][0] && nowMin < SLOT_MINS[i][1]) { currentSlot = i; break; }
    if (nowMin < SLOT_MINS[i][0] && nextSlot === -1) nextSlot = i;
  }

  const cellLabel = idx => {
    const c = cells[idx]?.[dayOfWeek];
    if (!c) return null;
    return c.task ? 'משימה עצמאית' : c.subject;
  };

  if (currentSlot !== -1) {
    const rows = document.querySelectorAll('#timetable tbody tr');
    rows[currentSlot]?.classList.add('tt-now');
    const rem = SLOT_MINS[currentSlot][1] - nowMin;
    const lbl = cellLabel(currentSlot);
    pill.textContent = lbl ? `⏱ ${lbl} — עוד ${rem} דק׳` : `⏱ שיעור פעיל — עוד ${rem} דק׳`;
  } else if (nextSlot !== -1) {
    const min = SLOT_MINS[nextSlot][0] - nowMin;
    const lbl = cellLabel(nextSlot);
    pill.textContent = lbl ? `🔔 הבא: ${lbl} — בעוד ${min} דק׳` : `🔔 השיעור הבא בעוד ${min} דק׳`;
  } else if (nowMin < SLOT_MINS[0][0]) {
    pill.textContent = `🌅 השיעורים מתחילים ב-10:00`;
  } else {
    pill.textContent = '🎉 כל השיעורים הסתיימו!';
  }
}

// ── Today-only toggle ──────────────────────────────────────────────────

function setupTodayToggle() {
  const btn   = document.getElementById('today-toggle');
  const table = document.getElementById('timetable');
  btn.addEventListener('click', () => {
    const hasToday = table.querySelector('[data-day].tt-today');
    if (!hasToday) return; // weekend — nothing to filter
    const on = table.classList.toggle('today-only');
    btn.textContent = on ? '📅 כל הימים' : '📍 היום בלבד';
    btn.classList.toggle('active', on);
  });
}

// ── Notifications ──────────────────────────────────────────────────────

let _swReg = null;
let _notificationsScheduled = false;

async function setupNotifications(cells) {
  const btn = document.getElementById('notify-btn');
  if (!('Notification' in window)) return;

  const refresh = () => {
    const p = Notification.permission;
    if (p === 'granted') {
      btn.textContent = '🔔 התראות פעילות';
      btn.classList.add('notify-active');
      btn.style.display = 'inline-block';
      if (!_notificationsScheduled) scheduleNotifications(cells);
    } else if (p === 'denied') {
      btn.style.display = 'none';
    } else {
      btn.textContent = '🔔 הפעל התראות';
      btn.style.display = 'inline-block';
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
  const now       = new Date();
  const dayOfWeek = now.getDay();
  if (dayOfWeek > 4) return;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  SLOT_MINS.forEach(([start], si) => {
    const notifyMin = start - 5;
    const msUntil   = (notifyMin - nowMin) * 60_000;
    if (msUntil <= 0) return;

    const cell = cells[si]?.[dayOfWeek];
    if (!cell) return;
    const label   = cell.task ? `משימה — ${cell.subject}` : cell.subject;
    const teacher = cell.teacher ? ` עם ${cell.teacher.split(' ')[0]}` : '';
    const body    = `${TIMES[si]} — ${label}${teacher}`;

    setTimeout(() => {
      if (Notification.permission !== 'granted') return;
      // Prefer service worker notification (works when page is in background)
      if (_swReg) {
        _swReg.active?.postMessage({ type: 'NOTIFY', title: '🔔 שיעור בעוד 5 דקות', body, tag: `lesson-${si}` });
      } else {
        new Notification('🔔 שיעור בעוד 5 דקות', { body, icon: 'favicon.svg', tag: `lesson-${si}` });
      }
    }, msUntil);
  });
}

// ── Dark mode ──────────────────────────────────────────────────────────

function initDarkMode() {
  const btn = document.getElementById('dark-toggle');
  const stored     = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = stored ? stored === 'dark' : prefersDark;
  if (dark) document.documentElement.dataset.theme = 'dark';
  btn.textContent = dark ? '☀️' : '🌙';

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    if (isDark) {
      delete document.documentElement.dataset.theme;
      localStorage.setItem('theme', 'light');
      btn.textContent = '🌙';
    } else {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('theme', 'dark');
      btn.textContent = '☀️';
    }
  });
}

// ── Service worker ─────────────────────────────────────────────────────

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    _swReg = await navigator.serviceWorker.register('./sw.js');
  } catch (e) {
    console.warn('SW registration failed', e);
  }
}

// ── Bootstrap ──────────────────────────────────────────────────────────

async function init() {
  initDarkMode();
  registerSW();

  let links, scheduleData;
  try {
    const [lr, sr] = await Promise.all([fetch('links.json'), fetch('schedule.json')]);
    if (!lr.ok || !sr.ok) throw new Error();
    [links, scheduleData] = await Promise.all([lr.json(), sr.json()]);
  } catch {
    document.getElementById('teachers-grid').innerHTML =
      '<p style="color:#c00;text-align:center">שגיאה בטעינת הנתונים.</p>';
    document.getElementById('next-lesson').textContent = '';
    return;
  }

  const week  = findCurrentWeek(scheduleData.weeks);
  const cells = week.cells;

  // Week range label from schedule data
  const wStart = parseLocalDate(week.start);
  const wEnd   = new Date(wStart); wEnd.setDate(wStart.getDate() + 4);
  const fmt = d => `${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]}`;
  document.getElementById('week-range').textContent =
    `${fmt(wStart)} – ${fmt(wEnd)} ${wEnd.getFullYear()}`;

  renderTimetable(links, cells);
  updateLive(cells);
  setInterval(() => updateLive(cells), 60_000);
  setupTodayToggle();
  setupNotifications(cells);

  // Teachers grid
  const grid = document.getElementById('teachers-grid');
  grid.innerHTML = '';
  for (const [name, url] of Object.entries(links)) {
    if (!url) continue;
    const { cls, icon } = classifyLink(url);
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.className = `teacher-btn ${cls}`;
    a.innerHTML = `<span class="btn-icon">${icon}</span><span class="btn-name">${name}</span>`;
    grid.appendChild(a);
  }
}

document.addEventListener('DOMContentLoaded', init);
