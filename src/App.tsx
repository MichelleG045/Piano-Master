import { BookOpen, Check, CircleHelp, Music2, Piano, Play, Plus, RotateCcw, Trash2, Volume2 } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type NoteName = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";

type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

type PracticeItem = {
  id: number;
  goal: string;
  time: string;
};

type MeritLevel = "Preparatory" | "Level 1" | "Level 2" | "Level 3" | "Level 4" | "Level 5" | "Level 6" | "Level 7" | "Level 8" | "Level 9" | "Level 10" | "Advanced";

type DreamSong = {
  id: number;
  title: string;
  composer: string;
};

type LevelData = {
  practiceItems: PracticeItem[];
  dreamSongs: DreamSong[];
};

const NOTE_NAMES: NoteName[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const WHITE_KEYS = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
const BLACK_KEYS = [
  { note: "C#3", afterWhiteKey: 0 },
  { note: "D#3", afterWhiteKey: 1 },
  { note: "F#3", afterWhiteKey: 3 },
  { note: "G#3", afterWhiteKey: 4 },
  { note: "A#3", afterWhiteKey: 5 },
  { note: "C#4", afterWhiteKey: 7 },
  { note: "D#4", afterWhiteKey: 8 },
  { note: "F#4", afterWhiteKey: 10 },
  { note: "G#4", afterWhiteKey: 11 },
  { note: "A#4", afterWhiteKey: 12 },
];
const SCALE_PATTERNS = {
  major: [2, 2, 1, 2, 2, 2, 1],
  naturalMinor: [2, 1, 2, 2, 1, 2, 2],
  harmonicMinor: [2, 1, 2, 2, 1, 3, 1],
};

const MERIT_LEVELS: MeritLevel[] = [
  "Preparatory",
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
  "Level 5",
  "Level 6",
  "Level 7",
  "Level 8",
  "Level 9",
  "Level 10",
  "Advanced",
];

const QUIZ_BY_STAGE: Record<"early" | "middle" | "late" | "advanced", QuizQuestion[]> = {
  early: [
    {
      prompt: "Which interval pattern creates a major scale?",
      options: ["W W H W W W H", "W H W W H W W", "H W W H W W W"],
      answer: "W W H W W W H",
      explanation: "Major scales use whole, whole, half, whole, whole, whole, half.",
    },
    {
      prompt: "What does a sharp sign do?",
      options: ["Raises a pitch by a half step", "Lowers a pitch by a whole step", "Cancels the key signature"],
      answer: "Raises a pitch by a half step",
      explanation: "A sharp raises a note by one semitone, the smallest piano-key distance.",
    },
    {
      prompt: "Which chord usually feels like home?",
      options: ["I tonic", "V dominant", "ii supertonic"],
      answer: "I tonic",
      explanation: "The tonic chord is the tonal center and the usual point of rest.",
    },
  ],
  middle: [
    {
      prompt: "In C major, what notes spell the V7 chord?",
      options: ["G B D F", "F A C E", "A C E G"],
      answer: "G B D F",
      explanation: "The dominant seventh in C major is built on G: G, B, D, F.",
    },
    {
      prompt: "What cadence is IV to I often called?",
      options: ["Plagal cadence", "Half cadence", "Deceptive cadence"],
      answer: "Plagal cadence",
      explanation: "IV to I is the plagal cadence, often heard as an amen-style ending.",
    },
    {
      prompt: "Which minor scale raises the 7th scale degree?",
      options: ["Harmonic minor", "Natural minor", "Whole tone"],
      answer: "Harmonic minor",
      explanation: "Harmonic minor raises scale degree 7 to create a stronger leading tone.",
    },
  ],
  late: [
    {
      prompt: "In Roman numeral analysis, what is V/V?",
      options: ["Secondary dominant", "Neapolitan chord", "Passing diminished chord"],
      answer: "Secondary dominant",
      explanation: "V/V means the dominant of the dominant, a common tonicization device.",
    },
    {
      prompt: "What chord is built on lowered scale degree 2 in first inversion?",
      options: ["Neapolitan sixth", "German augmented sixth", "Cadential six-four"],
      answer: "Neapolitan sixth",
      explanation: "The Neapolitan sixth is a major chord on lowered scale degree 2, usually in first inversion.",
    },
    {
      prompt: "A cadential 6/4 most often resolves to what harmony?",
      options: ["V", "vi", "ii6"],
      answer: "V",
      explanation: "A cadential 6/4 decorates dominant harmony and resolves into V.",
    },
  ],
  advanced: [
    {
      prompt: "Which augmented sixth chord contains lowered 3, raised 4, lowered 6, and tonic?",
      options: ["German augmented sixth", "Italian augmented sixth", "French augmented sixth"],
      answer: "German augmented sixth",
      explanation: "The German augmented sixth has four tones and commonly resolves outward to dominant harmony.",
    },
    {
      prompt: "What does mixture usually mean in tonal harmony?",
      options: ["Borrowing from the parallel mode", "Changing meter mid-phrase", "Repeating a sequence exactly"],
      answer: "Borrowing from the parallel mode",
      explanation: "Modal mixture borrows color from the parallel major or minor mode.",
    },
    {
      prompt: "A common-tone diminished seventh often works by preserving what?",
      options: ["One pitch across changing harmonies", "The bass line only", "The original key signature"],
      answer: "One pitch across changing harmonies",
      explanation: "Common-tone diminished sevenths decorate or intensify a harmony while retaining a shared tone.",
    },
  ],
};

const createBlankLevelData = (): LevelData => ({
  practiceItems: [{ id: 1, goal: "", time: "" }],
  dreamSongs: [{ id: 1, title: "", composer: "" }],
});

const storageKeyForLevel = (level: MeritLevel) => `piano-master:${level}`;

function loadLevelData(level: MeritLevel): LevelData {
  try {
    const saved = window.localStorage.getItem(storageKeyForLevel(level));
    if (!saved) return createBlankLevelData();
    const parsed = JSON.parse(saved) as Partial<LevelData>;
    return {
      practiceItems: parsed.practiceItems?.length ? parsed.practiceItems : createBlankLevelData().practiceItems,
      dreamSongs: parsed.dreamSongs?.length ? parsed.dreamSongs.map(({ id, title, composer }) => ({ id, title, composer })) : createBlankLevelData().dreamSongs,
    };
  } catch {
    return createBlankLevelData();
  }
}

function saveLevelData(level: MeritLevel, data: LevelData) {
  window.localStorage.setItem(storageKeyForLevel(level), JSON.stringify(data));
}

function levelToSlug(level: MeritLevel) {
  return level.toLowerCase().replaceAll(" ", "-");
}

function getLevelFromHash() {
  const slug = window.location.hash.replace("#/levels/", "");
  return MERIT_LEVELS.find((level) => levelToSlug(level) === slug) ?? "Preparatory";
}

function getLevelStage(level: MeritLevel): keyof typeof QUIZ_BY_STAGE {
  const index = MERIT_LEVELS.indexOf(level);
  if (index <= 2) return "early";
  if (index <= 5) return "middle";
  if (index <= 9) return "late";
  return "advanced";
}

function getLevelFocus(level: MeritLevel) {
  const stage = getLevelStage(level);
  if (stage === "early") return "Notes, intervals, simple scales, and tonic/dominant basics.";
  if (stage === "middle") return "Triads, seventh chords, cadences, minor scales, and Roman numerals.";
  if (stage === "late") return "Secondary dominants, cadential 6/4, modulation, and chromatic color.";
  return "Advanced chromatic harmony, mixture, augmented sixth chords, and analysis.";
}

function buildScale(root: NoteName, pattern: number[]) {
  let index = NOTE_NAMES.indexOf(root);
  const notes = [root];
  for (const step of pattern.slice(0, -1)) {
    index = (index + step) % NOTE_NAMES.length;
    notes.push(NOTE_NAMES[index]);
  }
  return notes;
}

function buildTriad(root: NoteName, quality: "major" | "minor" | "diminished") {
  const rootIndex = NOTE_NAMES.indexOf(root);
  const intervals = quality === "major" ? [0, 4, 7] : quality === "minor" ? [0, 3, 7] : [0, 3, 6];
  return intervals.map((interval) => NOTE_NAMES[(rootIndex + interval) % NOTE_NAMES.length]);
}

function playTone(note: string, duration = 0.55) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return;

  const noteIndex = NOTE_NAMES.indexOf(match[1] as NoteName);
  const octave = Number(match[2]);
  const midi = 12 * (octave + 1) + noteIndex;
  const frequency = 440 * 2 ** ((midi - 69) / 12);

  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration + 0.04);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function App() {
  const initialLevel = getLevelFromHash();
  const [root, setRoot] = useState<NoteName>("C");
  const [scaleType, setScaleType] = useState<keyof typeof SCALE_PATTERNS>("major");
  const [chordQuality, setChordQuality] = useState<"major" | "minor" | "diminished">("major");
  const [activeNote, setActiveNote] = useState("C4");
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<MeritLevel>(initialLevel);
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>(() => loadLevelData(initialLevel).practiceItems);
  const [dreamSongs, setDreamSongs] = useState<DreamSong[]>(() => loadLevelData(initialLevel).dreamSongs);

  const quizQuestions = QUIZ_BY_STAGE[getLevelStage(selectedLevel)];
  const scale = useMemo(() => buildScale(root, SCALE_PATTERNS[scaleType]), [root, scaleType]);
  const triad = useMemo(() => buildTriad(root, chordQuality), [root, chordQuality]);
  const question = quizQuestions[quizIndex % quizQuestions.length];
  const isCorrect = selectedAnswer === question.answer;

  useEffect(() => {
    saveLevelData(selectedLevel, { practiceItems, dreamSongs });
  }, [dreamSongs, practiceItems, selectedLevel]);

  useEffect(() => {
    const syncPageToHash = () => {
      const level = getLevelFromHash();
      const savedLevelData = loadLevelData(level);
      setPracticeItems(savedLevelData.practiceItems);
      setDreamSongs(savedLevelData.dreamSongs);
      setSelectedLevel(level);
      setSelectedAnswer("");
      setQuizIndex(0);
    };

    window.addEventListener("hashchange", syncPageToHash);
    return () => window.removeEventListener("hashchange", syncPageToHash);
  }, []);

  const playNote = (note: string) => {
    setActiveNote(note);
    playTone(note);
  };

  const playScale = () => {
    scale.forEach((note, index) => {
      window.setTimeout(() => playNote(`${note}${note === "C" && index > 0 ? 5 : 4}`), index * 360);
    });
  };

  const playChord = () => {
    triad.forEach((note) => playTone(`${note}4`, 0.9));
  };

  const nextQuestion = () => {
    setSelectedAnswer("");
    setQuizIndex((current) => (current + 1) % quizQuestions.length);
  };

  const updatePracticeItem = (id: number, field: keyof Omit<PracticeItem, "id">, value: string) => {
    setPracticeItems((items) => items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addPracticeItem = () => {
    setPracticeItems((items) => [...items, { id: Date.now(), goal: "", time: "" }]);
  };

  const removePracticeItem = (id: number) => {
    setPracticeItems((items) => (items.length === 1 ? [{ id: Date.now(), goal: "", time: "" }] : items.filter((item) => item.id !== id)));
  };

  const updateDreamSong = (id: number, field: keyof Omit<DreamSong, "id">, value: string) => {
    setDreamSongs((songs) => songs.map((song) => (song.id === id ? { ...song, [field]: value } : song)));
  };

  const addDreamSong = () => {
    setDreamSongs((songs) => [...songs, { id: Date.now(), title: "", composer: "" }]);
  };

  const removeDreamSong = (id: number) => {
    setDreamSongs((songs) => (songs.length === 1 ? [{ id: Date.now(), title: "", composer: "" }] : songs.filter((song) => song.id !== id)));
  };

  const openLevel = (level: MeritLevel) => {
    const savedLevelData = loadLevelData(level);
    setPracticeItems(savedLevelData.practiceItems);
    setDreamSongs(savedLevelData.dreamSongs);
    setSelectedLevel(level);
    setQuizIndex(0);
    setSelectedAnswer("");
    window.location.hash = `/levels/${levelToSlug(level)}`;
  };

  return (
    <main className="app">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Music2 size={16} /> Classical piano theory
          </span>
          <h1>Piano Master</h1>
          <p>
            Practice scales, triads, cadence logic, and keyboard geography in one focused studio for early classical piano study.
          </p>
        </div>
      </section>

      <section className="panel level-selector-panel">
        <div className="level-selector-copy">
          <div>
            <BookOpen size={22} />
            <h2>{selectedLevel}</h2>
          </div>
          <p>{getLevelFocus(selectedLevel)}</p>
        </div>
        <label>
          Level
          <select value={selectedLevel} onChange={(event) => openLevel(event.target.value as MeritLevel)}>
            {MERIT_LEVELS.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="studio-grid">
        <div className="panel keyboard-panel">
          <div className="panel-header">
            <div>
              <Piano size={22} />
              <h2>Keyboard</h2>
            </div>
            <button className="icon-button" onClick={() => playNote(activeNote)} aria-label="Replay active note">
              <Volume2 size={18} />
            </button>
          </div>

          <div className="keyboard" aria-label="Interactive piano keyboard">
            <div className="white-keys">
              {WHITE_KEYS.map((note) => (
                <button
                  key={note}
                  className={`key white ${activeNote === note ? "active" : ""}`}
                  onClick={() => playNote(note)}
                  aria-label={`Play ${note}`}
                >
                  <span>{note}</span>
                </button>
              ))}
            </div>
            <div className="black-keys" aria-hidden="false">
              {BLACK_KEYS.map(({ note, afterWhiteKey }) => (
                <button
                  key={note}
                  className={`key black ${activeNote === note ? "active" : ""}`}
                  style={{ "--key-left": `${((afterWhiteKey + 1) / WHITE_KEYS.length) * 100}%` } as CSSProperties}
                  onClick={() => playNote(note)}
                  aria-label={`Play ${note}`}
                >
                  <span>{note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="note-readout">
            <span>Last note</span>
            <strong>{activeNote}</strong>
          </div>
        </div>

        <div className="panel theory-panel">
          <div className="panel-header">
            <div>
              <BookOpen size={22} />
              <h2>Theory Builder</h2>
            </div>
          </div>

          <div className="controls">
            <label>
              Root
              <select value={root} onChange={(event) => setRoot(event.target.value as NoteName)}>
                {NOTE_NAMES.map((note) => (
                  <option key={note}>{note}</option>
                ))}
              </select>
            </label>
            <label>
              Scale
              <select value={scaleType} onChange={(event) => setScaleType(event.target.value as keyof typeof SCALE_PATTERNS)}>
                <option value="major">Major</option>
                <option value="naturalMinor">Natural minor</option>
                <option value="harmonicMinor">Harmonic minor</option>
              </select>
            </label>
            <label>
              Triad
              <select value={chordQuality} onChange={(event) => setChordQuality(event.target.value as typeof chordQuality)}>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="diminished">Diminished</option>
              </select>
            </label>
          </div>

          <div className="theory-output">
            <div>
              <span>Scale tones</span>
              <strong>{scale.join(" - ")}</strong>
            </div>
            <div>
              <span>Triad tones</span>
              <strong>{triad.join(" - ")}</strong>
            </div>
          </div>

          <div className="action-row">
            <button onClick={playScale}>
              <Play size={17} /> Play scale
            </button>
            <button onClick={playChord}>
              <Volume2 size={17} /> Play triad
            </button>
          </div>
        </div>

        <div className="panel quiz-panel">
          <div className="panel-header">
            <div>
              <CircleHelp size={22} />
              <h2>Theory Drill</h2>
            </div>
            <span className="level-pill">{selectedLevel}</span>
            <button className="icon-button" onClick={() => setSelectedAnswer("")} aria-label="Reset answer">
              <RotateCcw size={18} />
            </button>
          </div>
          <p className="question">{question.prompt}</p>
          <div className="answer-list">
            {question.options.map((option) => (
              <button
                key={option}
                className={selectedAnswer === option ? "selected" : ""}
                onClick={() => setSelectedAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {selectedAnswer && (
            <div className={`feedback ${isCorrect ? "correct" : "incorrect"}`}>
              <Check size={18} />
              <span>{isCorrect ? "Correct." : "Not quite."} {question.explanation}</span>
            </div>
          )}
          <button className="wide-button" onClick={nextQuestion}>Next question</button>
        </div>

        <div className="panel plan-panel">
          <div className="panel-header">
            <div>
              <Music2 size={22} />
              <h2>{selectedLevel} Practice Plan</h2>
            </div>
            <button className="icon-button" onClick={addPracticeItem} aria-label="Add practice item">
              <Plus size={18} />
            </button>
          </div>
          <div className="plan-list">
            {practiceItems.map((item, index) => (
              <article className="practice-editor" key={item.id}>
                <label>
                  Goal {index + 1}
                  <textarea
                    value={item.goal}
                    onChange={(event) => updatePracticeItem(item.id, "goal", event.target.value)}
                    placeholder="Type your practice goal"
                    rows={3}
                  />
                </label>
                <div className="practice-row">
                  <label>
                    Time
                    <input
                      value={item.time}
                      onChange={(event) => updatePracticeItem(item.id, "time", event.target.value)}
                      placeholder="Optional"
                    />
                  </label>
                  <button className="icon-button" onClick={() => removePracticeItem(item.id)} aria-label="Remove practice item">
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel repertoire-panel">
          <div className="panel-header">
            <div>
              <BookOpen size={22} />
              <h2>{selectedLevel} Dream Song Bucket List</h2>
            </div>
            <button className="icon-button" onClick={addDreamSong} aria-label="Add dream song">
              <Plus size={18} />
            </button>
          </div>
          <div className="repertoire-list">
            {dreamSongs.map((song, index) => (
              <article className="song-editor" key={song.id}>
                <label>
                  Dream song {index + 1}
                  <input
                    value={song.title}
                    onChange={(event) => updateDreamSong(song.id, "title", event.target.value)}
                    placeholder="Song or piece title"
                  />
                </label>
                <label>
                  Composer
                  <input
                    value={song.composer}
                    onChange={(event) => updateDreamSong(song.id, "composer", event.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <div className="practice-row">
                  <span className="level-pill">{selectedLevel}</span>
                  <button className="icon-button" onClick={() => removeDreamSong(song.id)} aria-label="Remove dream song">
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
