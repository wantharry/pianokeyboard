// Renders the standalone "All Chords" reference page: every quality in
// CHORD_QUALITY_LIST, built on every root in CHROMATIC, with the note names
// and the keyboard letters that play each one. The page has its own audio
// engine so both clicking a chord and playing the listed keys make sound.

let refBaseOctave = 4;
let refVolume = -6;
let playQuality = 'maj';
const pressedCodes = new Map(); // code -> array of full note names currently sounding

const PLAY_QUALITY_OPTIONS = [
  { key: 'note', label: 'Just the Note (no chord)' },
  ...CHORD_QUALITY_LIST.map(q => ({ key: q.key, label: q.name })),
];

function keyForNoteOctave(note, absOctave, baseOctave) {
  const relOct = absOctave - baseOctave;
  const entry = KEY_LAYOUT.find(k => k.note === note && k.oct === relOct);
  return entry ? { label: KEY_LABELS[entry.code], code: entry.code } : null;
}

function populateQualitySelect() {
  const sel = document.getElementById('quality-select');
  sel.innerHTML = PLAY_QUALITY_OPTIONS.map(o => `<option value="${o.key}">${o.label}</option>`).join('');
  sel.value = playQuality;
  sel.addEventListener('change', (e) => { playQuality = e.target.value; });
}

function renderLegend() {
  const legendEl = document.getElementById('legend');
  legendEl.innerHTML = '';
  CHORD_QUALITY_LIST.forEach(q => {
    const formula = CHORD_INTERVALS[q.key].join('-');
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="legend-name">${q.name}</span><span class="legend-formula">${formula}</span>`;
    legendEl.appendChild(item);
  });
}

function playChordNotes(notes, seconds = 1.2) {
  notes.forEach(n => playNoteFor(noteFullName(n.note, n.octave), seconds));
}

function renderChordCards() {
  const container = document.getElementById('chord-cards');
  container.innerHTML = '';
  document.getElementById('octave-display').textContent = `C${refBaseOctave}`;

  ROOT_NOTE_OPTIONS.forEach(root => {
    const card = document.createElement('div');
    card.className = 'panel chord-card';
    const rowsEl = document.createElement('div');
    rowsEl.className = 'chord-rows';

    CHORD_QUALITY_LIST.forEach(q => {
      const notes = buildChordByRootQuality(root, q.key, refBaseOctave);
      const noteLabels = notes.map(n => `${n.note}${n.octave}`).join(' - ');
      const resolved = notes.map(n => keyForNoteOctave(n.note, n.octave, refBaseOctave));
      const allPlayable = resolved.every(Boolean);
      const keysHtml = allPlayable
        ? resolved.map(r => `<span class="key-chip">${r.label}</span>`).join('')
        : '<span class="key-chip out-of-range">shift octave</span>';

      const row = document.createElement('div');
      row.className = 'chord-row';
      row.id = `chordrow-${root}-${q.key}`;
      row.title = 'Click to hear this chord';
      row.innerHTML = `
        <div class="chord-row-name">${root}${q.suffix || ''}<span class="chord-row-quality">${q.name}</span></div>
        <div class="chord-row-notes">${noteLabels}</div>
        <div class="chord-row-keys">${keysHtml}</div>`;

      row.addEventListener('click', () => {
        playChordNotes(notes);
        row.classList.add('playing');
        setTimeout(() => row.classList.remove('playing'), 300);
      });

      rowsEl.appendChild(row);
    });

    card.innerHTML = `<h2 class="chord-card-title">${root}</h2>`;
    card.appendChild(rowsEl);
    container.appendChild(card);
  });
}

// ===================== Live keyboard playing =====================
// Every key plays a whole chord (root = that key's note, quality = the
// dropdown above) unless "Just the Note" is selected.
function highlightRow(root, qualityKey, on) {
  if (qualityKey === 'note') return;
  const row = document.getElementById(`chordrow-${root}-${qualityKey}`);
  if (!row) return;
  row.classList.toggle('playing', on);
  if (on) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (document.activeElement && ['INPUT', 'SELECT'].includes(document.activeElement.tagName)) return;

  if (e.code === 'BracketLeft') { shiftRefOctave(-1); return; }
  if (e.code === 'BracketRight') { shiftRefOctave(1); return; }

  const entry = CODE_TO_KEY[e.code];
  if (!entry) return;
  e.preventDefault();
  Tone.start();
  if (pressedCodes.has(e.code)) return;

  const rootOctave = refBaseOctave + entry.oct;
  const notes = playQuality === 'note'
    ? [{ note: entry.note, octave: rootOctave }]
    : buildChordByRootQuality(entry.note, playQuality, rootOctave);
  const fullNames = notes.map(n => noteFullName(n.note, n.octave));
  fullNames.forEach(fn => playNote(fn));
  pressedCodes.set(e.code, fullNames);
  highlightRow(entry.note, playQuality, true);
});

window.addEventListener('keyup', (e) => {
  const fullNames = pressedCodes.get(e.code);
  pressedCodes.delete(e.code);
  const entry = CODE_TO_KEY[e.code];
  if (!entry || !fullNames) return;
  fullNames.forEach(releaseNote);
  highlightRow(entry.note, playQuality, false);
});

function shiftRefOctave(delta) {
  refBaseOctave = Math.max(1, Math.min(6, refBaseOctave + delta));
  renderChordCards();
}

document.getElementById('octave-down').addEventListener('click', () => shiftRefOctave(-1));
document.getElementById('octave-up').addEventListener('click', () => shiftRefOctave(1));
document.getElementById('volume').addEventListener('input', (e) => {
  refVolume = Number(e.target.value);
  setVolume(refVolume);
});
document.getElementById('start-btn').addEventListener('click', async () => {
  await Tone.start();
  document.getElementById('loading-overlay').classList.add('hidden');
});

// ===================== Init =====================
populateQualitySelect();
renderLegend();
renderChordCards();
initAudio(() => {
  document.getElementById('loading-text').classList.add('hidden');
  const startBtn = document.getElementById('start-btn');
  startBtn.disabled = false;
  startBtn.textContent = 'Click to Start Playing';
});
setVolume(refVolume);
