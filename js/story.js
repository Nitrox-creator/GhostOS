const KEY = 'ghostos.story.v1';
function readProgress() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
const SECRET_KEY = 'ghostos.secret.v1';
const SECRET_CLUES = ['fragment', 'boot-offset', 'cipher', 'incident-date', 'terminal-whisper', 'origin', 'directive', 'voice'];
const SECRET_ANSWERS = ['venn', 'remember', 'mara'];
const SECRET_HINTS = [
  'Les initiales du créateur sont développées dans une note signée.',
  'Compare les trois verbes des journaux : seul celui associé à la restauration a survécu.',
  'Les journaux de voix et les notes de la créatrice parlent-ils de deux personnes ?'
];
function readSecretProgress() {
  try { return JSON.parse(localStorage.getItem(SECRET_KEY) || '{}'); } catch { return {}; }
}

export class GhostStory {
  constructor(onUnlock = () => {}) {
    this.progress = { solved: [], archiveUnlocked: false, ...readProgress() };
    this.onUnlock = onUnlock;
  }
  get solved() { return [...this.progress.solved]; }
  get archiveUnlocked() { return this.progress.archiveUnlocked; }
  solve(level, answer) {
    const answers = ['echo', '1997', 'silence'];
    if (answers[level] !== String(answer).trim().toLowerCase()) return false;
    if (!this.progress.solved.includes(level)) this.progress.solved.push(level);
    if (this.progress.solved.length === answers.length && !this.progress.archiveUnlocked) {
      this.progress.archiveUnlocked = true;
      this.onUnlock();
    }
    this.persist(); return true;
  }
  persist() { localStorage.setItem(KEY, JSON.stringify(this.progress)); }
  reset() { this.progress = { solved: [], archiveUnlocked: false }; this.persist(); }
}

export class SecretStory {
  constructor(onUnlock = () => {}) {
    const savedValue = readSecretProgress();
    const saved = savedValue && typeof savedValue === 'object' ? savedValue : {};
    this.progress = {
      unlocked: saved.unlocked === true,
      solved: Array.isArray(saved.solved)
        ? [...new Set(saved.solved.filter(level => Number.isInteger(level) && level >= 0 && level < SECRET_ANSWERS.length))]
          .sort((left, right) => left - right).filter((level, index) => level === index)
        : [],
      clues: Array.isArray(saved.clues) ? [...new Set(saved.clues.filter(clue => SECRET_CLUES.includes(clue)))] : [],
      events: Array.isArray(saved.events) ? saved.events.filter(event => event && typeof event.type === 'string' && typeof event.time === 'string').slice(-40) : []
    };
    this.onUnlock = onUnlock;
  }
  get unlocked() { return this.progress.unlocked; }
  get solved() { return [...this.progress.solved]; }
  get clues() { return [...this.progress.clues]; }
  get events() { return [...this.progress.events]; }
  save(progress) {
    localStorage.setItem(SECRET_KEY, JSON.stringify(progress));
    this.progress = progress;
  }
  addEvent(events, type) {
    return [...events, { type, time: new Date().toISOString() }].slice(-40);
  }
  unlock(answer) {
    if (this.progress.unlocked) return false;
    if (String(answer).trim().toLowerCase() !== 'morrow') return false;
    const progress = { ...this.progress, unlocked: true };
    progress.events = this.addEvent(progress.events, 'door-opened');
    this.save(progress);
    this.onUnlock();
    return true;
  }
  solve(level, answer) {
    if (!this.unlocked || level !== this.progress.solved.length || SECRET_ANSWERS[level] !== String(answer).trim().toLowerCase()) return false;
    const progress = { ...this.progress, solved: [...this.progress.solved, level] };
    progress.events = this.addEvent(progress.events, `riddle-${level + 1}`);
    if (progress.solved.length === SECRET_ANSWERS.length) progress.events = this.addEvent(progress.events, 'truth-recovered');
    this.save(progress);
    return true;
  }
  discover(clue) {
    if (!SECRET_CLUES.includes(clue) || this.progress.clues.includes(clue)) return false;
    const progress = { ...this.progress, clues: [...this.progress.clues, clue] };
    progress.events = this.addEvent(progress.events, `clue-${clue}`);
    this.save(progress);
    return true;
  }
  recordEvent(type) {
    const progress = { ...this.progress, events: this.addEvent(this.progress.events, type) };
    this.save(progress);
  }
  hint() {
    if (!this.unlocked) return 'Relie le décalage de date du journal de démarrage au traitement décrit dans fragment.txt.';
    return SECRET_HINTS[this.progress.solved.length] || 'Toutes les couches sont ouvertes. Le dernier dossier contient la conclusion.';
  }
  reset() {
    this.save({ unlocked: false, solved: [], clues: [], events: [] });
  }
}