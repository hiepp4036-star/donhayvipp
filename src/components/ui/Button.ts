/**
 * Base Button Component
 * Handles ripple effect, sound, loading states, accessibility
 */

interface ButtonOptions {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: (e: MouseEvent) => void;
  ariaLabel?: string;
  children: string | HTMLElement;
}

export class Button {
  private element: HTMLButtonElement | HTMLAnchorElement;
  private options: ButtonOptions;
  private rippleContainer: HTMLSpanElement | null = null;

  constructor(options: ButtonOptions) {
    this.options = options;
    this.element = this.createElement();
    this.bindEvents();
  }

  private createElement(): HTMLButtonElement | HTMLAnchorElement {
    const { variant = 'primary', size = 'md', fullWidth = false, disabled = false, loading = false, children, ariaLabel } = this.options;

    const isLink = children instanceof HTMLElement && children.tagName === 'A';
    const el = document.createElement(isLink ? 'a' : 'button') as HTMLButtonElement | HTMLAnchorElement;

    if (!isLink) {
      el.type = 'button';
    }

    el.className = `btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${disabled ? 'btn--disabled' : ''} ${loading ? 'btn--loading' : ''}`;
    el.disabled = disabled || loading;

    if (ariaLabel) {
      el.setAttribute('aria-label', ariaLabel);
    }

    this.rippleContainer = document.createElement('span');
    this.rippleContainer.className = 'btn__ripple-container';
    el.appendChild(this.rippleContainer);

    const content = document.createElement('span');
    content.className = 'btn__content';
    if (typeof children === 'string') {
      content.textContent = children;
    } else {
      content.appendChild(children);
    }
    el.appendChild(content);

    if (loading) {
      const spinner = document.createElement('span');
      spinner.className = 'btn__spinner';
      spinner.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>';
      el.appendChild(spinner);
    }

    return el;
  }

  private bindEvents(): void {
    const { onClick, disabled, loading } = this.options;

    if (disabled || loading) return;

    this.element.addEventListener('click', (e: MouseEvent) => {
      this.createRipple(e);
      onClick?.(e);
    });

    this.element.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.element.click();
      }
    });
  }

  private createRipple(e: MouseEvent): void {
    if (!this.rippleContainer) return;

    const rect = this.element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'btn__ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    this.rippleContainer.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove());
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public setLoading(loading: boolean): void {
    this.element.classList.toggle('btn--loading', loading);
    (this.element as HTMLButtonElement).disabled = loading || this.options.disabled;

    const spinner = this.element.querySelector('.btn__spinner');
    if (loading && !spinner) {
      const newSpinner = document.createElement('span');
      newSpinner.className = 'btn__spinner';
      newSpinner.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>';
      this.element.appendChild(newSpinner);
    } else if (!loading && spinner) {
      spinner.remove();
    }
  }

  public setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    this.element.classList.toggle('btn--disabled', disabled);
    (this.element as HTMLButtonElement).disabled = disabled;
  }

  public destroy(): void {
    this.element.remove();
  }
}

export function createPrimaryButton(text: string, onClick: (e: MouseEvent) => void, options: Partial<ButtonOptions> = {}): Button {
  return new Button({ variant: 'primary', children: text, onClick, ...options });
}

export function createSecondaryButton(text: string, onClick: (e: MouseEvent) => void, options: Partial<ButtonOptions> = {}): Button {
  return new Button({ variant: 'secondary', children: text, onClick, ...options });
}

export function createGhostButton(text: string, onClick: (e: MouseEvent) => void, options: Partial<ButtonOptions> = {}): Button {
  return new Button({ variant: 'ghost', children: text, onClick, ...options });
}