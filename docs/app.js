const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const OFEK_URL = 'https://myofek.cet.ac.il/';

// ── Multi-class support ─────────────────────────────────────
const CLASS_ID = new URLSearchParams(window.location.search).get('class')
              || localStorage.getItem('selectedClass')
              || 'g32';
const CLASS_CFG = {
  g32: {
    subtitle:     "כיתה ג׳2",
    scheduleFile: './schedule.json',
    imgSrc:       'schedule-g2.jpeg',
    shareUrl:     'https://zivklempner.github.io/g32',
    shareTitle:   "מערכת ג׳2"
  },
  g4: {
    subtitle:     "כיתה ג׳4",
    scheduleFile: './schedule-g4.json',
    imgSrc:       'schedule-g4.jpeg',
    shareUrl:     'https://zivklempner.github.io/g32?class=g4',
    shareTitle:   "מערכת ג׳4"
  }
};
const CLS = CLASS_CFG[CLASS_ID] || CLASS_CFG.g32;
const SHARE_URL = CLS.shareUrl;

// Active schedule cells (updated on class switch)
let _activeCells = null;
let _links = null;
const _allSchedules = {};

const DAYS     = ['ראשון','שני','שלישי','רביעי','חמישי'];
const TIMES    = ['10:00','10:30','11:00','12:00','13:00'];
const SLOT_MINS = [[600,630],[630,660],[660,720],[720,780],[780,810]];

// ── Hardcoded schedule data (one array of rows per class) ───
const SCHEDULE_DATA = {
  g32: [
    [ // 10:00
      { subject: 'רגשי',      teacher: 'רפית טסה'   },
      { subject: 'מתמטיקה',   teacher: 'רפית טסה'   },
      { subject: 'רגשי',      teacher: 'רפית טסה'   },
      { subject: 'שפה',       teacher: 'אילת יוסף'  },
      { subject: 'רגשי',      teacher: 'רפית טסה'   }
    ],
    [ // 10:30
      { subject: 'מתמטיקה',         teacher: 'רפית טסה' },
      { subject: 'אומנות / אנגלית', task: true           },
      { subject: 'מתמטיקה',         teacher: 'רפית טסה' },
      { subject: 'מדעים אופק',      task: true           },
      { subject: 'שפה / מתמטיקה',   task: true           }
    ],
    [ // 11:00
      { subject: 'מתמטיקה',     task: true             },
      { subject: 'שפה',         teacher: 'אילת יוסף'  },
      { subject: 'שפה / ספורט', task: true             },
      { subject: 'מדעים',       teacher: 'רפית טסה'   },
      { subject: 'ספורט',       teacher: 'נתנאל מדעי' }
    ],
    [ // 12:00
      { subject: 'ספורט',         teacher: 'אוראל עטייה'     },
      { subject: 'מיינדפולנס',    teacher: 'הגר מיינדפולנס'  },
      { subject: 'מוסיקה',        teacher: 'סופייה משייב'    },
      { subject: 'אנגלית',        teacher: 'כלנית רז שטראוס' },
      { subject: 'אומנות שכבתי', teacher: 'רווית מזרחי'     }
    ],
    [ // 13:00
      null,
      null,
      { subject: 'שרים ביחד', teacher: 'ארתור דיגלו'  },
      { subject: 'שרים ביחד', teacher: 'סופייה משייב' },
      null
    ]
  ],
  g4: [
    [ // 10:00
      { subject: 'שפה',    teacher: 'נעה שחמון'        },
      { subject: 'אנגלית', teacher: 'כלנית רז שטראוס'  },
      { subject: 'מדעים',  teacher: 'סיגלית אורן'      },
      { subject: 'שפה',    teacher: 'נעה שחמון'        },
      { subject: 'שפה',    teacher: 'נעה שחמון'        }
    ],
    [ // 10:30
      { subject: 'מתמטיקה',       task: true },
      { subject: 'אנגלית + אומנות', task: true },
      { subject: 'שפה + ספורט',   task: true },
      { subject: 'מדעים',         task: true },
      { subject: 'שפה + מתמטיקה', task: true }
    ],
    [ // 11:00
      { subject: 'מתמטיקה', teacher: 'גלית דרי'       },
      { subject: 'שפה',     teacher: 'נעה שחמון'      },
      { subject: 'חברתי',   teacher: 'נעה שחמון'      },
      { subject: 'מתמטיקה', teacher: 'גלית דרי'       },
      { subject: 'ספורט',   teacher: 'אוראל עטייה'    }
    ],
    [ // 12:00
      { subject: 'ספורט',      teacher: 'אוראל עטייה'    },
      { subject: 'מיינדפולנס', teacher: 'הגר מיינדפולנס' },
      { subject: 'מוזיקה',     teacher: 'סופייה משייב'   },
      { subject: 'מדעים',      teacher: 'סיגלית אורן'    },
      { subject: 'אומנות',     teacher: 'רווית מזרחי'    }
    ],
    [ // 13:00
      null,
      null,
      { subject: 'העשרה שכבות א-ג',     teacher: 'ארתור דיגלו'  },
      { subject: 'שרים ביחד שכבות ב-ג', teacher: 'סופייה משייב' },
      null
    ]
  ]
};

// ── Per-class teacher lists ──────────────────────────────────
const CLASS_TEACHERS = {
  g32: ['רפית טסה','אילת יוסף','נתנאל מדעי','אוראל עטייה','הגר מיינדפולנס','סופייה משייב','כלנית רז שטראוס','רווית מזרחי','ארתור דיגלו'],
  g4: ['נעה שחמון','כלנית רז שטראוס','סיגלית אורן','גלית דרי','אוראל עטייה','הגר מיינדפולנס','סופייה משייב','רווית מזרחי','ארתור דיגלו']
};

// ── GoatCounter event helper (real multi-device analytics) ─
// Page views are tracked automatically. This tracks clicks.
function gcEvent(path, title) {
  if (window.goatcounter?.count) {
    window.goatcounter.count({ path: 'click/' + path, title, event: true });
  }
}

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
  if (/ytek-il\.zoom\.us/.test(url)) return { cls: 'ytec', icon: '🎥' };
  if (/zoom\.us/.test(url))          return { cls: 'zoom', icon: '🎥' };
  if (/meet\.google\.com/.test(url)) return { cls: 'meet', icon: '📷' };
  return { cls: 'zoom', icon: '🎥' };
}

// ── Timetable renderer ─────────────────────────────────────

function renderScheduleTable(classId) {
  const cells = SCHEDULE_DATA[classId];
  if (!cells) return;
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
        const span = document.createElement('span');
        span.className = 'tt-task-link';
        span.innerHTML = `<span class="tt-task-label">📝 משימה</span><span class="tt-subject">${cell.subject}</span>`;
        td.appendChild(span);
      } else {
        const url = _links ? _links[cell.teacher] : null;
        td.classList.add('tt-live');
        const inner = `<span class="tt-subject">${cell.subject}</span><span class="tt-teacher">${cell.teacher.split(' ')[0]}</span>`;
        if (url) {
          const a = document.createElement('a');
          a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
          a.className = 'tt-link'; a.innerHTML = inner;
          a.addEventListener('click', () => { trackClick(cell.teacher); gcEvent('lesson/' + cell.teacher, cell.subject + ' — ' + cell.teacher); });
          td.appendChild(a);
        } else {
          td.innerHTML = inner;
        }
      }
      tr.appendChild(td);
    });
  });
}

function renderTeacherGrid(classId) {
  if (!_links) return;
  const grid = document.getElementById('teachers-grid');
  grid.innerHTML = '';
  const teachers = CLASS_TEACHERS[classId] || [];
  for (const name of teachers) {
    const url = _links[name];
    if (!url) continue;
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.className = 'teacher-btn zoom';
    a.innerHTML = `<span class="btn-icon">🎥</span><span class="btn-name">${name}</span>`;
    a.addEventListener('click', () => { trackClick(name); gcEvent('teacher/' + name, 'Teacher: ' + name); });
    grid.appendChild(a);
  }
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
    // hide next-pill while a class is running — no need for countdown
    nextPill.style.display = 'none';
    return;
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

// ── Lesson timer ───────────────────────────────────────────

function updateLessonTimer(cells) {
  const timer     = document.getElementById('lesson-timer');
  const now       = new Date();
  const dayOfWeek = now.getDay();
  const nowSec    = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const nowMin    = now.getHours() * 60 + now.getMinutes();

  if (dayOfWeek > 4) { timer.style.display = 'none'; return; }

  // Find current slot (in lesson) or next slot that actually has a lesson
  let currentSlot = -1;
  let nextSlot    = -1;
  for (let i = 0; i < SLOT_MINS.length; i++) {
    const [s, e] = SLOT_MINS[i];
    if (nowSec >= s * 60 && nowSec < e * 60 && cells[i]?.[dayOfWeek]) {
      currentSlot = i; break;
    }
    if (nowMin < s && nextSlot === -1 && cells[i]?.[dayOfWeek]) {
      nextSlot = i;
    }
  }

  if (currentSlot !== -1) {
    // ── In a lesson: show remaining time ──────────────────
    const [slotStart, slotEnd] = SLOT_MINS[currentSlot];
    const totalSec   = (slotEnd - slotStart) * 60;
    const elapsedSec = nowSec - slotStart * 60;
    const remainSec  = totalSec - elapsedSec;
    const pct        = Math.min(100, (elapsedSec / totalSec) * 100);
    const remainMin  = Math.ceil(remainSec / 60);
    const label      = remainMin === 1 ? 'דקה אחת' : `${remainMin} דק׳`;

    document.getElementById('lesson-timer-fill').style.width      = pct.toFixed(1) + '%';
    document.getElementById('lesson-timer-label').textContent     = `⏱ נשארו: ${label}`;
    document.getElementById('lesson-timer-pct').textContent       = Math.round(pct) + '%';
    document.getElementById('lesson-timer-fill').style.background = 'linear-gradient(90deg, #22b857, #4ECDC4)';
    timer.style.display = 'flex';

  } else if (nextSlot !== -1) {
    // ── Between lessons: countdown to next real lesson ────
    const [nextStart] = SLOT_MINS[nextSlot];
    const remainSec   = nextStart * 60 - nowSec;
    const totalBreak  = nextSlot === 0
      ? nextStart * 60
      : nextStart * 60 - SLOT_MINS[nextSlot - 1][1] * 60;
    const elapsed = totalBreak - remainSec;
    const pct     = Math.min(100, (elapsed / totalBreak) * 100);
    const mins    = Math.floor(remainSec / 60);
    const secs    = remainSec % 60;
    const label   = mins > 0
      ? `השיעור הבא בעוד ${mins}:${String(secs).padStart(2, '0')}`
      : `השיעור הבא בעוד ${secs} שנ׳`;

    document.getElementById('lesson-timer-fill').style.width      = pct.toFixed(1) + '%';
    document.getElementById('lesson-timer-label').textContent     = `🔔 ${label}`;
    document.getElementById('lesson-timer-pct').textContent       = '';
    document.getElementById('lesson-timer-fill').style.background = 'linear-gradient(90deg, var(--orange), #FFD700)';
    timer.style.display = 'flex';

  } else {
    timer.style.display = 'none';
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
    const cfg = CLASS_CFG[localStorage.getItem('selectedClass') || CLASS_ID] || CLS;
    if (navigator.share) {
      try { await navigator.share({ title: cfg.shareTitle, url: cfg.shareUrl }); return; }
      catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(cfg.shareUrl);
      showToast('🔗 הקישור הועתק!');
    } catch {
      showToast(cfg.shareUrl);
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

// ── Install banner ─────────────────────────────────────────

let _installPrompt = null;

function setupInstallBanner() {
  const dismissed  = localStorage.getItem('install_dismissed');
  const isIOS      = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;

  if (isStandalone || dismissed) return;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _installPrompt = e;
    setTimeout(() => showInstallBanner('chrome'), 2000);
  });

  if (isIOS) {
    setTimeout(() => showInstallBanner('ios'), 2000);
  }
}

function showInstallBanner(type) {
  if (document.getElementById('install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.className = 'install-banner';

  if (type === 'ios') {
    banner.innerHTML = `
      <span class="install-icon">📲</span>
      <div class="install-text">
        <div class="install-title">התקן כאפליקציה</div>
        <div class="install-sub">לחץ <strong>שתף</strong> <span style="font-size:1rem">⬆️</span> ← <strong>הוסף למסך הבית</strong></div>
      </div>
      <button class="install-close" onclick="dismissInstallBanner()">✕</button>`;
  } else {
    banner.innerHTML = `
      <span class="install-icon">📲</span>
      <div class="install-text">
        <div class="install-title">התקן כאפליקציה</div>
        <div class="install-sub">גישה מהירה ישירות מהמסך הראשי</div>
      </div>
      <button class="install-btn" onclick="doInstall()">התקן</button>
      <button class="install-close" onclick="dismissInstallBanner()">✕</button>`;
  }

  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('show'));
}

async function doInstall() {
  if (!_installPrompt) return;
  _installPrompt.prompt();
  const { outcome } = await _installPrompt.userChoice;
  if (outcome === 'accepted') dismissInstallBanner();
}

function dismissInstallBanner() {
  const b = document.getElementById('install-banner');
  if (b) { b.classList.remove('show'); setTimeout(() => b.remove(), 350); }
  localStorage.setItem('install_dismissed', '1');
}

// ── Class switcher (SPA, no page reload) ───────────────────

function switchClass(classId) {
  const cfg = CLASS_CFG[classId];
  if (!cfg) return;

  localStorage.setItem('selectedClass', classId);
  history.replaceState(null, '', classId === 'g32' ? './' : '?class=' + classId);

  // Dropdown
  const sel = document.getElementById('class-select');
  if (sel) sel.value = classId;

  // Subtitle + title
document.title = cfg.shareTitle;

  // Render schedule table and teacher grid for the selected class
  renderScheduleTable(classId);
  renderTeacherGrid(classId);

  // Update live indicators for the switched class
  const data = _allSchedules[classId];
  if (data) {
    const week = findCurrentWeek(data.weeks);
    _activeCells = week.cells;
    const wStart = parseLocalDate(week.start);
    const wEnd   = new Date(wStart); wEnd.setDate(wStart.getDate() + 4);
    const fmt    = d => `${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]}`;
    document.getElementById('week-range').textContent =
      `${fmt(wStart)} – ${fmt(wEnd)} ${wEnd.getFullYear()}`;
  } else {
    _activeCells = SCHEDULE_DATA[classId];
  }
  updateLive(_activeCells);
  updateLessonTimer(_activeCells);
}

// ── Install modal ──────────────────────────────────────────

function setupInstallModal() {
  const overlay = document.getElementById('install-modal');
  const openBtn = document.getElementById('install-help-btn');
  const closeBtn = document.getElementById('install-modal-close');
  if (!overlay || !openBtn) return;

  const open  = () => { overlay.hidden = false; document.body.style.overflow = 'hidden'; };
  const close = () => { overlay.hidden = true;  document.body.style.overflow = ''; };

  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });
}

// ── Bootstrap ──────────────────────────────────────────────

async function init() {
  initDarkMode();
  registerSW();
  trackVisit();

  // Resolve effective class (guard against stale localStorage values)
  const effectiveClassId = SCHEDULE_DATA[CLASS_ID] ? CLASS_ID : 'g32';

  // Wire dropdown + sync its value before anything async
  const sel = document.getElementById('class-select');
  if (sel) {
    sel.value = effectiveClassId;
    sel.addEventListener('change', () => switchClass(sel.value));
  }

  // Render the schedule table immediately from hardcoded data (no fetch needed)
  renderScheduleTable(effectiveClassId);
  setupTodayToggle();

  // Load both schedules + links in parallel (for clickable links + live indicators)
  let links, sched32, sched34;
  try {
    const [lr, s2r, s4r] = await Promise.all([
      fetch('./links.json'),
      fetch('./schedule.json'),
      fetch('./schedule-g4.json')
    ]);
    if (!lr.ok || !s2r.ok) throw new Error();
    [links, sched32] = await Promise.all([lr.json(), s2r.json()]);
    if (s4r.ok) sched34 = await s4r.json();
  } catch {
    document.getElementById('teachers-grid').innerHTML =
      '<p style="color:#c00;text-align:center">שגיאה בטעינת הנתונים.</p>';
    return;
  }

  _allSchedules.g32 = sched32;
  if (sched34) _allSchedules.g4 = sched34;
  _links = links;

  // Re-render with clickable links + update subtitle/title/week-range/pills
  switchClass(effectiveClassId);

  // Live indicator intervals — always read from _activeCells (updated by switchClass)
  setInterval(() => { if (_activeCells) updateLive(_activeCells); }, 60_000);
  setInterval(() => { if (_activeCells) updateLessonTimer(_activeCells); }, 1_000);

  // Notifications use initial class (re-scheduling on switch would double-fire)
  setupNotifications(_activeCells || findCurrentWeek(sched32.weeks).cells);
  setupShare();
  setupInstallBanner();
  setupInstallModal();
}

document.addEventListener('DOMContentLoaded', init);
