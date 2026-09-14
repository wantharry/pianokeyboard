// Maps physical keyboard keys to piano notes, laid out like a real keyboard:
// bottom letter row = white keys of the lower octave, row above = its black keys,
// QWERTY row = white keys of the upper octave, number row = its black keys.
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
  { code: 'Comma', note: 'C', black: false, oct: 1 },
  { code: 'KeyL', note: 'C#', black: true, oct: 1 },
  { code: 'Period', note: 'D', black: false, oct: 1 },
  { code: 'Semicolon', note: 'D#', black: true, oct: 1 },
  { code: 'Slash', note: 'E', black: false, oct: 1 },

  { code: 'KeyQ', note: 'C', black: false, oct: 1, upper: true },
  { code: 'Digit2', note: 'C#', black: true, oct: 1, upper: true },
  { code: 'KeyW', note: 'D', black: false, oct: 1, upper: true },
  { code: 'Digit3', note: 'D#', black: true, oct: 1, upper: true },
  { code: 'KeyE', note: 'E', black: false, oct: 1, upper: true },
  { code: 'KeyR', note: 'F', black: false, oct: 1, upper: true },
  { code: 'Digit5', note: 'F#', black: true, oct: 1, upper: true },
  { code: 'KeyT', note: 'G', black: false, oct: 1, upper: true },
  { code: 'Digit6', note: 'G#', black: true, oct: 1, upper: true },
  { code: 'KeyY', note: 'A', black: false, oct: 1, upper: true },
  { code: 'Digit7', note: 'A#', black: true, oct: 1, upper: true },
  { code: 'KeyU', note: 'B', black: false, oct: 1, upper: true },
  { code: 'KeyI', note: 'C', black: false, oct: 2, upper: true },
  { code: 'Digit9', note: 'C#', black: true, oct: 2, upper: true },
  { code: 'KeyO', note: 'D', black: false, oct: 2, upper: true },
  { code: 'Digit0', note: 'D#', black: true, oct: 2, upper: true },
  { code: 'KeyP', note: 'E', black: false, oct: 2, upper: true },
];

// Human-readable label for each physical key, used everywhere in the UI/song sheets.
const KEY_LABELS = {
  KeyZ: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyB: 'B', KeyN: 'N', KeyM: 'M',
  Comma: ',', Period: '.', Slash: '/',
  KeyS: 'S', KeyD: 'D', KeyG: 'G', KeyH: 'H', KeyJ: 'J', KeyL: 'L', Semicolon: ';',
  KeyQ: 'Q', KeyW: 'W', KeyE: 'E', KeyR: 'R', KeyT: 'T', KeyY: 'Y', KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P',
  Digit2: '2', Digit3: '3', Digit5: '5', Digit6: '6', Digit7: '7', Digit9: '9', Digit0: '0',
  BracketLeft: '[', BracketRight: ']',
};

const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function keyIndex(note) {
  return CHROMATIC.indexOf(note);
}

// Build lookup: keyboard code -> { note, midiOffsetFromC4base } and reverse: note+baseOctave -> code
const CODE_TO_KEY = {};
KEY_LAYOUT.forEach(k => { CODE_TO_KEY[k.code] = k; });
