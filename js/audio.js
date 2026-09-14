// Shared sample-based piano audio engine, used by both the main piano
// (index.html) and the chord reference page (chords.html).

const SAMPLE_NOTES = ['A0','C1','Ds1','Fs1','A1','C2','Ds2','Fs2','A2','C3','Ds3','Fs3','A3',
  'C4','Ds4','Fs4','A4','C5','Ds5','Fs5','A5','C6','Ds6','Fs6','A6','C7','Ds7','Fs7','A7','C8'];

function toToneName(sampleName) {
  return sampleName.replace('s', '#');
}

const sampleUrls = {};
SAMPLE_NOTES.forEach(s => { sampleUrls[toToneName(s)] = s + '.mp3'; });

let sampler = null;
let loaded = false;

// `soundsPath` lets pages in different directories point at the same sample folder.
function initAudio(onReady, soundsPath = 'sounds/piano/') {
  if (sampler) return;
  sampler = new Tone.Sampler({
    urls: sampleUrls,
    baseUrl: soundsPath,
    onload: () => {
      loaded = true;
      if (onReady) onReady();
    },
  }).toDestination();
  sampler.volume.value = -6;
}

function setVolume(db) {
  if (sampler) sampler.volume.value = db;
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
