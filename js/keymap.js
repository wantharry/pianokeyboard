// Maps physical keyboard keys to piano notes. Letters only — no punctuation
// or number-row keys — so every playable note is a plain, easy-to-read letter.
// Bottom letter row = white keys of the lower octave, home row above it =
// its black keys; QWERTY row = white keys of the upper octave, and the
// leftover home-row letters (A F I K L) = its black keys.
const KEY_LAYOUT = [
  // [code, note-name-without-octave, isBlack, octaveOffset]
  { code: 'KeyZ', note: 'C', black: false, oct: 0 },
  { code: 'KeyS', note: 'C#', black: true, oct: 0 },
  { code: 'KeyX', note: 'D', black: false, oct: 0 },
  { code: 'KeyD', note: 'D#', black: true, oct: 0 },
  { code: 'KeyC', note: 'E', black: false, oct: 0 },
  { code: 'KeyV', note: 'F', black: false, oct: 0 },
  { code: 'KeyG', note: 'F#', black: true, oct: 0 },
  { code: 'KeyB', note: 'G', black: false, oct: 0 },
  { code: 'KeyH', note: 'G#', black: true, oct: 0 },
  { code: 'KeyN', note: 'A', black: false, oct: 0 },
  { code: 'KeyJ', note: 'A#', black: true, oct: 0 },
  { code: 'KeyM', note: 'B', black: false, oct: 0 },

  { code: 'KeyQ', note: 'C', black: false, oct: 1 },
  { code: 'KeyA', note: 'C#', black: true, oct: 1 },
  { code: 'KeyW', note: 'D', black: false, oct: 1 },
  { code: 'KeyF', note: 'D#', black: true, oct: 1 },
  { code: 'KeyE', note: 'E', black: false, oct: 1 },
  { code: 'KeyR', note: 'F', black: false, oct: 1 },
  { code: 'KeyI', note: 'F#', black: true, oct: 1 },
  { code: 'KeyT', note: 'G', black: false, oct: 1 },
  { code: 'KeyK', note: 'G#', black: true, oct: 1 },
  { code: 'KeyY', note: 'A', black: false, oct: 1 },
  { code: 'KeyL', note: 'A#', black: true, oct: 1 },
  { code: 'KeyU', note: 'B', black: false, oct: 1 },
];

// Human-readable label for each physical key, used everywhere in the UI/song sheets.
const KEY_LABELS = {
  KeyZ: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyB: 'B', KeyN: 'N', KeyM: 'M',
  KeyS: 'S', KeyD: 'D', KeyG: 'G', KeyH: 'H', KeyJ: 'J',
  KeyQ: 'Q', KeyW: 'W', KeyE: 'E', KeyR: 'R', KeyT: 'T', KeyY: 'Y', KeyU: 'U',
  KeyA: 'A', KeyF: 'F', KeyI: 'I', KeyK: 'K', KeyL: 'L',
  BracketLeft: '[', BracketRight: ']',
};

const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function keyIndex(note) {
  return CHROMATIC.indexOf(note);
}

// Build lookup: keyboard code -> { note, midiOffsetFromC4base } and reverse: note+baseOctave -> code
const CODE_TO_KEY = {};
KEY_LAYOUT.forEach(k => { CODE_TO_KEY[k.code] = k; });
