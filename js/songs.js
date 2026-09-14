// Song library: melodies as absolute note+octave (assuming the default base
// octave, where Z = C4), plus an optional chord progression (scale degree
// numbers 1-7) for backing chords in Chord Mode. `b` = duration in beats.

function n(note, octave, b) { return { note, octave, b }; }

const SONGS = [
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    key: 'C', minor: false, tempo: 100,
    chords: [1,1,4,4,5,5,1, 4,4,1,1,5,5,1],
    melody: [
      n('C',4,1),n('C',4,1),n('G',4,1),n('G',4,1),n('A',4,1),n('A',4,1),n('G',4,2),
      n('F',4,1),n('F',4,1),n('E',4,1),n('E',4,1),n('D',4,1),n('D',4,1),n('C',4,2),
      n('G',4,1),n('G',4,1),n('F',4,1),n('F',4,1),n('E',4,1),n('E',4,1),n('D',4,2),
      n('G',4,1),n('G',4,1),n('F',4,1),n('F',4,1),n('E',4,1),n('E',4,1),n('D',4,2),
      n('C',4,1),n('C',4,1),n('G',4,1),n('G',4,1),n('A',4,1),n('A',4,1),n('G',4,2),
      n('F',4,1),n('F',4,1),n('E',4,1),n('E',4,1),n('D',4,1),n('D',4,1),n('C',4,2),
    ],
  },
  {
    id: 'happybirthday',
    title: 'Happy Birthday',
    key: 'C', minor: false, tempo: 110,
    chords: [1,1,4,1,5,4, 1,1,4,1,5,4, 1,1,1,4,5,4, 5,5,4,1,5,4],
    melody: [
      n('G',4,0.75),n('G',4,0.25),n('A',4,1),n('G',4,1),n('C',5,1),n('B',4,2),
      n('G',4,0.75),n('G',4,0.25),n('A',4,1),n('G',4,1),n('D',5,1),n('C',5,2),
      n('G',4,0.75),n('G',4,0.25),n('G',5,1),n('E',5,1),n('C',5,1),n('B',4,1),n('A',4,2),
      n('F',5,0.75),n('F',5,0.25),n('E',5,1),n('C',5,1),n('D',5,1),n('C',5,2),
    ],
  },
  {
    id: 'odetojoy',
    title: 'Ode to Joy (Beethoven)',
    key: 'C', minor: false, tempo: 120,
    chords: [1,1,5,5,1,1,5, 1,1,5,5,1,4,1],
    melody: [
      n('E',4,1),n('E',4,1),n('F',4,1),n('G',4,1),n('G',4,1),n('F',4,1),n('E',4,1),n('D',4,1),
      n('C',4,1),n('C',4,1),n('D',4,1),n('E',4,1),n('E',4,1.5),n('D',4,0.5),n('D',4,2),
      n('E',4,1),n('E',4,1),n('F',4,1),n('G',4,1),n('G',4,1),n('F',4,1),n('E',4,1),n('D',4,1),
      n('C',4,1),n('C',4,1),n('D',4,1),n('E',4,1),n('D',4,1.5),n('C',4,0.5),n('C',4,2),
    ],
  },
  {
    id: 'maryhadalamb',
    title: 'Mary Had a Little Lamb',
    key: 'C', minor: false, tempo: 110,
    chords: [1,4,5,1, 1,4,5,1, 1,5,1,1],
    melody: [
      n('E',4,1),n('D',4,1),n('C',4,1),n('D',4,1),n('E',4,1),n('E',4,1),n('E',4,2),
      n('D',4,1),n('D',4,1),n('D',4,2),n('E',4,1),n('G',4,1),n('G',4,2),
      n('E',4,1),n('D',4,1),n('C',4,1),n('D',4,1),n('E',4,1),n('E',4,1),n('E',4,1),n('E',4,1),
      n('D',4,1),n('D',4,1),n('E',4,1),n('D',4,1),n('C',4,2),
    ],
  },
  {
    id: 'furelise',
    title: "Für Elise (Easy Intro)",
    key: 'A', minor: true, tempo: 130,
    chords: [1,5,1,5,1,3,5],
    melody: [
      n('E',5,0.5),n('D#',5,0.5),n('E',5,0.5),n('D#',5,0.5),n('E',5,0.5),n('B',4,0.5),n('D',5,0.5),n('C',5,0.5),
      n('A',4,1),n('C',4,0.5),n('E',4,0.5),n('A',4,0.5),n('B',4,1),
      n('E',4,0.5),n('G#',4,0.5),n('B',4,0.5),n('C',5,1),
    ],
  },
  {
    id: 'canonind',
    title: 'Canon in D (Chord Progression)',
    key: 'D', minor: false, tempo: 90,
    chordOnly: true,
    chords: [1,5,6,3,4,1,4,5, 1,5,6,3,4,1,4,5],
    melody: [],
  },
  {
    id: 'fourchords',
    title: '★ 4 Chords That Play Hundreds of Songs (I-V-vi-IV)',
    key: 'C', minor: false, tempo: 90,
    chordOnly: true,
    chords: [1,5,6,4, 1,5,6,4, 1,5,6,4],
    examples: ["Let It Be", "No Woman No Cry", "With or Without You", "Someone Like You",
      "Don't Stop Believin'", "Africa", "Take On Me", "I'm Yours", "When I Come Around"],
  },
  {
    id: 'twelvebarblues',
    title: '★ 12-Bar Blues / Classic Rock (I-IV-V)',
    key: 'C', minor: false, tempo: 100,
    chordOnly: true,
    chords: [1,1,1,1, 4,4,1,1, 5,4,1,1],
    examples: ["Sweet Home Chicago", "Johnny B. Goode", "La Bamba", "Twist and Shout", "Wild Thing"],
  },
];
