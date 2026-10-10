const KEY = 'ghostos.story.v1';
function readProgress() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }

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