const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const OFEK_URL = 'https://myofek.cet.ac.il/';

const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי'];
const TIMES = ['10:00','10:30','11:00','12:00','13:00'];
// [start, end] in minutes from midnight
const SLOT_MINS = [[600,630],[630,660],[660,720],[720,780],[780,810]];

// teacher: exact key from links.json | task:true = independent assignment | null = empty
const CELLS = [
  // ── 10:00 ─────────────────────────────────────────────────────────
  [
    { subject: 'רגשי',      teacher: 'רפית טסה'  },
    { subject: 'מתמטיקה',   teacher: 'רפית טסה'  },
    { subject: 'רגשי',      teacher: 'רפית טסה'  },
    { subject: 'שפה',       teacher: 'אילת יוסף' },
    { subject: 'רגשי',      teacher: 'רפית טסה'  },
  ],
  // ── 10:30 ─────────────────────────────────────────────────────────
  [
    { subject: 'מתמטיקה',         teacher: 'רפית טסה' },
    { subject: 'אומנות / אנגלית', task: true           },
    { subject: 'מתמטיקה',         teacher: 'רפית טסה' },
    { subject: 'מדעים אופק',      task: true           },
    { subject: 'שפה / מתמטיקה',   task: true           },
  ],
  // ── 11:00 ─────────────────────────────────────────────────────────
  [
    { subject: 'מתמטיקה',    task: true             },
    { subject: 'שפה',         teacher: 'אילת יוסף'  },
    { subject: 'שפה / ספורט', task: true             },
    { subject: 'מדעים',       teacher: 'רפית טסה'   },
    { subject: 'ספורט',       teacher: 'נתנאל מדעי' },
  ],
  // ── 12:00 ─────────────────────────────────────────────────────────
  [
    { subject: 'ספורט',        teacher: 'אוראל עטייה'     },
    { subject: 'מיינדפולנס',   teacher: 'הגר מיינדפולנס'  },
    { subject: 'מוסיקה',       teacher: 'סופייה משייב'    },
    { subject: 'אנגלית',       teacher: 'כלנית רז שטראוס' },
    { subject: 'אומנות שכבתי', teacher: 'רווית מזרחי'     },
  ],
  // ── 13:00 ─────────────────────────────────────────────────────────
  [
    null,
    null,
    { subject: 'שרים ביחד', teacher: 'ארתור דיגלו'  },
    { subject: 'שרים ביחד', teacher: 'סופייה משייב' },
    null,
  ],
];

function currentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const daysToSunday = day === 0 ? 0 : day <= 4 ? -day : 7 - day;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + daysToSunday);
  const thursday = new Date(sunday);
  thursday.setDate(sunday.getDate() + 4);
  const fmt = (d) => `${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]}`;
  return `${fmt(sunday)} – ${fmt(thursday)} ${thursday.getFullYear()}`;
}

function classifyLink(url) {
  if (url.includes('ytek-il.zoom.us')) return { cls: 'ytec', icon: '📹' };
  if (url.includes('zoom.us'))         return { cls: 'zoom', icon: '🎥' };
  if (url.includes('meet.google.com')) return { cls: 'meet', icon: '📹' };
  return { cls: 'zoom', icon: '🔗' };
}

function renderTimetable(links) {
  const table = document.getElementById('timetable');
  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  const cornerTh = document.createElement('th');
  cornerTh.className = 'tt-corner';
  headerRow.appendChild(cornerTh);

  DAYS.forEach((day, dayIdx) => {
    const th = document.createElement('th');
    th.className = 'tt-day-header';
    th.dataset.day = dayIdx;
    th.textContent = day;
    headerRow.appendChild(th);
  });

  const tbody = table.createTBody();
  CELLS.forEach((row, timeIdx) => {
    const tr = tbody.insertRow();
    tr.dataset.slot = timeIdx;

    const timeTd = document.createElement('td');
    timeTd.className = 'tt-time';
    timeTd.textContent = TIMES[timeIdx];
    tr.appendChild(timeTd);

    row.forEach((cell, dayIdx) => {
      const td = document.createElement('td');
      td.className = 'tt-cell';
      td.dataset.day = dayIdx;

      if (!cell) {
        td.classList.add('tt-empty');
        tr.appendChild(td);
        return;
      }

      if (cell.task) {
        td.classList.add('tt-task');
        const a = document.createElement('a');
        a.href = OFEK_URL;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'tt-task-link';
        a.innerHTML = `<span class="tt-task-label">📝 משימה</span><span class="tt-subject">${cell.subject}</span>`;
        td.appendChild(a);
        tr.appendChild(td);
        return;
      }

      const url = links[cell.teacher];
      const { cls, icon } = url ? classifyLink(url) : { cls: 'zoom', icon: '🎥' };
      td.classList.add('tt-lesson', `tt-${cls}`);

      const inner = `<span class="tt-icon">${icon}</span><span class="tt-teacher">${cell.teacher.split(' ')[0]}</span><span class="tt-subject">${cell.subject}</span>`;
      if (url) {
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.className = 'tt-link';
        a.innerHTML = inner;
        td.appendChild(a);
      } else {
        td.innerHTML = inner;
      }

      tr.appendChild(td);
    });
  });
}

function updateLive() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun … 6=Sat
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const pill = document.getElementById('next-lesson');

  // Clear previous live highlights
  document.querySelectorAll('tr.tt-now').forEach(el => el.classList.remove('tt-now'));

  // Today column highlight
  document.querySelectorAll('[data-day]').forEach(el => {
    el.classList.toggle('tt-today', parseInt(el.dataset.day) === dayOfWeek);
  });

  if (dayOfWeek > 4) {
    pill.textContent = '🌟 סוף שבוע — נתראה ביום ראשון!';
    return;
  }

  // Find current / next slot
  let currentSlot = -1;
  let nextSlot = -1;
  for (let i = 0; i < SLOT_MINS.length; i++) {
    if (nowMin >= SLOT_MINS[i][0] && nowMin < SLOT_MINS[i][1]) { currentSlot = i; break; }
    if (nowMin < SLOT_MINS[i][0] && nextSlot === -1) nextSlot = i;
  }

  const cellLabel = (slotIdx) => {
    const c = CELLS[slotIdx][dayOfWeek];
    if (!c) return null;
    return c.task ? 'משימה עצמאית' : c.subject;
  };

  if (currentSlot !== -1) {
    // Highlight current row
    const rows = document.querySelectorAll('#timetable tbody tr');
    if (rows[currentSlot]) rows[currentSlot].classList.add('tt-now');
    const remaining = SLOT_MINS[currentSlot][1] - nowMin;
    const label = cellLabel(currentSlot);
    pill.textContent = label
      ? `⏱ ${label} — עוד ${remaining} דק׳`
      : `⏱ שיעור פעיל — עוד ${remaining} דק׳`;
  } else if (nextSlot !== -1) {
    const minsUntil = SLOT_MINS[nextSlot][0] - nowMin;
    const label = cellLabel(nextSlot);
    pill.textContent = label
      ? `🔔 הבא: ${label} — בעוד ${minsUntil} דק׳`
      : `🔔 השיעור הבא בעוד ${minsUntil} דק׳`;
  } else if (nowMin < SLOT_MINS[0][0]) {
    pill.textContent = `🌅 השיעורים מתחילים ב-10:00`;
  } else {
    pill.textContent = '🎉 כל השיעורים הסתיימו!';
  }
}

function initDarkMode() {
  const btn = document.getElementById('dark-toggle');
  const stored = localStorage.getItem('theme');
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

async function init() {
  document.getElementById('week-range').textContent = currentWeekRange();
  initDarkMode();

  let links;
  try {
    const res = await fetch('links.json');
    if (!res.ok) throw new Error();
    links = await res.json();
  } catch {
    document.getElementById('teachers-grid').innerHTML =
      '<p style="color:#c00;text-align:center">שגיאה בטעינת הקישורים.</p>';
    return;
  }

  renderTimetable(links);
  updateLive();
  setInterval(updateLive, 60_000);

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
