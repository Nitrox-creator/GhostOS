import { VirtualFileSystem } from './filesystem.js';
import { GhostStory, SecretStory } from './story.js';
import { Settings } from './settings.js';
import { WindowManager } from './window-manager.js';
import { createApp, getApps } from './apps.js';

const byId = id => document.getElementById(id);
const manager = new WindowManager(byId('window-layer'), byId('task-list'));
const settings = new Settings(); const fs = new VirtualFileSystem(); let story; let secretStory; let secretMode = false;
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
secretStory = new SecretStory(playUnlockAnimation);
const clueByPath = {
  '/home/ghost/documents/fragment.txt': 'fragment',
  '/system/logs/boot.log': 'boot-offset',
  '/system/archive/readme.txt': 'cipher',
  '/system/logs/incident.log': 'incident-date',
  '/RESTRICTED/ORIGIN.TXT': 'origin',
  '/RESTRICTED/ARCHIVES/maintenance.log': 'directive',
  '/RESTRICTED/ARCHIVES/voice-index.txt': 'voice'
};
fs.onRead = path => {
  const clue = clueByPath[path];
  if (clue && secretStory.discover(clue)) notify('Trace détectée', 'Une ligne semble répondre à un fragment déjà entendu.');
};

function playUnlockAnimation() {
  const overlay = document.createElement('div'); overlay.className = 'unlock-overlay';
  const message = document.createElement('p'); message.textContent = 'ACCESS GRANTED — YOU WERE NOT SUPPOSED TO FIND THIS.';
  overlay.append(message); document.body.append(overlay);
  setTimeout(() => {
    enterRestricted();
    overlay.classList.add('unlock-complete');
    setTimeout(() => overlay.remove(), 700);
  }, 1500);
}

function setDesktopMode(restricted, recordEvent = true) {
  if (restricted && !secretStory.unlocked) return;
  const syncChrome = () => {
    byId('start-glyph').textContent = restricted ? 'R' : 'G';
    byId('start-label').textContent = restricted ? 'RESTRICTED' : 'GHOST';
    byId('menu-title').textContent = restricted ? 'GHOSTOS // RESTRICTED' : 'GHOSTOS';
    byId('menu-subtitle').textContent = restricted ? 'ACCÈS CLASSIFIÉ' : 'SESSION INVITÉ';
    byId('menu-footer-label').textContent = restricted ? 'SESSION ISOLÉE' : 'SIMULATION LOCALE';
    byId('menu-settings').hidden = restricted;
    byId('menu-restricted').hidden = !secretStory.unlocked || restricted;
  };
  if (secretMode === restricted) {
    syncChrome();
    return;
  }
  secretMode = restricted;
  document.body.dataset.mode = restricted ? 'restricted' : 'normal';
  const title = byId('desktop-title'); title.replaceChildren();
  if (restricted) title.textContent = 'GHOSTOS // RESTRICTED';
  else { const version = document.createElement('b'); version.textContent = '2.7.04'; title.append('GHOSTOS ', version); }
  byId('desktop-location').textContent = restricted ? 'SECTEUR CLASSIFIÉ // SESSION ISOLÉE' : 'SECTEUR LOCAL // SESSION PRIVÉE';
  byId('return-desktop').hidden = !restricted;
  syncChrome();
  byId('restricted-icons').hidden = !restricted;
  byId('desktop-icons').hidden = restricted;
  if (recordEvent) secretStory.recordEvent(restricted ? 'desk-opened' : 'desk-exited');
  buildLaunchers();
  const visibleWindow = manager.list().filter(item => item.id.startsWith('restricted-') === restricted && !item.element.classList.contains('is-minimized')).at(-1);
  if (visibleWindow) manager.focus(visibleWindow.id);
}

function enterRestricted() {
  setDesktopMode(true);
  const terminal = manager.list().find(item => item.id === 'restricted-terminal' && !item.element.classList.contains('is-minimized'));
  if (terminal) { manager.focus(terminal.id); return; }
  openApp('restricted-terminal');
}

function openApp(id, payload = null) {
  const apps = [...getApps(), ...(secretStory.unlocked ? getApps(true) : [])];
  const app = apps.find(item => item.id === id); if (!app) return;
  const editor = id === 'editor' || id === 'restricted-editor';
  const windowId = editor && payload?.path ? `${id}:${payload.path}` : id;
  const existing = manager.list().find(item => item.id === windowId);
  if (existing) { existing.element.classList.remove('is-minimized'); manager.focus(windowId); return; }
  const restricted = id.startsWith('restricted-');
  const content = createApp(id, { fs, settings, story, secretStory, notify, manager, openApp, payload, windowId, secretMode: restricted, enterRestricted, leaveRestricted: record => setDesktopMode(false, record) });
  manager.open(windowId, app.name, content, { width: app.width, height: app.height, restricted, status: restricted ? 'RESTRICTED // VFS CLASSIFIÉ' : app.id === 'terminal' ? 'VFS // SHELL SIMULÉ' : 'GHOSTOS // SIMULATION LOCALE' });
}
function buildLaunchers() {
  const icons = byId(secretMode ? 'restricted-icons' : 'desktop-icons'); const menu = byId('menu-apps');
  icons.replaceChildren(); menu.replaceChildren();
  for (const app of getApps(secretMode)) {
    if (app.hidden) continue;
    const icon = document.createElement('button'); icon.className = 'desktop-icon'; icon.type = 'button';
    const glyph = document.createElement('span'); glyph.className = 'icon-glyph'; glyph.textContent = app.glyph; const label = document.createElement('span'); label.textContent = app.name;
    icon.append(glyph, label); icon.addEventListener('dblclick', () => openApp(app.id));
    icon.addEventListener('click', event => { if (event.detail === 1 && matchMedia('(pointer: coarse)').matches) openApp(app.id); }); icons.append(icon);
    const item = document.createElement('button'); item.className = 'menu-app'; item.type = 'button'; const symbol = document.createElement('span'); symbol.textContent = app.glyph;
    const name = document.createElement('span'); name.textContent = app.name; item.append(symbol, name); item.addEventListener('click', () => { openApp(app.id); closeMenu(); }); menu.append(item);
  }
  byId('menu-restricted').hidden = !secretStory.unlocked || secretMode;
}
function closeMenu() { byId('start-menu').hidden = true; byId('start-button').setAttribute('aria-expanded', 'false'); }
function updateClock() { byId('clock').textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
buildLaunchers(); updateClock(); setInterval(updateClock, 1000);
byId('start-button').addEventListener('click', () => { const menu = byId('start-menu'); menu.hidden = !menu.hidden; byId('start-button').setAttribute('aria-expanded', String(!menu.hidden)); });
byId('menu-settings').addEventListener('click', () => { closeMenu(); openApp('settings'); });
byId('menu-restricted').addEventListener('click', () => { closeMenu(); enterRestricted(); });
byId('return-desktop').addEventListener('click', () => setDesktopMode(false));
byId('system-status').addEventListener('click', () => notify('État du système', secretMode
  ? `Session classifiée. Couches déchiffrées : ${secretStory.solved.length}/3.`
  : `Simulation locale active. Fragments restaurés : ${story.solved.length}/3.`));
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
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 't') { event.preventDefault(); openApp(secretMode ? 'restricted-terminal' : 'terminal'); }
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'e') { event.preventDefault(); openApp(secretMode ? 'restricted-files' : 'explorer'); }
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') { event.preventDefault(); openApp(secretMode ? 'restricted-events' : 'settings'); }
  if (event.ctrlKey && event.shiftKey && event.key === 'Escape') { event.preventDefault(); openApp(secretMode ? 'restricted-events' : 'tasks'); }
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
        if (secretStory.unlocked && saved.some(item => item?.id?.startsWith('restricted-'))) setDesktopMode(true, false);
        for (const item of saved) {
          if (!item || typeof item.id !== 'string') continue;
          if (item.id.startsWith('restricted-editor:')) openApp('restricted-editor', { path: item.id.slice('restricted-editor:'.length) });
          else if (item.id.startsWith('editor:')) openApp('editor', { path: item.id.slice('editor:'.length) });
          else openApp(item.id);
          if (item.minimized) manager.minimize(item.id);
          if (item.maximized) manager.toggleMaximize(item.id);
        }
      } else openApp('terminal');
      notify('Session restaurée', 'Bienvenue dans GhostOS. Vos applications sont prêtes.');
    }, 400);
  }
}, 260);