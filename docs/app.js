const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

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

async function init() {
  document.getElementById('week-range').textContent = currentWeekRange();

  const img = document.getElementById('schedule-img');
  const placeholder = document.getElementById('schedule-placeholder');
  img.onload  = () => { placeholder.style.display = 'none'; img.style.display = 'block'; };
  img.onerror = () => { img.style.display = 'none'; placeholder.style.display = 'flex'; };
  img.src = 'schedule.jpg';

  let links;
  try {
    const res = await fetch('links.json');
    if (!res.ok) throw new Error();
    links = await res.json();
  } catch {
    document.getElementById('teachers-grid').innerHTML = '<p style="color:#c00;text-align:center">שגיאה בטעינת הקישורים.</p>';
    return;
  }

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
