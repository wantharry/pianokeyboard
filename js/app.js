// ===================== State =====================
const state = {
  baseOctave: 4,        // KeyZ currently plays C<baseOctave>
  chordMode: false,
  seventh: false,
  rootNote: 'C',
  isMinor: false,
  volume: -6,
  activeCodes: new Map(),   // code -> [note names currently sounding for that code]
  song: null,
  songIndex: 0,
  songScore: { hit: 0, missed: 0 },
  demoPlaying: false,
  demoTimeouts: [],
};

// ===================== Audio =====================
const SAMPLE_NOTES = ['A0','C1','Ds1','Fs1','A1','C2','Ds2','Fs2','A2','C3','Ds3','Fs3','A3',
  'C4','Ds4','Fs4','A4','C5','Ds5','Fs5','A5','C6','Ds6','Fs6','A6','C7','Ds7','Fs7','A7','C8'];

function toToneName(sampleName) {
  return sampleName.replace('s', '#');
}

const sampleUrls = {};
SAMPLE_NOTES.forEach(s => { sampleUrls[toToneName(s)] = s + '.mp3'; });

let sampler = null;
let loaded = false;

function initAudio() {
  if (sampler) return;
  const startBtn = document.getElementById('start-btn');
  const loadingText = document.getElementById('loading-text');
  sampler = new Tone.Sampler({
    urls: sampleUrls,
    baseUrl: 'sounds/piano/',
    onload: () => {
      loaded = true;
      loadingText.classList.add('hidden');
      startBtn.disabled = false;
      startBtn.textContent = 'Click to Start Playing';
    },
  }).toDestination();
  sampler.volume.value = state.volume;
}

function noteFullName(note, octave) {
  return `${note}${octave}`;
}

function playNote(fullName, velocity = 0.9) {
  if (!loaded) return;
  sampler.triggerAttack(fullName, undefined, velocity);
}
function releaseNote(fullName) {
  if (!loaded) return;
  sampler.triggerRelease(fullName);
}
function playNoteFor(fullName, seconds) {
  if (!loaded) return;
  sampler.triggerAttackRelease(fullName, seconds);
}

// ===================== Note <-> keyboard resolution =====================
// Find which physical key currently plays a given absolute note+octave,
// preferring the lower "extension" keys (Comma..Slash) over QWERTY duplicates.
function noteOctaveToKeyEntry(note, absOctave) {
  const relOct = absOctave - state.baseOctave;
  const candidates = KEY_LAYOUT.filter(k => k.note === note && k.oct === relOct);
  if (candidates.length === 0) return null;
  const nonUpper = candidates.find(k => !k.upper);
  return nonUpper || candidates[0];
}

// ===================== Building the visual keyboard =====================
const pianoEl = document.getElementById('piano');
// sort by real semitone position (oct*12 + chromatic index); upper-row duplicates share the
// same oct value as their lower-row counterpart, so they collapse to one visual key below.
function semitonePos(k) { return k.oct * 12 + CHROMATIC.indexOf(k.note); }

function buildKeyboard() {
  pianoEl.innerHTML = '';
  const seenWhite = new Set();
  const whites = [];
  KEY_LAYOUT.filter(k => !k.black).forEach(k => {
    const pos = semitonePos(k);
    if (seenWhite.has(pos)) return;
    seenWhite.add(pos);
    whites.push(k);
  });
  whites.sort((a,b) => semitonePos(a) - semitonePos(b));

  const seenBlack = new Set();
  const blacks = [];
  KEY_LAYOUT.filter(k => k.black).forEach(k => {
    const pos = semitonePos(k);
    if (seenBlack.has(pos)) return;
    seenBlack.add(pos);
    blacks.push(k);
  });
  blacks.sort((a,b) => semitonePos(a) - semitonePos(b));

  const whiteWidth = 56;
  whites.forEach((k, i) => {
    const el = document.createElement('div');
    el.className = 'key white';
    el.dataset.code = k.code;
    el.style.left = (i * whiteWidth) + 'px';
    el.innerHTML = `<span class="klabel">${KEY_LABELS[k.code]}</span><span class="nlabel">${k.note}${state.baseOctave + k.oct}</span>`;
    pianoEl.appendChild(el);
  });

  // position black keys relative to the white key they sit between
  blacks.forEach(k => {
    const pos = semitonePos(k);
    // find index of nearest lower white key
    let idx = 0;
    for (let i = 0; i < whites.length; i++) {
      if (semitonePos(whites[i]) < pos) idx = i; else break;
    }
    const el = document.createElement('div');
    el.className = 'key black';
    el.dataset.code = k.code;
    el.style.left = (idx * whiteWidth + whiteWidth * 0.68) + 'px';
    el.innerHTML = `<span class="klabel">${KEY_LABELS[k.code]}</span><span class="nlabel">${k.note}${state.baseOctave + k.oct}</span>`;
    pianoEl.appendChild(el);
  });

  pianoEl.style.width = (whites.length * whiteWidth + 40) + 'px';
}

function highlightKey(code, on, cls = 'active') {
  const el = pianoEl.querySelector(`[data-code="${CSS.escape(code)}"]`);
  if (el) el.classList.toggle(cls, on);
}

// ===================== Chord panel =====================
const chordPanelEl = document.getElementById('chord-panel');
function renderChordPanel() {
  chordPanelEl.innerHTML = '';
  const degrees = getScaleDegrees(state.rootNote, state.isMinor);
  const roman = state.isMinor ? ROMAN_MINOR : ROMAN_MAJOR;
  degrees.forEach((d, i) => {
    const pad = document.createElement('div');
    pad.className = 'chord-pad';
    pad.dataset.code = CHORD_DEGREE_CODES[i];
    const qualityLabel = d.quality === 'maj' ? '' : d.quality === 'min' ? 'm' : '°';
    pad.innerHTML = `
      <div class="chord-key">${KEY_LABELS[CHORD_DEGREE_CODES[i]]}</div>
      <div class="chord-roman">${roman[i]}</div>
      <div class="chord-name">${d.note}${qualityLabel}</div>`;
    chordPanelEl.appendChild(pad);
  });
}
function highlightChordPad(code, on) {
  const el = chordPanelEl.querySelector(`[data-code="${CSS.escape(code)}"]`);
  if (el) el.classList.toggle('active', on);
}

// ===================== Keyboard input handling =====================
const pressedCodes = new Set();

function handleNoteDown(entry, code) {
  const fullName = noteFullName(entry.note, state.baseOctave + entry.oct);
  const isChordTrigger = state.chordMode && !entry.black && entry.oct === 0 && CHORD_DEGREE_CODES.includes(code);

  if (isChordTrigger) {
    const degreeIndex = CHORD_DEGREE_CODES.indexOf(code);
    const { notes, degree } = buildChordNotes(state.rootNote, state.isMinor, degreeIndex, state.baseOctave, state.seventh);
    const fullNames = notes.map(nt => noteFullName(nt.note, nt.octave));
    fullNames.forEach(fn => playNote(fn));
    state.activeCodes.set(code, fullNames);
    highlightChordPad(code, true);
    checkSongProgress({ type: 'chord', degree });
  } else {
    playNote(fullName);
    state.activeCodes.set(code, [fullName]);
    checkSongProgress({ type: 'note', note: entry.note, octave: state.baseOctave + entry.oct });
  }
  highlightKey(code, true);
}

function handleNoteUp(code) {
  const names = state.activeCodes.get(code);
  if (names) names.forEach(releaseNote);
  state.activeCodes.delete(code);
  highlightKey(code, false);
  highlightChordPad(code, false);
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (document.activeElement && ['INPUT','SELECT'].includes(document.activeElement.tagName)) return;

  if (e.code === 'BracketLeft') { shiftOctave(-1); return; }
  if (e.code === 'BracketRight') { shiftOctave(1); return; }
  if (e.code === 'Tab') { e.preventDefault(); toggleChordMode(); return; }

  const entry = CODE_TO_KEY[e.code];
  if (!entry) return;
  e.preventDefault();
  Tone.start();
  if (pressedCodes.has(e.code)) return;
  pressedCodes.add(e.code);
  if (e.shiftKey) state.seventh = true;
  handleNoteDown(entry, e.code);
});

window.addEventListener('keyup', (e) => {
  pressedCodes.delete(e.code);
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.seventh = false;
  const entry = CODE_TO_KEY[e.code];
  if (!entry) return;
  handleNoteUp(e.code);
});

// mouse / touch support on the visual keyboard
pianoEl.addEventListener('pointerdown', (e) => {
  const keyEl = e.target.closest('.key');
  if (!keyEl) return;
  Tone.start();
  const code = keyEl.dataset.code;
  const entry = CODE_TO_KEY[code];
  if (!entry || pressedCodes.has(code)) return;
  pressedCodes.add(code);
  handleNoteDown(entry, code);
});
['pointerup','pointerleave','pointercancel'].forEach(evt => {
  pianoEl.addEventListener(evt, (e) => {
    const keyEl = e.target.closest('.key');
    if (!keyEl) return;
    const code = keyEl.dataset.code;
    pressedCodes.delete(code);
    handleNoteUp(code);
  });
});
chordPanelEl.addEventListener('pointerdown', (e) => {
  const pad = e.target.closest('.chord-pad');
  if (!pad) return;
  Tone.start();
  const code = pad.dataset.code;
  const entry = CODE_TO_KEY[code];
  if (!entry || pressedCodes.has(code)) return;
  pressedCodes.add(code);
  handleNoteDown(entry, code);
});
['pointerup','pointerleave','pointercancel'].forEach(evt => {
  chordPanelEl.addEventListener(evt, (e) => {
    const pad = e.target.closest('.chord-pad');
    if (!pad) return;
    const code = pad.dataset.code;
    pressedCodes.delete(code);
    handleNoteUp(code);
  });
});

function shiftOctave(delta) {
  state.baseOctave = Math.max(1, Math.min(6, state.baseOctave + delta));
  document.getElementById('octave-display').textContent = `C${state.baseOctave}`;
  buildKeyboard();
}

function toggleChordMode(force) {
  state.chordMode = force !== undefined ? force : !state.chordMode;
  document.getElementById('chord-toggle').checked = state.chordMode;
  document.getElementById('chord-panel-wrap').classList.toggle('hidden', !state.chordMode);
}

// ===================== Controls wiring =====================
document.getElementById('chord-toggle').addEventListener('change', (e) => toggleChordMode(e.target.checked));
document.getElementById('octave-down').addEventListener('click', () => shiftOctave(-1));
document.getElementById('octave-up').addEventListener('click', () => shiftOctave(1));
document.getElementById('volume').addEventListener('input', (e) => {
  state.volume = Number(e.target.value);
  if (sampler) sampler.volume.value = state.volume;
});
document.getElementById('root-select').addEventListener('change', (e) => {
  state.rootNote = e.target.value;
  renderChordPanel();
});
document.getElementById('scale-select').addEventListener('change', (e) => {
  state.isMinor = e.target.value === 'minor';
  renderChordPanel();
});
document.getElementById('start-btn').addEventListener('click', async () => {
  await Tone.start();
  initAudio();
  document.getElementById('loading-overlay').classList.add('hidden');
});

// ===================== Song / practice mode =====================
const songSelect = document.getElementById('song-select');
const sheetEl = document.getElementById('song-sheet');
const progressEl = document.getElementById('song-progress');
const scoreEl = document.getElementById('song-score');

SONGS.forEach(s => {
  const opt = document.createElement('option');
  opt.value = s.id; opt.textContent = s.title;
  songSelect.appendChild(opt);
});

function buildPracticeQueue(song) {
  if (song.chordOnly) {
    return song.chords.map(degree => ({ type: 'chord', degree }));
  }
  return song.melody.map(ev => ({ type: 'note', note: ev.note, octave: ev.octave }));
}

function loadSong(id) {
  const song = SONGS.find(s => s.id === id);
  if (!song) return;
  stopDemo();
  state.song = song;
  state.rootNote = song.key;
  state.isMinor = song.minor;
  document.getElementById('root-select').value = song.key;
  document.getElementById('scale-select').value = song.minor ? 'minor' : 'major';
  renderChordPanel();
  if (song.chordOnly) toggleChordMode(true);
  state.songIndex = 0;
  state.songScore = { hit: 0, missed: 0 };
  state.queue = buildPracticeQueue(song);
  renderSheet();
  updateScore();
}

function labelForEvent(ev) {
  if (ev.type === 'chord') {
    const roman = state.isMinor ? ROMAN_MINOR : ROMAN_MAJOR;
    const code = CHORD_DEGREE_CODES[ev.degree - 1];
    return { key: KEY_LABELS[code], sub: roman[ev.degree - 1] };
  }
  const entry = noteOctaveToKeyEntry(ev.note, ev.octave);
  return { key: entry ? KEY_LABELS[entry.code] : '?', sub: `${ev.note}${ev.octave}` };
}

function renderSheet() {
  sheetEl.innerHTML = '';
  if (!state.queue) return;
  state.queue.forEach((ev, i) => {
    const { key, sub } = labelForEvent(ev);
    const chip = document.createElement('div');
    chip.className = 'note-chip';
    if (i === state.songIndex) chip.classList.add('current');
    if (i < state.songIndex) chip.classList.add('done');
    chip.innerHTML = `<div class="chip-key">${key}</div><div class="chip-sub">${sub}</div>`;
    sheetEl.appendChild(chip);
  });
  const current = sheetEl.querySelector('.current');
  if (current) current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  progressEl.textContent = state.queue.length ? `${state.songIndex} / ${state.queue.length}` : '';
}

function updateScore() {
  scoreEl.textContent = `✓ ${state.songScore.hit}   ✗ ${state.songScore.missed}`;
}

function checkSongProgress(played) {
  if (!state.queue || state.songIndex >= state.queue.length) return;
  const expected = state.queue[state.songIndex];
  let match = false;
  if (expected.type === 'note' && played.type === 'note') {
    match = expected.note === played.note && expected.octave === played.octave;
  } else if (expected.type === 'chord' && played.type === 'chord') {
    match = expected.degree === played.degree;
  }
  const chip = sheetEl.children[state.songIndex];
  if (match) {
    state.songScore.hit++;
    state.songIndex++;
    if (chip) chip.classList.add('done');
    if (state.songIndex >= state.queue.length) {
      progressEl.textContent = `🎉 Complete! ${state.queue.length}/${state.queue.length}`;
    }
    renderSheet();
  } else {
    state.songScore.missed++;
    if (chip) {
      chip.classList.add('wrong');
      setTimeout(() => chip.classList.remove('wrong'), 250);
    }
  }
  updateScore();
}

function stopDemo() {
  state.demoTimeouts.forEach(t => clearTimeout(t));
  state.demoTimeouts = [];
  state.demoPlaying = false;
  document.getElementById('demo-btn').textContent = '▶ Demo';
}

function playDemo() {
  if (!state.song) return;
  if (state.demoPlaying) { stopDemo(); return; }
  state.demoPlaying = true;
  document.getElementById('demo-btn').textContent = '■ Stop';
  const song = state.song;
  const beatSec = 60 / song.tempo;
  let t = 0;

  if (song.chordOnly) {
    song.chords.forEach((degree, i) => {
      const timeout = setTimeout(() => {
        const { notes } = buildChordNotes(song.key, song.minor, degree - 1, state.baseOctave, false);
        notes.forEach(nt => playNoteFor(noteFullName(nt.note, nt.octave), beatSec * 1.8));
        highlightSheetIndex(i);
        if (i === song.chords.length - 1) setTimeout(stopDemo, beatSec * 1000);
      }, t * 1000);
      state.demoTimeouts.push(timeout);
      t += beatSec * 2;
    });
  } else {
    song.melody.forEach((ev, i) => {
      const dur = ev.b * beatSec;
      const timeout = setTimeout(() => {
        playNoteFor(noteFullName(ev.note, ev.octave), dur * 0.95);
        highlightSheetIndex(i);
        if (i === song.melody.length - 1) setTimeout(stopDemo, dur * 1000);
      }, t * 1000);
      state.demoTimeouts.push(timeout);
      t += dur;
    });
  }
}

function highlightSheetIndex(i) {
  Array.from(sheetEl.children).forEach((c, idx) => c.classList.toggle('current', idx === i));
  const el = sheetEl.children[i];
  if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

songSelect.addEventListener('change', (e) => loadSong(e.target.value));
document.getElementById('demo-btn').addEventListener('click', playDemo);
document.getElementById('restart-btn').addEventListener('click', () => {
  if (!state.song) return;
  state.songIndex = 0;
  state.songScore = { hit: 0, missed: 0 };
  renderSheet();
  updateScore();
});

// ===================== Init =====================
buildKeyboard();
renderChordPanel();
loadSong(SONGS[0].id);
initAudio();
