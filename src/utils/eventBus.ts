type Callback = (payload?: any) => void;

const listeners: Record<string, Callback[]> = {};

export const on = (event: string, cb: Callback) => {
  listeners[event] = listeners[event] || [];
  listeners[event].push(cb);
  return () => off(event, cb);
};

export const off = (event: string, cb: Callback) => {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(fn => fn !== cb);
};

export const emit = (event: string, payload?: any) => {
  if (!listeners[event]) return;
  listeners[event].forEach(fn => {
    try { fn(payload); } catch (e) { console.error('eventBus handler error', e); }
  });
};

export default { on, off, emit };
