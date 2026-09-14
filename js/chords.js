// Chord Mode: turns the 7 white keys of the lower octave (Z X C V B N M) into
// the 7 diatonic chords of whatever key/scale is selected, so full progressions
// can be played by ear/rhythm without any music theory.

const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_STEPS = [0, 2, 3, 5, 7, 8, 10];

const MAJOR_QUALITIES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
const MINOR_QUALITIES = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];

const CHORD_INTERVALS = {
  maj:   [0, 4, 7],
  min:   [0, 3, 7],
  dim:   [0, 3, 6],
  aug:   [0, 4, 8],
  sus2:  [0, 2, 7],
  sus4:  [0, 5, 7],
  maj7:  [0, 4, 7, 11],
  min7:  [0, 3, 7, 10],
  dom7:  [0, 4, 7, 10],
  dim7:  [0, 3, 6, 9],
  m7b5:  [0, 3, 6, 10],
};

// Display order + short suffix used for chord names, e.g. "C" + "" = "C", "C" + "m7" = "Cm7".
const CHORD_QUALITY_LIST = [
  { key: 'maj',  suffix: '',    name: 'Major' },
  { key: 'min',  suffix: 'm',   name: 'Minor' },
  { key: 'dom7', suffix: '7',   name: 'Dominant 7th' },
  { key: 'maj7', suffix: 'maj7', name: 'Major 7th' },
  { key: 'min7', suffix: 'm7',  name: 'Minor 7th' },
  { key: 'dim',  suffix: 'dim', name: 'Diminished' },
  { key: 'dim7', suffix: 'dim7', name: 'Diminished 7th' },
  { key: 'm7b5', suffix: 'm7♭5', name: 'Half-Diminished' },
  { key: 'aug',  suffix: 'aug', name: 'Augmented' },
  { key: 'sus2', suffix: 'sus2', name: 'Suspended 2nd' },
  { key: 'sus4', suffix: 'sus4', name: 'Suspended 4th' },
];

// Build any named chord (root + quality key) as {note, octave} pairs, anchored so the
// root sits in baseOctave and higher chord tones fall in baseOctave or baseOctave+1.
function buildChordByRootQuality(rootNote, qualityKey, baseOctave) {
  const rootIdx = CHROMATIC.indexOf(rootNote);
  const intervals = CHORD_INTERVALS[qualityKey];
  return intervals.map(semi => {
    const absolute = rootIdx + semi;
    const noteName = CHROMATIC[absolute % 12];
    const octaveBump = Math.floor(absolute / 12);
    return { note: noteName, octave: baseOctave + octaveBump };
  });
}

const ROOT_NOTE_OPTIONS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// The white lower-octave keys, in scale-degree order.
const CHORD_DEGREE_CODES = ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM'];

function getScaleDegrees(rootNote, isMinor) {
  const steps = isMinor ? MINOR_SCALE_STEPS : MAJOR_SCALE_STEPS;
  const qualities = isMinor ? MINOR_QUALITIES : MAJOR_QUALITIES;
  const rootIdx = CHROMATIC.indexOf(rootNote);
  return steps.map((step, i) => ({
    degree: i + 1,
    note: CHROMATIC[(rootIdx + step) % 12],
    quality: qualities[i],
  }));
}

// Returns array of {note, octave} for the chord built on the given scale degree.
function buildChordNotes(rootNote, isMinor, degreeIndex, baseOctave, seventh) {
  const degrees = getScaleDegrees(rootNote, isMinor);
  const d = degrees[degreeIndex];
  let quality = d.quality;
  if (seventh) {
    if (quality === 'maj') quality = 'dom7';
    else if (quality === 'min') quality = 'min7';
    else if (quality === 'dim') quality = 'dim7';
  }
  const rootIdx = CHROMATIC.indexOf(d.note);
  const intervals = CHORD_INTERVALS[quality];
  const notes = intervals.map(semi => {
    const absolute = rootIdx + semi;
    const noteName = CHROMATIC[absolute % 12];
    const octaveBump = Math.floor(absolute / 12);
    return { note: noteName, octave: baseOctave + octaveBump };
  });
  return { notes, degree: d.degree, quality, root: d.note };
}

const ROMAN_MAJOR = ['I','ii','iii','IV','V','vi','vii°'];
const ROMAN_MINOR = ['i','ii°','III','iv','v','VI','VII'];
