const KEY = 'ghostos.settings.v1';
const DEFAULTS = { theme: 'green', font: 'tech', crt: true, sound: false };

export class Settings {
  constructor() {
    try { this.value = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
    catch { this.value = { ...DEFAULTS }; }
    this.apply();
  }
  apply() {
    document.body.dataset.theme = this.value.theme;
    document.body.dataset.font = this.value.font;
    document.body.dataset.crt = this.value.crt ? 'on' : 'off';
    try { localStorage.setItem(KEY, JSON.stringify(this.value)); } catch { /* Settings still apply for this session. */ }
  }
  update(key, value) { this.value[key] = value; this.apply(); }
  reset() { this.value = { ...DEFAULTS }; this.apply(); }
}