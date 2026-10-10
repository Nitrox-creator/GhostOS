const COMMANDS = ['help', 'clear', 'date', 'whoami', 'ls', 'cd', 'cat', 'touch', 'mkdir', 'status', 'theme', 'scan', 'history', 'matrix', 'unlock', 'listen', 'exit'];

export function createTerminal({ fs, settings, story, notify, close }) {
  const root = document.createElement('div'); root.className = 'terminal-app';
  const output = document.createElement('div'); output.className = 'terminal-output'; output.setAttribute('role', 'log');
  const form = document.createElement('form'); form.className = 'terminal-form';
  const prompt = document.createElement('span'); prompt.className = 'terminal-prompt';
  const input = document.createElement('input'); input.className = 'terminal-input'; input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('aria-label', 'Commande simulée');
  form.append(prompt, input); root.append(output, form);
  let cwd = '/home/ghost'; let history = []; let historyIndex = 0;
  const print = (text, kind = '') => { const line = document.createElement('div'); line.className = `terminal-line ${kind}`; line.textContent = text; output.append(line); output.scrollTop = output.scrollHeight; };
  const updatePrompt = () => { prompt.textContent = `ghost@local:${cwd.replace('/home/ghost', '~')}$`; };
  const run = async raw => {
    const value = raw.trim(); if (!value) return;
    history.push(value); historyIndex = history.length; print(`${prompt.textContent} ${value}`, 'dim');
    const [command, ...args] = value.split(/\s+/); const arg = args.join(' ');
    try {
      switch (command.toLowerCase()) {
        case 'help': print('help clear date whoami ls cd cat touch mkdir status theme scan history matrix unlock listen exit', 'cyan'); print('Toutes les commandes agissent uniquement dans cette simulation.', 'dim'); break;
        case 'clear': output.replaceChildren(); break;
        case 'date': print(new Date().toLocaleString('fr-FR'), 'good'); break;
        case 'whoami': print('ghost // session invitée // identité non vérifiée', 'cyan'); break;
        case 'ls': { const entries = fs.list(arg || cwd, cwd); print(entries.map(entry => `${entry.directory ? '▸ ' : '  '}${entry.name}${entry.directory ? '/' : ''}`).join('    ') || '(dossier vide)', 'good'); break; }
        case 'cd': {
          const next = fs.resolve(arg || '/home/ghost', cwd);
          if (!fs.isDirectory(next)) throw new Error(`Dossier introuvable : ${next}`);
          if (next === '/system/echo' && !story.archiveUnlocked) throw new Error('Accès refusé : les fragments manquants maintiennent le dossier scellé.');
          cwd = next; updatePrompt(); break;
        }
        case 'cat': if (!arg) throw new Error('Usage : cat <fichier>'); else print(fs.read(arg, cwd), 'cyan'); break;
        case 'touch': {
          if (!arg) throw new Error('Usage : touch <fichier>');
          if (fs.exists(arg, cwd)) {
            if (fs.isDirectory(arg, cwd)) throw new Error(`${fs.resolve(arg, cwd)} est un dossier.`);
            print(`Fichier déjà présent : ${fs.resolve(arg, cwd)}`, 'dim');
          } else { fs.write(arg, '', cwd); print(`Fichier virtuel créé : ${fs.resolve(arg, cwd)}`, 'good'); }
          break;
        }
        case 'mkdir': if (!arg) throw new Error('Usage : mkdir <dossier>'); else { fs.mkdir(arg, cwd); print(`Dossier virtuel créé : ${fs.resolve(arg, cwd)}`, 'good'); } break;
        case 'status': print(`GHOSTOS 2.7.04 | mémoire locale : OK | réseau : isolé | fragments : ${story.solved.length}/3 | archive : ${story.archiveUnlocked ? 'OUVERTE' : 'SCELLÉE'}`, 'good'); break;
        case 'theme': {
          const theme = (arg || '').toLowerCase();
          if (!['green', 'amber', 'ice'].includes(theme)) print(`Thèmes : green, amber, ice. Actuel : ${settings.value.theme}`, 'dim');
          else { settings.update('theme', theme); print(`Thème actif : ${theme}`, 'good'); }
          break;
        }
        case 'scan': {
          print('DIAGNOSTIC LOCAL — aucune analyse matérielle ou réseau.', 'warn');
          for (const [index, text] of ['Vérification du système virtuel...', 'Aucune connexion externe détectée.', 'Trace de mémoire inconnue dans /system/logs.'].entries()) {
            await new Promise(resolve => setTimeout(resolve, 350)); print(`${String(index + 1).padStart(2, '0')}  ${text}`, index === 2 ? 'cyan' : 'dim');
          }
          break;
        }
        case 'history': history.forEach((item, index) => print(`${String(index + 1).padStart(3, ' ')}  ${item}`, 'dim')); break;
        case 'matrix': {
          print('FLUX RÉTRO // arrêt automatique dans 3 secondes', 'good'); let ticks = 0;
          const timer = setInterval(() => { print(Array.from({ length: 42 }, () => Math.random() > .5 ? '1' : '0').join(''), ticks % 2 ? 'dim' : 'good'); if (++ticks >= 7) clearInterval(timer); }, 350);
          break;
        }
        case 'unlock': {
          if (!arg) throw new Error('Usage : unlock <réponse>');
          const index = story.solved.length;
          if (index >= 3) { print('Tous les fragments sont déjà assemblés.', 'good'); break; }
          if (story.solve(index, arg)) {
            print(index === 2 ? 'ARCHIVE DÉVERROUILLÉE. Consulte /system/echo.' : `Fragment ${index + 1} accepté. Le signal se précise.`, 'good');
            if (index === 2) notify('Archive ouverte', 'Un nouveau dossier est apparu dans /system.');
          } else print('Réponse incorrecte. Les indices sont dans les fichiers et les journaux.', 'error');
          break;
        }
        case 'listen': print('...le silence n’est jamais vide. Trois fragments. Une seule mémoire.', 'cyan'); break;
        case 'exit': close(); break;
        default: print(`Commande inconnue : ${command}. Saisis « help » pour la liste.`, 'error');
      }
    } catch (error) { print(error.message, 'error'); }
  };
  form.addEventListener('submit', event => { event.preventDefault(); const value = input.value; input.value = ''; void run(value); });
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp') { event.preventDefault(); historyIndex = Math.max(0, historyIndex - 1); input.value = history[historyIndex] || ''; }
    if (event.key === 'ArrowDown') { event.preventDefault(); historyIndex = Math.min(history.length, historyIndex + 1); input.value = history[historyIndex] || ''; }
    if (event.key === 'Tab') { event.preventDefault(); const partial = input.value.trim(); const matches = COMMANDS.filter(command => command.startsWith(partial)); if (matches.length === 1) input.value = `${matches[0]} `; else if (!partial.includes(' ')) print(matches.join('  ') || 'Aucune complétion.', 'dim'); }
  });
  print('GHOSTOS TERMINAL // build 1997.10', 'good');
  print('Environnement simulé. Aucune commande système réelle ne sera exécutée.', 'dim');
  print('La machine se souvient de toi, ghost.', 'cyan'); updatePrompt();
  queueMicrotask(() => input.focus()); return root;
}