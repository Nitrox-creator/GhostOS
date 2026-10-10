import { VirtualFileSystem } from './filesystem.js';
import { GhostStory } from './story.js';
import { Settings } from './settings.js';
import { WindowManager } from './window-manager.js';
import { createApp, getApps } from './apps.js';

const byId = id => document.getElementById(id);
const manager = new WindowManager(byId('window-layer'), byId('task-list'));
const settings = new Settings(); const fs = new VirtualFileSystem(); let story;
manager.onChange = () => {
  try {
    localStorage.setItem('ghostos.session.v1', JSON.stringify(manager.list().map(item => ({
      id: item.id,
      minimized: item.element.classList.contains('is-minimized'),
      maximized: item.element.classList.contains('is-maximized')
    }))));
  } catch { /* The desktop remains usable if session storage is unavailable. */ }
};
function notify(title, message) {
  const item = document.createElement('div'); item.className = 'notification';
  const heading = document.createElement('strong'); heading.textContent = title; const text = document.createElement('p'); text.textContent = message;
  item.append(heading, text); byId('notifications').append(item); setTimeout(() => item.remove(), 4200);
}
story = new GhostStory(() => notify('Mémoire restaurée', 'Le dossier /system/echo est maintenant accessible.'));

function openApp(id, payload = null) {
  const app = getApps().find(item => item.id === id); if (!app) return;
  const windowId = id === 'editor' && payload?.path ? `editor:${payload.path}` : id;
  const existing = manager.list().find(item => item.id === windowId);
  if (existing) { existing.element.classList.remove('is-minimized'); manager.focus(windowId); return; }
  const content = createApp(id, { fs, settings, story, notify, manager, openApp, payload });
  manager.open(windowId, app.name, content, { width: app.width, height: app.height, status: app.id === 'terminal' ? 'VFS // SHELL SIMULÉ' : 'GHOSTOS // SIMULATION LOCALE' });
}
function buildLaunchers() {
  const icons = byId('desktop-icons'); const menu = byId('menu-apps');
  for (const app of getApps()) {
    const icon = document.createElement('button'); icon.className = 'desktop-icon'; icon.type = 'button';
    const glyph = document.createElement('span'); glyph.className = 'icon-glyph'; glyph.textContent = app.glyph; const label = document.createElement('span'); label.textContent = app.name;
    icon.append(glyph, label); icon.addEventListener('dblclick', () => openApp(app.id));
    icon.addEventListener('click', event => { if (event.detail === 1 && matchMedia('(pointer: coarse)').matches) openApp(app.id); }); icons.append(icon);
    const item = document.createElement('button'); item.className = 'menu-app'; item.type = 'button'; const symbol = document.createElement('span'); symbol.textContent = app.glyph;
    const name = document.createElement('span'); name.textContent = app.name; item.append(symbol, name); item.addEventListener('click', () => { openApp(app.id); closeMenu(); }); menu.append(item);
  }
}
function closeMenu() { byId('start-menu').hidden = true; byId('start-button').setAttribute('aria-expanded', 'false'); }
function updateClock() { byId('clock').textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
buildLaunchers(); updateClock(); setInterval(updateClock, 1000);
byId('start-button').addEventListener('click', () => { const menu = byId('start-menu'); menu.hidden = !menu.hidden; byId('start-button').setAttribute('aria-expanded', String(!menu.hidden)); });
byId('menu-settings').addEventListener('click', () => { closeMenu(); openApp('settings'); });
byId('system-status').addEventListener('click', () => notify('État du système', `Simulation locale active. Fragments restaurés : ${story.solved.length}/3.`));
document.addEventListener('pointerdown', event => { if (!event.target.closest('.start-menu') && !event.target.closest('#start-button')) closeMenu(); });
document.addEventListener('click', event => {
  if (!settings.value.sound || !event.target.closest('button')) return;
  try {
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) return;
    const audio = new AudioContextType(); const oscillator = audio.createOscillator(); const gain = audio.createGain();
    oscillator.frequency.value = 720; gain.gain.setValueAtTime(0.025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.045);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + 0.05);
    oscillator.addEventListener('ended', () => audio.close(), { once: true });
  } catch { /* Audio is optional; unsupported browsers remain fully usable. */ }
});
document.addEventListener('keydown', event => {
  if (event.altKey && event.key === 'F4') { event.preventDefault(); const active = manager.list().find(item => item.element.classList.contains('active-window')); if (active) manager.close(active.id); }
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 't') { event.preventDefault(); openApp('terminal'); }
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'e') { event.preventDefault(); openApp('explorer'); }
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') { event.preventDefault(); openApp('settings'); }
  if (event.ctrlKey && event.shiftKey && event.key === 'Escape') { event.preventDefault(); openApp('tasks'); }
  if (event.key === 'Escape') closeMenu();
});
const bootMessages = ['INITIALISATION DU NOYAU...', 'MONTAGE DU SYSTÈME DE FICHIERS VIRTUEL...', 'RESTAURATION DE LA SESSION INVITÉ...', 'GHOSTOS EST PRÊT.']; let bootStep = 0;
const bootInterval = setInterval(() => {
  bootStep += 1; byId('boot-progress').style.width = `${Math.min(100, bootStep * 25)}%`; byId('boot-message').textContent = bootMessages[Math.min(bootStep, bootMessages.length - 1)];
  if (bootStep >= 4) {
    clearInterval(bootInterval);
    setTimeout(() => {
      byId('boot-screen').classList.add('is-done');
      let saved = [];
      try { saved = JSON.parse(localStorage.getItem('ghostos.session.v1') || '[]'); } catch { saved = []; }
      if (Array.isArray(saved) && saved.length) {
        for (const item of saved) {
          if (!item || typeof item.id !== 'string') continue;
          if (item.id.startsWith('editor:')) openApp('editor', { path: item.id.slice('editor:'.length) });
          else openApp(item.id);
          if (item.minimized) manager.minimize(item.id);
          if (item.maximized) manager.toggleMaximize(item.id);
        }
      } else openApp('terminal');
      notify('Session restaurée', 'Bienvenue dans GhostOS. Vos applications sont prêtes.');
    }, 400);
  }
}, 260);