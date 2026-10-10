export class WindowManager {
  constructor(layer, taskList) { this.layer = layer; this.taskList = taskList; this.windows = new Map(); this.zIndex = 5; }
  open(id, title, content, options = {}) {
    const existing = this.windows.get(id);
    if (existing) { existing.element.classList.remove('is-minimized'); this.focus(id); return existing; }
    const element = document.createElement('section');
    element.className = 'window-frame'; element.dataset.windowId = id;
    if (options.restricted) element.classList.add('restricted-window');
    if (options.width) element.style.width = `${options.width}px`;
    if (options.height) element.style.height = `${options.height}px`;
    const offset = (this.windows.size % 7) * 24;
    element.style.left = `calc(50% - min(340px, 46vw) + ${offset}px)`;
    element.style.top = `calc(50% - 240px + ${offset}px)`;
    const bar = document.createElement('header'); bar.className = 'window-titlebar';
    const label = document.createElement('div'); label.className = 'window-title';
    const light = document.createElement('i'); const titleText = document.createElement('span'); titleText.textContent = title;
    label.append(light, titleText);
    const controls = document.createElement('div'); controls.className = 'window-controls';
    controls.append(this.control('−', 'Minimiser', () => this.minimize(id)), this.control('□', 'Agrandir / restaurer', () => this.toggleMaximize(id)), this.control('×', 'Fermer', () => this.close(id), 'close-window'));
    bar.append(label, controls);
    const body = document.createElement('div'); body.className = 'window-content';
    if (content instanceof Node) body.append(content); else body.textContent = String(content ?? '');
    const status = document.createElement('footer'); status.className = 'window-status';
    const statusLeft = document.createElement('span'); statusLeft.textContent = options.status || 'GHOSTOS // SIMULATION LOCALE';
    const statusRight = document.createElement('span'); statusRight.textContent = '100% LOCAL'; status.append(statusLeft, statusRight);
    element.append(bar, body, status); this.layer.append(element);
    const task = document.createElement('button'); task.className = `task-item${options.restricted ? ' restricted-window' : ''}`; task.textContent = title; task.title = title;
    task.addEventListener('click', () => {
      if (element.classList.contains('is-minimized')) element.classList.remove('is-minimized');
      else if (element.classList.contains('active-window')) { this.minimize(id); return; }
      this.focus(id);
    });
    this.taskList.append(task);
    const record = { id, title, element, body, task, onClose: options.onClose };
    this.windows.set(id, record);
    element.addEventListener('pointerdown', () => this.focus(id));
    this.makeDraggable(element, bar, controls); this.focus(id); this.onChange?.(); return record;
  }
  control(glyph, label, action, className = '') {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = glyph; button.title = label; button.setAttribute('aria-label', label);
    if (className) button.classList.add(className); button.addEventListener('click', action); return button;
  }
  makeDraggable(element, bar, controls) {
    let start = null;
    bar.addEventListener('pointerdown', event => {
      if (controls.contains(event.target) || event.button !== 0 || element.classList.contains('is-maximized')) return;
      const rect = element.getBoundingClientRect(); start = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top }; bar.setPointerCapture(event.pointerId);
    });
    bar.addEventListener('pointermove', event => {
      if (!start) return;
      element.style.left = `${Math.max(0, Math.min(innerWidth - 100, start.left + event.clientX - start.x))}px`;
      element.style.top = `${Math.max(0, Math.min(innerHeight - 80, start.top + event.clientY - start.y))}px`;
    });
    const stop = () => { if (start) this.onChange?.(); start = null; }; bar.addEventListener('pointerup', stop); bar.addEventListener('pointercancel', stop);
  }
  focus(id) {
    const record = this.windows.get(id); if (!record) return;
    record.element.style.zIndex = ++this.zIndex;
    for (const other of this.windows.values()) {
      other.element.classList.toggle('active-window', other.id === id);
      other.task.classList.toggle('active', other.id === id);
    }
    this.onChange?.();
  }
  minimize(id) { const record = this.windows.get(id); if (record) { record.element.classList.add('is-minimized'); record.task.classList.remove('active'); this.onChange?.(); } }
  toggleMaximize(id) { const record = this.windows.get(id); if (record) { record.element.classList.toggle('is-maximized'); this.onChange?.(); } }
  close(id) {
    const record = this.windows.get(id); if (!record) return;
    record.onClose?.(); record.element.remove(); record.task.remove(); this.windows.delete(id);
    this.onChange?.();
    const restricted = document.body.dataset.mode === 'restricted';
    const remaining = [...this.windows.values()].filter(item => !item.element.classList.contains('is-minimized') && item.element.classList.contains('restricted-window') === restricted).at(-1);
    if (remaining) this.focus(remaining.id);
  }
  closeAll() { for (const id of [...this.windows.keys()]) this.close(id); }
  list() { return [...this.windows.values()]; }
}