import { createTerminal } from './terminal.js';

const APP_LIST = [
  { id: 'terminal', name: 'Terminal', glyph: '>_', width: 650, height: 410 },
  { id: 'explorer', name: 'File Explorer', glyph: '▤', width: 570, height: 420 },
  { id: 'editor', name: 'Text Editor', glyph: '▧', width: 610, height: 460 },
  { id: 'logs', name: 'System Logs', glyph: '≋', width: 610, height: 440 },
  { id: 'settings', name: 'Settings', glyph: '⚙', width: 500, height: 450 },
  { id: 'tasks', name: 'Task Manager', glyph: '▥', width: 560, height: 390 },
  { id: 'puzzle', name: 'Puzzle Archive', glyph: '?', width: 560, height: 520 }
];
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
export function getApps() { return APP_LIST; }
export function createApp(id, context) {
  switch (id) {
    case 'terminal': return createTerminal({ ...context, close: () => context.manager.close('terminal') });
    case 'explorer': return explorerApp(context);
    case 'editor': return editorApp(context);
    case 'logs': return logsApp(context);
    case 'settings': return settingsApp(context);
    case 'tasks': return tasksApp(context);
    case 'puzzle': return puzzleApp(context);
    default: return el('p', 'empty-state', 'Application introuvable.');
  }
}

function explorerApp(context) {
  const root = el('div'); let cwd = '/home/ghost';
  const toolbar = el('div', 'file-toolbar'); const up = el('button', 'tool-button', '↑ Parent'); const path = el('div', 'path-label'); const refresh = el('button', 'tool-button', '↻'); refresh.title = 'Actualiser'; refresh.setAttribute('aria-label', 'Actualiser'); const create = el('button', 'tool-button', '+ Fichier'); const list = el('div', 'file-list');
  toolbar.append(up, path, refresh, create); root.append(toolbar, list);
  const render = () => {
    path.textContent = cwd; list.replaceChildren();
    try {
      const entries = context.fs.list(cwd);
      if (cwd !== '/') {
        const parent = el('button', 'file-entry'); parent.append(el('span', 'file-icon', '↰'), el('span', 'file-name', '..'));
        parent.addEventListener('click', () => { cwd = cwd.slice(0, cwd.lastIndexOf('/')) || '/'; render(); }); list.append(parent);
      }
      for (const item of entries) {
        const button = el('button', 'file-entry'); button.append(el('span', 'file-icon', item.directory ? '▸' : '·'), el('span', 'file-name', item.name), el('small', '', item.directory ? 'DOSSIER' : 'TEXTE'));
        button.addEventListener('click', () => { const target = `${cwd === '/' ? '' : cwd}/${item.name}`; if (item.directory) { cwd = target; render(); } else context.openApp('editor', { path: target }); });
        list.append(button);
      }
      if (!entries.length) list.append(el('div', 'empty-state', 'Ce dossier est vide.'));
    } catch (error) { list.append(el('div', 'empty-state', error.message)); }
  };
  up.addEventListener('click', () => { cwd = cwd.slice(0, cwd.lastIndexOf('/')) || '/'; render(); });
  refresh.addEventListener('click', render);
  create.addEventListener('click', () => {
    const name = prompt('Nom du nouveau fichier texte :'); if (!name) return;
    try { context.fs.write(name, '', cwd); render(); context.notify('Fichier créé', `${cwd}/${name}`); }
    catch (error) { context.notify('Création impossible', error.message); }
  });
  render(); return root;
}

function editorApp(context) {
  const root = el('div', 'editor-app'); const toolbar = el('div', 'editor-toolbar'); const name = el('input', 'editor-name'); name.placeholder = 'nom-du-fichier.txt';
  const save = el('button', 'tool-button', 'Enregistrer'); const status = el('span', 'app-subtitle'); const body = el('textarea', 'editor-body'); body.spellcheck = false;
  if (context.payload?.path) { name.value = context.payload.path; try { body.value = context.fs.read(context.payload.path); } catch (error) { status.textContent = error.message; } }
  else name.value = '/home/ghost/documents/new-note.txt';
  toolbar.append(name, save, status); root.append(toolbar, body);
  save.addEventListener('click', () => { try { const path = context.fs.write(name.value.trim(), body.value, '/'); status.textContent = `Sauvegardé : ${path}`; context.notify('Texte enregistré', path); } catch (error) { status.textContent = error.message; } });
  return root;
}

function logsApp(context) {
  const root = el('div'); root.append(el('h2', 'app-heading', 'Journaux système'), el('p', 'app-subtitle', 'Flux fictif de la machine locale'));
  const list = el('div', 'log-list'); const entries = [
    ['09:00:01', 'INFO', 'Noyau GhostOS 2.7 initialisé.'], ['09:00:03', 'WARN', 'Source temporelle distante introuvable.'], ['09:00:04', 'INFO', 'Session invitée créée.'],
    ['09:00:08', 'USER', 'Dernier utilisateur connu : ECHO.'], ['09:01:12', 'WARN', 'Archive /system/echo verrouillée. Fragments : 0/3.'], ['09:04:44', 'INFO', 'Le silence n’est jamais vide.']
  ];
  if (context.story.solved.length) entries.push(['09:05:02', 'TRACE', `Fragment de mémoire restauré (${context.story.solved.length}/3).`]);
  if (context.story.archiveUnlocked) entries.push(['09:05:33', 'ECHO', 'Tu as trouvé le chemin. Je savais que tu reviendrais.']);
  for (const [time, level, message] of entries) { const row = el('div', `log-entry${level === 'ECHO' ? ' secret' : ''}`); row.append(el('span', 'log-time', time), el('span', 'log-level', level), el('span', '', message)); list.append(row); }
  const open = el('button', 'tool-button', 'Ouvrir boot.log'); open.addEventListener('click', () => context.openApp('editor', { path: '/system/logs/boot.log' })); root.append(list, open); return root;
}

function settingsApp(context) {
  const root = el('div'); root.append(el('h2', 'app-heading', 'Paramètres'), el('p', 'app-subtitle', 'Préférences enregistrées dans ce navigateur'));
  const group = el('div', 'setting-group');
  const addRow = (labelText, detail, control) => { const row = el('label', 'setting-row'); const label = el('span', '', labelText); label.append(el('small', '', detail)); row.append(label, control); group.append(row); };
  const theme = el('select', 'select-input');
  for (const [value, label] of [['green', 'Phosphore'], ['amber', 'Ambre'], ['ice', 'Glace']]) { const option = el('option', '', label); option.value = value; theme.append(option); }
  theme.value = context.settings.value.theme; theme.addEventListener('change', () => context.settings.update('theme', theme.value)); addRow('Palette', 'Couleur du phosphore', theme);
  const font = el('select', 'select-input');
  for (const [value, label] of [['tech', 'Terminal'], ['classic', 'Classique'], ['terminal', 'Pixel']]) { const option = el('option', '', label); option.value = value; font.append(option); }
  font.value = context.settings.value.font; font.addEventListener('change', () => context.settings.update('font', font.value)); addRow('Police', 'Typographie du système', font);
  for (const [key, labelText, detail] of [['crt', 'Effet CRT', 'Scanlines et scintillement léger'], ['sound', 'Effets sonores', 'Réservé aux interactions futures']]) {
    const toggle = el('input', 'toggle-input'); toggle.type = 'checkbox'; toggle.checked = context.settings.value[key]; toggle.addEventListener('change', () => context.settings.update(key, toggle.checked)); addRow(labelText, detail, toggle);
  }
  const reset = el('button', 'tool-button', 'Réinitialiser GhostOS');
  reset.addEventListener('click', () => {
    if (!confirm('Effacer les fichiers, paramètres et la progression enregistrés dans ce navigateur ?')) return;
    localStorage.removeItem('ghostos.files.v1'); localStorage.removeItem('ghostos.settings.v1'); localStorage.removeItem('ghostos.story.v1'); localStorage.removeItem('ghostos.session.v1'); location.reload();
  });
  root.append(group, reset); return root;
}

function tasksApp(context) {
  const root = el('div'); root.append(el('h2', 'app-heading', 'Gestionnaire des tâches'), el('p', 'app-subtitle', 'Applications ouvertes dans cette session'));
  const table = el('table', 'task-table'); const head = el('thead'); const header = el('tr');
  for (const title of ['PROCESSUS', 'ÉTAT', '']) header.append(el('th', '', title)); head.append(header);
  const body = el('tbody');
  const update = () => {
    body.replaceChildren(); const tasks = context.manager.list().filter(task => task.id !== 'tasks');
    if (!tasks.length) { const row = el('tr'); row.append(el('td', 'empty-state', 'Aucune autre application ouverte.')); body.append(row); }
    for (const task of tasks) {
      const row = el('tr'); row.append(el('td', '', task.title), el('td', '', task.element.classList.contains('is-minimized') ? 'Réduite' : 'Active'));
      const cell = el('td'); const close = el('button', 'tool-button', 'Terminer'); close.addEventListener('click', () => { context.manager.close(task.id); update(); }); cell.append(close); row.append(cell); body.append(row);
    }
  };
  table.append(head, body); root.append(table); update(); const refresh = el('button', 'tool-button', 'Actualiser'); refresh.addEventListener('click', update); root.append(refresh); return root;
}

function puzzleApp(context) {
  const root = el('div'); root.append(el('h2', 'app-heading', 'Puzzle Archive'), el('p', 'app-subtitle', 'Trois fragments, un souvenir. Les réponses sont dans le système.'));
  const levels = [
    ['01 // IDENTITÉ', 'Le dernier utilisateur a laissé son nom dans boot.log. Qui était-il ?'],
    ['02 // DATATION', 'incident.log donne une date. En quelle année le système a-t-il été abandonné ?'],
    ['03 // SIGNAL', 'Dans fragment.txt, qu’est-ce qui reste quand le bruit s’arrête ?']
  ];
  const render = () => {
    root.querySelectorAll('.puzzle-level, .puzzle-final').forEach(node => node.remove());
    for (const [index, [title, question]] of levels.entries()) {
      const solved = context.story.solved.includes(index); const card = el('section', `puzzle-level${solved ? ' solved' : ''}`);
      card.append(el('h3', '', `${title}${solved ? ' // RÉSOLU' : ''}`), el('p', '', question));
      const row = el('form', 'puzzle-entry'); const input = el('input', 'text-input'); input.placeholder = 'Réponse...'; input.disabled = solved;
      const submit = el('button', 'tool-button', solved ? 'Validé' : 'Vérifier'); submit.disabled = solved; row.append(input, submit);
      const result = el('div', 'puzzle-result', solved ? 'Fragment restauré.' : '');
      row.addEventListener('submit', event => {
        event.preventDefault();
        if (context.story.solve(index, input.value)) {
          result.textContent = 'Correct. Une partie de la mémoire revient.'; result.className = 'puzzle-result success';
          context.notify('Fragment restauré', index === 2 ? 'Le dossier /system/echo est désormais accessible.' : 'Consulte les journaux pour poursuivre.'); render();
        } else { result.textContent = 'Ce n’est pas la bonne réponse.'; result.className = 'puzzle-result failure'; }
      });
      card.append(row, result); root.append(card);
    }
    if (context.story.archiveUnlocked) root.append(el('p', 'puzzle-final terminal-line cyan', 'ARCHIVE OUVERTE // explore /system/echo dans File Explorer.'));
  };
  render(); return root;
}