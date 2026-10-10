const COMMANDS = ['help', 'clear', 'date', 'whoami', 'ls', 'cd', 'cat', 'touch', 'mkdir', 'status', 'theme', 'scan', 'history', 'matrix', 'unlock', 'listen', 'cipher', 'decrypt', 'hint', 'restricted', 'normal', 'archives', 'events', 'exit'];
const puzzlePrompts = [
  'nom de famille de l’opératrice ?',
  'quel verbe appartient à RESTORE ?',
  'quel prénom correspond à la voix source ?'
];

export function createTerminal({ fs, settings, story, secretStory, secretMode = false, notify, close, enterRestricted, leaveRestricted }) {
  const root = document.createElement('div'); root.className = 'terminal-app';
  const output = document.createElement('div'); output.className = 'terminal-output'; output.setAttribute('role', 'log');
  const form = document.createElement('form'); form.className = 'terminal-form';
  const prompt = document.createElement('span'); prompt.className = 'terminal-prompt';
  const input = document.createElement('input'); input.className = 'terminal-input'; input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('aria-label', 'Commande simulée');
  form.append(prompt, input); root.append(output, form);
  let cwd = secretMode ? '/RESTRICTED' : '/home/ghost'; let history = []; let historyIndex = 0;
  const print = (text, kind = '') => { const line = document.createElement('div'); line.className = `terminal-line ${kind}`; line.textContent = text; output.append(line); output.scrollTop = output.scrollHeight; };
  const updatePrompt = () => { prompt.textContent = `ghost@local:${cwd.replace('/home/ghost', '~')}$`; };
  const run = async raw => {
    const value = raw.trim(); if (!value) return;
    history.push(value); historyIndex = history.length; print(`${prompt.textContent} ${value}`, 'dim');
    const [command, ...args] = value.split(/\s+/); const arg = args.join(' ');
    try {
      switch (command.toLowerCase()) {
        case 'help':
          print(secretMode ? 'help clear date whoami ls cd cat status hint decrypt archives events normal exit' : 'help clear date whoami ls cd cat touch mkdir status theme scan history matrix unlock listen exit', 'cyan');
          print('Toutes les commandes agissent uniquement dans cette simulation.', 'dim'); break;
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
        case 'status':
          print(secretMode
            ? `GHOSTOS // RESTRICTED | énigmes : ${secretStory.solved.length}/3 | événements : ${secretStory.events.length}`
            : `GHOSTOS 2.7.04 | mémoire locale : OK | réseau : isolé | fragments : ${story.solved.length}/3 | archive : ${story.archiveUnlocked ? 'OUVERTE' : 'SCELLÉE'}`, 'good'); break;
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
        case 'cipher': {
          if (secretMode) throw new Error('Cette serrure appartient au terminal local.');
          if (!arg) throw new Error('Usage : cipher <réponse>');
          if (secretStory.unlock(arg)) {
            print('SIGNATURE ACCEPTÉE. Le bureau interdit se réveille.', 'good');
            notify('Trace confirmée', 'Une porte oubliée vient de répondre.');
          } else print(secretStory.unlocked ? 'Le bureau interdit est déjà déverrouillé.' : 'La serrure reste silencieuse. Les journaux contiennent des fragments de méthode.', 'error');
          break;
        }
        case 'decrypt': {
          if (!secretMode) throw new Error('Cette commande n’existe que dans le bureau restreint.');
          if (!arg) throw new Error('Usage : decrypt <réponse>');
          const index = secretStory.solved.length;
          if (index >= 3) { print('Toutes les couches sont ouvertes. Consulte /RESTRICTED/ARCHIVES/final-record.txt.', 'good'); break; }
          if (secretStory.solve(index, arg)) {
            print(index === 2
              ? 'DERNIÈRE COUCHE LEVÉE. L’enregistrement final est disponible dans ARCHIVES.'
              : `Couche ${index + 1} déchiffrée. Une nouvelle partie de la mémoire émerge.`, 'good');
            notify(index === 2 ? 'Archive finale révélée' : 'Archive déchiffrée', index === 2 ? 'Le dernier enregistrement est maintenant accessible.' : `Progression : ${index + 1}/3. Consulte les fichiers classifiés.`);
            if (index < 2) print(`Couche ${index + 2} : ${puzzlePrompts[index + 1]}`, 'cyan');
          } else print('Clé incorrecte. Les archives et les journaux recèlent des indices.', 'error');
          break;
        }
        case 'hint': print(secretStory.hint(), 'cyan'); break;
        case 'restricted':
          if (!secretStory.unlocked) throw new Error('Aucun bureau interdit n’est enregistré.');
          enterRestricted(); print('Connexion au bureau GHOSTOS // RESTRICTED.', 'good'); break;
        case 'normal':
          if (!secretMode) throw new Error('Le bureau normal est déjà actif.');
          leaveRestricted(); print('Retour au bureau GhostOS.', 'good'); break;
        case 'archives': {
          const entries = fs.list('/RESTRICTED/ARCHIVES');
          print(entries.map(entry => entry.name).join('  ') || '(archives vides)', 'cyan'); break;
        }
        case 'events':
          if (!secretMode) throw new Error('Le journal classifié est uniquement accessible dans le bureau restreint.');
          print(`${secretStory.events.length} événement(s) archivé(s). Ouvre EVENT LOG pour les consulter.`, 'cyan'); break;
        case 'listen':
          print('...le silence n’est jamais vide. Trois fragments. Une seule mémoire.', 'cyan');
          if (!secretMode && secretStory.discover('terminal-whisper')) print('Un clic discret répond au mot « écouter ».', 'dim');
          break;
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
  if (secretMode) {
    print('GHOSTOS // RESTRICTED TERMINAL', 'good');
    print('Environnement simulé. Archives locales en lecture seule.', 'dim');
    if (secretStory.solved.length < puzzlePrompts.length) print(`decrypt couche ${String(secretStory.solved.length + 1).padStart(2, '0')} : ${puzzlePrompts[secretStory.solved.length]}`, 'cyan');
    else print('Toutes les couches sont ouvertes. Consulte /RESTRICTED/ARCHIVES/final-record.txt.', 'cyan');
  } else {
    print('GHOSTOS TERMINAL // build 1997.10', 'good');
    print('Environnement simulé. Aucune commande système réelle ne sera exécutée.', 'dim');
    print('La machine se souvient de toi, ghost.', 'cyan');
  }
  updatePrompt();
  queueMicrotask(() => input.focus()); return root;
}