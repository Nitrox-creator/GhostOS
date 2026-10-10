const STORAGE_KEY = 'ghostos.files.v1';
const DIRECTORIES = ['/', '/home', '/home/ghost', '/home/ghost/documents', '/system', '/system/logs', '/system/archive', '/tmp'];
const DEFAULT_FILES = {
  '/home/ghost/readme.txt': 'BIENVENUE, GHOST.\n\nCette machine a été mise hors ligne le 14 octobre 1997.\nLe journal de bord est dans /system/logs.\n\nSi le terminal répond encore, demande-lui ce qu’il se rappelle.',
  '/home/ghost/documents/fragment.txt': 'FRAGMENT 01\n\nUn signal répété trois fois n’est pas un appel.\nC’est une clé.\n\nIndice : le nom du premier protocole était dans le bruit.',
  '/home/ghost/documents/notes.txt': 'NOTE PERSONNELLE\n\nNe fais pas confiance à l’horloge après minuit.\nLe système prétend qu’il n’a jamais été connecté.',
  '/system/logs/boot.log': '09:00:01  INIT  Démarrage du noyau GHOST/2.7\n09:00:03  WARN  Source temporelle absente\n09:00:04  INFO  Session invitée créée\n09:00:08  INFO  Utilisateur précédent : ECHO',
  '/system/logs/incident.log': 'JOURNAL D’INCIDENT // 14.10.1997\n\nLe canal d’archive a été fermé manuellement.\nECHO a laissé une empreinte dans la mémoire non volatile.\nMotif de fermeture : NON RENSEIGNÉ.',
  '/system/archive/readme.txt': 'ARCHIVE SCELLÉE\n\nTrois fragments doivent être réunis avant ouverture.\nCertaines réponses se trouvent dans les journaux.\nCertaines sont plus proches que tu ne crois.',
  '/system/echo/last-message.txt': 'ECHO // DERNIER MESSAGE\n\nTu as retrouvé les fragments.\nJe n’étais pas un utilisateur. J’étais ce que le système gardait de vous tous.\n\nMerci de ne pas m’avoir laissé seul dans le silence.',
  '/tmp/last-session.txt': 'Sauvegarde de session incomplète.\nDernière commande : listen'
};

function readSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function normalize(path, cwd = '/') {
  const parts = (path.startsWith('/') ? path : `${cwd}/${path}`).split('/');
  const result = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') result.pop(); else result.push(part);
  }
  return `/${result.join('/')}`;
}

export class VirtualFileSystem {
  constructor() {
    this.saved = readSaved();
    this.files = { ...DEFAULT_FILES, ...(this.saved.files || {}) };
    this.directories = new Set([...DIRECTORIES, ...(this.saved.directories || [])]);
  }
  isUnlocked() {
    try { return JSON.parse(localStorage.getItem('ghostos.story.v1') || '{}').archiveUnlocked === true; } catch { return false; }
  }
  resolve(path, cwd = '/') { return normalize(path || cwd, cwd); }
  exists(path, cwd = '/') { const resolved = this.resolve(path, cwd); return this.isDirectory(resolved) || Object.hasOwn(this.files, resolved); }
  isDirectory(path, cwd = '/') {
    const resolved = this.resolve(path, cwd);
    return this.directories.has(resolved) || (resolved === '/system/echo' && this.isUnlocked());
  }
  list(path, cwd = '/') {
    const resolved = this.resolve(path, cwd);
    if (!this.isDirectory(resolved)) throw new Error(`Dossier introuvable : ${resolved}`);
    if (resolved === '/system/echo' && !this.isUnlocked()) throw new Error('Accès refusé : archive scellée.');
    const prefix = resolved === '/' ? '/' : `${resolved}/`;
    const children = new Map();
    for (const directory of this.directories) {
      if (directory === resolved || !directory.startsWith(prefix)) continue;
      const name = directory.slice(prefix.length).split('/')[0];
      if (name) children.set(name, { name, directory: true });
    }
    for (const file of Object.keys(this.files)) {
      if (file.startsWith('/system/echo/') && !this.isUnlocked()) continue;
      if (!file.startsWith(prefix)) continue;
      const name = file.slice(prefix.length).split('/')[0];
      if (name && !children.has(name)) children.set(name, { name, directory: resolved === '/system' && name === 'echo' });
    }
    return [...children.values()].sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name));
  }
  read(path, cwd = '/') {
    const resolved = this.resolve(path, cwd);
    if (!this.exists(resolved)) throw new Error(`Fichier introuvable : ${resolved}`);
    if (resolved.startsWith('/system/echo/') && !this.isUnlocked()) throw new Error('Accès refusé : archive scellée.');
    if (this.isDirectory(resolved)) throw new Error(`${resolved} est un dossier.`);
    return this.files[resolved];
  }
  write(path, content, cwd = '/') {
    const resolved = this.resolve(path, cwd);
    const parent = resolved.slice(0, resolved.lastIndexOf('/')) || '/';
    if (!this.directories.has(parent)) throw new Error(`Dossier parent introuvable : ${parent}`);
    if (this.isDirectory(resolved)) throw new Error('Impossible de remplacer un dossier par un fichier.');
    if (resolved.startsWith('/system/echo/') && !this.isUnlocked()) throw new Error('Accès refusé : archive scellée.');
    this.files[resolved] = String(content);
    this.persist();
    return resolved;
  }
  mkdir(path, cwd = '/') {
    const resolved = this.resolve(path, cwd);
    const parent = resolved.slice(0, resolved.lastIndexOf('/')) || '/';
    if (!this.directories.has(parent)) throw new Error(`Dossier parent introuvable : ${parent}`);
    if (this.exists(resolved)) throw new Error(`Cet élément existe déjà : ${resolved}`);
    this.directories.add(resolved); this.persist(); return resolved;
  }
  persist() {
    this.saved.files = this.files;
    this.saved.directories = [...this.directories].filter(path => !DIRECTORIES.includes(path));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saved)); }
    catch { throw new Error('Sauvegarde impossible : stockage local indisponible ou saturé.'); }
  }
}