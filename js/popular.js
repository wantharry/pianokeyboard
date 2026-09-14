// The 10 most useful chords for playing along with popular music. Each
// chord's OWN letter plays it (G chord -> G key, C chord -> C key, etc).
// Two chords share some root letters (G/G7, D/Dm, Em/E, Am/A) — the more
// popular one of the pair gets the plain key, the other is Shift+key.
const LETTER_CHORDS = [
  { code: 'KeyG', letter: 'G', primary: { root: 'G', quality: 'maj', name: 'G' }, shift: { root: 'G', quality: 'dom7', name: 'G7' } },
  { code: 'KeyC', letter: 'C', primary: { root: 'C', quality: 'maj', name: 'C' }, shift: null },
  { code: 'KeyD', letter: 'D', primary: { root: 'D', quality: 'maj', name: 'D' }, shift: { root: 'D', quality: 'min', name: 'Dm' } },
  { code: 'KeyE', letter: 'E', primary: { root: 'E', quality: 'min', name: 'Em' }, shift: { root: 'E', quality: 'maj', name: 'E' } },
  { code: 'KeyA', letter: 'A', primary: { root: 'A', quality: 'min', name: 'Am' }, shift: { root: 'A', quality: 'maj', name: 'A' } },
  { code: 'KeyF', letter: 'F', primary: { root: 'F', quality: 'maj', name: 'F' }, shift: null },
];

const CHORD_BY_CODE = {};
LETTER_CHORDS.forEach(c => { CHORD_BY_CODE[c.code] = c; });

// name -> { code, needsShift, root, quality } for every one of the 10 chords.
const CHORD_INDEX = {};
LETTER_CHORDS.forEach(c => {
  CHORD_INDEX[c.primary.name] = { code: c.code, needsShift: false, ...c.primary };
  if (c.shift) CHORD_INDEX[c.shift.name] = { code: c.code, needsShift: true, ...c.shift };
});

// Simplified practice progressions (not exact transcriptions) — one loop of
// the core pattern, repeated to fill 8 bars, at a reasonable practice tempo.
// `melody` is an optional decorative arpeggio (chord tones, one octave up)
// layered on top of the sustained chords — NOT a transcription of the real
// vocal/instrumental melody, just a lightweight top line so it sounds fuller
// than bare block chords.
const SONG_EXAMPLES = [
  { title: 'Let It Be', bpm: 76, sequence: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'], melody: true },
  { title: "Knockin' on Heaven's Door", bpm: 72, sequence: ['G', 'D', 'Am', 'Am', 'G', 'D', 'C', 'C'], melody: true },
  { title: 'Take Me Home, Country Roads', bpm: 90, sequence: ['G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'D'], melody: true },
  { title: 'Ring of Fire', bpm: 148, sequence: ['G', 'G', 'C', 'C', 'G', 'G', 'D', 'D'], melody: true },
  { title: 'Brown Eyed Girl', bpm: 148, sequence: ['G', 'C', 'G', 'D', 'G', 'C', 'G', 'D'], melody: true },
];
const BEATS_PER_CHORD = 4;

let activePlayback = null;
let baseOctave = 4;
let refVolume = -6;
const held = new Map(); // code -> full note names currently sounding

function labelFor(code) {
  return KEY_LABELS[code] || code.replace('Key', '');
}

function chordNotesFor(chordDef, octave = baseOctave) {
  return buildChordByRootQuality(chordDef.root, chordDef.quality, octave);
}

function renderGrid() {
  const grid = document.getElementById('popular-grid');
  grid.innerHTML = '';
  LETTER_CHORDS.forEach(entry => {
    const notes = chordNotesFor(entry.primary);
    const pad = document.createElement('div');
    pad.className = 'chord-pad popular-pad';
    pad.dataset.code = entry.code;
    const shiftHtml = entry.shift
      ? `<div class="chord-shift-hint">⇧ Shift = ${entry.shift.name}</div>`
      : '';
    pad.innerHTML = `
      <div class="chord-key">${entry.letter}</div>
      <div class="chord-name-big">${entry.primary.name}</div>
      <div class="chord-notes-small">${notes.map(n => n.note + n.octave).join(' - ')}</div>
      ${shiftHtml}`;
    grid.appendChild(pad);
  });
  document.getElementById('octave-display').textContent = `C${baseOctave}`;
}

function renderExamples() {
  const listEl = document.getElementById('song-examples-list');
  listEl.innerHTML = '';

  SONG_EXAMPLES.forEach((song, songIdx) => {
    const row = document.createElement('div');
    row.className = 'example-row';

    const uniqueChords = [...new Set(song.sequence)];
    const summaryChips = uniqueChords.map(name => {
      const info = CHORD_INDEX[name];
      const keyLabel = (info.needsShift ? '⇧' : '') + labelFor(info.code);
      return `<span class="example-chord">${name}<span class="example-key">${keyLabel}</span></span>`;
    }).join('');

    const sheet = document.createElement('div');
    sheet.className = 'song-sheet example-sheet';
    song.sequence.forEach(name => {
      const info = CHORD_INDEX[name];
      const keyLabel = (info.needsShift ? '⇧' : '') + labelFor(info.code);
      const chip = document.createElement('div');
      chip.className = 'note-chip';
      chip.innerHTML = `<div class="chip-key">${keyLabel}</div><div class="chip-sub">${name}</div>`;
      sheet.appendChild(chip);
    });

    const timerBar = document.createElement('div');
    timerBar.className = 'timer-bar-track';
    timerBar.innerHTML = '<div class="timer-bar-fill"></div>';

    row.innerHTML = `
      <div class="example-top">
        <span class="example-title">${song.title}</span>
        <span class="example-chords">${summaryChips}</span>
        <button class="btn btn-accent play-song-btn" data-idx="${songIdx}">▶ Play (${song.bpm} BPM)</button>
      </div>`;
    row.appendChild(timerBar);
    row.appendChild(sheet);

    row.querySelector('.play-song-btn').addEventListener('click', () => toggleSongPlayback(song, row));
    listEl.appendChild(row);
  });
}

function stopActivePlayback() {
  if (!activePlayback) return;
  activePlayback.timeouts.forEach(clearTimeout);
  activePlayback.row.querySelectorAll('.note-chip.current').forEach(c => c.classList.remove('current'));
  activePlayback.row.classList.remove('playing-row');
  activePlayback.btn.textContent = activePlayback.originalLabel;
  activePlayback = null;
}

// One bar's worth of arpeggio hits (root-3rd-5th-3rd) played an octave above
// the chord, on the offbeat subdivisions, so it sits above the sustained pad.
function playMelodyArpeggio(chordDef, secondsPerChord) {
  const notes = chordNotesFor(chordDef, baseOctave + 1);
  const pattern = [notes[0], notes[1] || notes[0], notes[2] || notes[0], notes[1] || notes[0]];
  const step = secondsPerChord / 4;
  pattern.forEach((n, i) => {
    setTimeout(() => playNoteFor(noteFullName(n.note, n.octave), step * 0.85), i * step * 1000);
  });
}

function toggleSongPlayback(song, row) {
  const btn = row.querySelector('.play-song-btn');
  const wasThisSong = activePlayback && activePlayback.row === row;
  stopActivePlayback();
  if (wasThisSong) return;

  Tone.start();
  const secondsPerChord = (60 / song.bpm) * BEATS_PER_CHORD;
  const chips = row.querySelectorAll('.note-chip');
  const fillEl = row.querySelector('.timer-bar-fill');
  const timeouts = [];
  row.classList.add('playing-row');
  btn.textContent = '■ Stop';

  song.sequence.forEach((name, i) => {
    const t = setTimeout(() => {
      chips.forEach(c => c.classList.remove('current'));
      chips[i].classList.add('current');
      chips[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

      const chordDef = CHORD_INDEX[name];
      chordNotesFor(chordDef).forEach(n => playNoteFor(noteFullName(n.note, n.octave), secondsPerChord * 0.9));
      if (song.melody) playMelodyArpeggio(chordDef, secondsPerChord);

      fillEl.style.transition = 'none';
      fillEl.style.width = '100%';
      requestAnimationFrame(() => {
        fillEl.style.transition = `width ${secondsPerChord}s linear`;
        fillEl.style.width = '0%';
      });

      if (i === song.sequence.length - 1) {
        timeouts.push(setTimeout(stopActivePlayback, secondsPerChord * 1000));
      }
    }, i * secondsPerChord * 1000);
    timeouts.push(t);
  });

  activePlayback = { timeouts, row, btn, originalLabel: `▶ Play (${song.bpm} BPM)` };
}

function playPad(code, useShift) {
  const entry = CHORD_BY_CODE[code];
  if (!entry || held.has(code)) return;
  const chordDef = (useShift && entry.shift) ? entry.shift : entry.primary;
  const fullNames = chordNotesFor(chordDef).map(n => noteFullName(n.note, n.octave));
  fullNames.forEach(fn => playNote(fn));
  held.set(code, fullNames);
  const pad = document.querySelector(`.popular-pad[data-code="${code}"]`);
  if (pad) pad.classList.add('active');
}

function releasePad(code) {
  const fullNames = held.get(code);
  held.delete(code);
  if (fullNames) fullNames.forEach(releaseNote);
  const pad = document.querySelector(`.popular-pad[data-code="${code}"]`);
  if (pad) pad.classList.remove('active');
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (document.activeElement && ['INPUT', 'SELECT'].includes(document.activeElement.tagName)) return;
  if (e.code === 'BracketLeft') { shiftOctave(-1); return; }
  if (e.code === 'BracketRight') { shiftOctave(1); return; }
  if (!CHORD_BY_CODE[e.code]) return;
  e.preventDefault();
  Tone.start();
  playPad(e.code, e.shiftKey);
});
window.addEventListener('keyup', (e) => {
  if (!CHORD_BY_CODE[e.code]) return;
  releasePad(e.code);
});

document.getElementById('popular-grid').addEventListener('pointerdown', (e) => {
  const pad = e.target.closest('.popular-pad');
  if (!pad) return;
  Tone.start();
  playPad(pad.dataset.code, e.shiftKey);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(evt => {
  document.getElementById('popular-grid').addEventListener(evt, (e) => {
    const pad = e.target.closest('.popular-pad');
    if (!pad) return;
    releasePad(pad.dataset.code);
  });
});

function shiftOctave(delta) {
  baseOctave = Math.max(1, Math.min(6, baseOctave + delta));
  renderGrid();
}

document.getElementById('octave-down').addEventListener('click', () => shiftOctave(-1));
document.getElementById('octave-up').addEventListener('click', () => shiftOctave(1));
document.getElementById('volume').addEventListener('input', (e) => {
  refVolume = Number(e.target.value);
  setVolume(refVolume);
});
document.getElementById('start-btn').addEventListener('click', async () => {
  await Tone.start();
  document.getElementById('loading-overlay').classList.add('hidden');
});

renderGrid();
renderExamples();
initAudio(() => {
  document.getElementById('loading-text').classList.add('hidden');
  const startBtn = document.getElementById('start-btn');
  startBtn.disabled = false;
  startBtn.textContent = 'Click to Start Playing';
});
setVolume(refVolume);
