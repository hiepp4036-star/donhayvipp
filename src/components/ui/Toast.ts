/**
 * Toast Notification Component
 * Non-blocking, auto-dismiss, multiple types, stackable
 */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  onClose?: () => void;
}

interface ToastInstance {
  id: string;
  element: HTMLElement;
  timeoutId: number | null;
}

const toasts: ToastInstance[] = [];
let containerInitialized = false;

function initContainer(): HTMLElement {
  if (containerInitialized) {
    const existing = document.getElementById('toast-container');
    if (existing) return existing;
  }

  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  container.setAttribute('role', 'region');
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-label', 'Notifications');
  document.body.appendChild(container);
  containerInitialized = true;
  return container;
}

function createToastElement(options: ToastOptions): HTMLElement {
  const { type, message, action } = options;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-atomic', 'true');

  const icon = document.createElement('span');
  icon.className = 'toast__icon';
  icon.innerHTML = getIconSvg(type);
  toast.appendChild(icon);

  const content = document.createElement('span');
  content.className = 'toast__content';
  content.textContent = message;
  toast.appendChild(content);

  if (action) {
    const btn = document.createElement('button');
    btn.className = 'toast__action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.onClick();
      removeToast(toast);
    });
    toast.appendChild(btn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast__close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  closeBtn.addEventListener('click', () => removeToast(toast));
  toast.appendChild(closeBtn);

  return toast;
}

function getIconSvg(type: ToastType): string {
  switch (type) {
    case 'success':
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    case 'error':
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    case 'warning':
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    case 'info':
    default:
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }
}

export function showToast(options: ToastOptions): string {
  const container = initContainer();
  const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const element = createToastElement(options);
  element.dataset.id = id;

  const duration = options.duration ?? (options.type === 'error' ? 6000 : 4000);

  const timeoutId = window.setTimeout(() => {
    removeToast(element);
  }, duration);

  element.addEventListener('mouseenter', () => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  element.addEventListener('mouseleave', () => {
    const newTimeoutId = window.setTimeout(() => {
      removeToast(element);
    }, 2000);
  });

  const instance: ToastInstance = { id, element, timeoutId };
  toasts.push(instance);

  container.appendChild(element);

  requestAnimationFrame(() => {
    element.classList.add('toast--visible');
  });

  return id;
}

function removeToast(element: HTMLElement): void {
  if (!element.parentElement) return;

  element.classList.remove('toast--visible');
  element.classList.add('toast--hiding');

  element.addEventListener('transitionend', () => {
    const index = toasts.findIndex(t => t.element === element);
    if (index !== -1) {
      const instance = toasts[index];
      if (instance.timeoutId) clearTimeout(instance.timeoutId);
      toasts.splice(index, 1);
    }
    element.remove();
  }, { once: true });
}

export function removeToastById(id: string): void {
  const instance = toasts.find(t => t.id === id);
  if (instance) {
    removeToast(instance.element);
  }
}

export function clearToasts(): void {
  toasts.forEach(instance => {
    if (instance.timeoutId) clearTimeout(instance.timeoutId);
    removeToast(instance.element);
  });
  toasts.length = 0;
}

export const toast = {
  success: (message: string, options?: Partial<ToastOptions>) =>
    showToast({ type: 'success', message, ...options }),

  error: (message: string, options?: Partial<ToastOptions>) =>
    showToast({ type: 'error', message, ...options }),

  warning: (message: string, options?: Partial<ToastOptions>) =>
    showToast({ type: 'warning', message, ...options }),

  info: (message: string, options?: Partial<ToastOptions>) =>
    showToast({ type: 'info', message, ...options }),

  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string | ((result: T) => string); error: string | ((err: Error) => string) }
  ): Promise<T> => {
    const loadingId = showToast({ type: 'info', message: messages.loading, duration: 0 });

    return promise
      .then(result => {
        removeToastById(loadingId);
        const successMsg = typeof messages.success === 'function' ? messages.success(result) : messages.success;
        showToast({ type: 'success', message: successMsg });
        return result;
      })
      .catch(err => {
        removeToastById(loadingId);
        const errorMsg = typeof messages.error === 'function' ? messages.error(err) : messages.error;
        showToast({ type: 'error', message: errorMsg });
        throw err;
      });
  }
};