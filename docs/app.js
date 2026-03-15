const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

// Schedule data parsed from the weekly image
// days: ראשון=0 … חמישי=4  |  cells[timeIdx][dayIdx]
const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי'];
const TIMES = ['10:00','10:30','11:00','12:00','13:00'];

// teacher: exact key from links.json | task:true = independent assignment | null = empty
const CELLS = [
  // ── 10:00 ──────────────────────────────────────────────────────────
  [
    { subject: 'רגשי',      teacher: 'רפית טסה'  },
    { subject: 'מתמטיקה',   teacher: 'רפית טסה'  },
    { subject: 'רגשי',      teacher: 'רפית טסה'  },
    { subject: 'שפה',       teacher: 'אילת יוסף' },
    { subject: 'רגשי',      teacher: 'רפית טסה'  },
  ],
  // ── 10:30 ──────────────────────────────────────────────────────────
  [
    { subject: 'מתמטיקה',         teacher: 'רפית טסה'  },
    { subject: 'אומנות / אנגלית', task: true            },
    { subject: 'מתמטיקה',         teacher: 'רפית טסה'  },
    { subject: 'מדעים אופק',      task: true            },
    { subject: 'שפה / מתמטיקה',   task: true            },
  ],
  // ── 11:00 ──────────────────────────────────────────────────────────
  [
    { subject: 'מתמטיקה',   task: true             },
    { subject: 'שפה',        teacher: 'אילת יוסף'  },
    { subject: 'שפה / ספורט', task: true            },
    { subject: 'מדעים',      teacher: 'רפית טסה'   },
    { subject: 'ספורט',      teacher: 'נתנאל מדעי' },
  ],
  // ── 12:00 ──────────────────────────────────────────────────────────
  [
    { subject: 'ספורט',         teacher: 'אוראל עטייה'     },
    { subject: 'מיינדפולנס',    teacher: 'הגר מיינדפולנס'  },
    { subject: 'מוסיקה',        teacher: 'סופייה משייב'    },
    { subject: 'אנגלית',        teacher: 'כלנית רז שטראוס' },
    { subject: 'אומנות שכבתי', teacher: 'רווית מזרחי'     },
  ],
  // ── 13:00 ──────────────────────────────────────────────────────────
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

  // Header row
  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  // Time column header (empty corner)
  const cornerTh = document.createElement('th');
  cornerTh.className = 'tt-corner';
  headerRow.appendChild(cornerTh);
  for (const day of DAYS) {
    const th = document.createElement('th');
    th.className = 'tt-day-header';
    th.textContent = day;
    headerRow.appendChild(th);
  }

  // Body rows
  const tbody = table.createTBody();
  CELLS.forEach((row, timeIdx) => {
    const tr = tbody.insertRow();
    // Time label cell
    const timeTd = document.createElement('td');
    timeTd.className = 'tt-time';
    timeTd.textContent = TIMES[timeIdx];
    tr.appendChild(timeTd);

    row.forEach((cell) => {
      const td = document.createElement('td');
      td.className = 'tt-cell';

      if (!cell) {
        td.classList.add('tt-empty');
        tr.appendChild(td);
        return;
      }

      if (cell.task) {
        td.classList.add('tt-task');
        td.innerHTML = `<span class="tt-task-label">משימה</span><span class="tt-subject">${cell.subject}</span>`;
        tr.appendChild(td);
        return;
      }

      // Zoom / Meet lesson
      const url = links[cell.teacher];
      const { cls, icon } = url ? classifyLink(url) : { cls: 'zoom', icon: '🎥' };
      td.classList.add('tt-lesson', `tt-${cls}`);

      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'tt-link';
        a.innerHTML = `<span class="tt-icon">${icon}</span><span class="tt-teacher">${cell.teacher.split(' ')[0]}</span><span class="tt-subject">${cell.subject}</span>`;
        td.appendChild(a);
      } else {
        td.innerHTML = `<span class="tt-icon">${icon}</span><span class="tt-teacher">${cell.teacher.split(' ')[0]}</span><span class="tt-subject">${cell.subject}</span>`;
      }

      tr.appendChild(td);
    });
  });
}

async function init() {
  document.getElementById('week-range').textContent = currentWeekRange();

  let links;
  try {
    const res = await fetch('links.json');
    if (!res.ok) throw new Error();
    links = await res.json();
  } catch {
    document.getElementById('teachers-grid').innerHTML = '<p style="color:#c00;text-align:center">שגיאה בטעינת הקישורים.</p>';
    return;
  }

  renderTimetable(links);

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
