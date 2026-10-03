/**
 * Sensitivity Form Component
 * Playstyle selector, Issue textarea with char counter, Submit button
 */

import type { FormData } from '../core/types';
import { createPrimaryButton } from './ui/Button';
import { t } from '../core/i18n';

interface SensitivityFormOptions {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  onIssueChange?: (text: string, count: number) => void;
  disabled?: boolean;
}

export class SensitivityForm {
  private options: SensitivityFormOptions;
  private container: HTMLElement;
  private playstyleSelect!: HTMLSelectElement;
  private issueTextarea!: HTMLTextAreaElement;
  private charCounter!: HTMLElement;
  private submitBtn!: ReturnType<typeof createPrimaryButton>;
  private formElement!: HTMLFormElement;

  constructor(options: SensitivityFormOptions) {
    this.options = {
      disabled: false,
      ...options
    };
    this.container = this.createElement();
    this.bindEvents();

    if (this.options.initialData?.playstyle) {
      this.playstyleSelect.value = this.options.initialData.playstyle;
    }
    if (this.options.initialData?.issueText) {
      this.issueTextarea.value = this.options.initialData.issueText;
      this.updateCharCounter();
    }
  }

  private createElement(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'sensitivity-form';

    this.formElement = document.createElement('form');
    this.formElement.className = 'form';
    this.formElement.noValidate = true;
    wrapper.appendChild(this.formElement);

    const playstyleGroup = document.createElement('div');
    playstyleGroup.className = 'form-group';

    const playstyleLabel = document.createElement('label');
    playstyleLabel.className = 'form-label';
    playstyleLabel.htmlFor = 'playstyle-select';
    playstyleLabel.textContent = t('playstyle_label');
    playstyleGroup.appendChild(playstyleLabel);

    this.playstyleSelect = document.createElement('select');
    this.playstyleSelect.id = 'playstyle-select';
    this.playstyleSelect.className = 'form-select';
    this.playstyleSelect.disabled = this.options.disabled;
    this.playstyleSelect.innerHTML = `
      <option value="rusher">${t('playstyle_rusher')}</option>
      <option value="balanced" selected>${t('playstyle_balanced')}</option>
      <option value="sniper">${t('playstyle_sniper')}</option>
    `;
    playstyleGroup.appendChild(this.playstyleSelect);

    this.formElement.appendChild(playstyleGroup);

    const issueGroup = document.createElement('div');
    issueGroup.className = 'form-group';

    const issueLabelRow = document.createElement('div');
    issueLabelRow.className = 'form-label-row';

    const issueLabel = document.createElement('label');
    issueLabel.className = 'form-label';
    issueLabel.htmlFor = 'issue-textarea';
    issueLabel.textContent = t('issue_label');
    issueLabelRow.appendChild(issueLabel);

    this.charCounter = document.createElement('span');
    this.charCounter.className = 'char-counter';
    this.charCounter.setAttribute('aria-live', 'polite');
    this.charCounter.textContent = '0/200';
    issueLabelRow.appendChild(this.charCounter);

    issueGroup.appendChild(issueLabelRow);

    this.issueTextarea = document.createElement('textarea');
    this.issueTextarea.id = 'issue-textarea';
    this.issueTextarea.className = 'form-textarea';
    this.issueTextarea.placeholder = t('issue_placeholder');
    this.issueTextarea.maxLength = 200;
    this.issueTextarea.rows = 3;
    this.issueTextarea.disabled = this.options.disabled;
    this.issueTextarea.setAttribute('aria-describedby', 'issue-hint');
    issueGroup.appendChild(this.issueTextarea);

    const hint = document.createElement('p');
    hint.id = 'issue-hint';
    hint.className = 'form-hint';
    hint.textContent = 'Mô tả: rung tâm, lag, kéo lố, vuốt nặng, hay bắn xa/gần...';
    issueGroup.appendChild(hint);

    this.formElement.appendChild(issueGroup);

    this.submitBtn = createPrimaryButton(
      t('submit_btn'),
      (e) => this.handleSubmit(e),
      { fullWidth: true, disabled: this.options.disabled, size: 'lg' }
    );
    this.formElement.appendChild(this.submitBtn.getElement());

    return wrapper;
  }

  private bindEvents(): void {
    this.formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(e);
    });

    this.issueTextarea.addEventListener('input', () => {
      this.updateCharCounter();
      this.options.onIssueChange?.(this.issueTextarea.value, this.issueTextarea.value.length);
    });

    this.issueTextarea.addEventListener('input', () => {
      this.issueTextarea.style.height = 'auto';
      this.issueTextarea.style.height = `${Math.min(this.issueTextarea.scrollHeight, 120)}px`;
    });
  }

  private updateCharCounter(): void {
    const count = this.issueTextarea.value.length;
    this.charCounter.textContent = `${count}/200`;
    this.charCounter.classList.toggle('char-counter--warning', count > 180);
    this.charCounter.classList.toggle('char-counter--error', count >= 200);
  }

  private handleSubmit(e: Event): void {
    e.preventDefault();

    const brandKey = (this.container.closest('.app')?.querySelector('#brand-select') as HTMLSelectElement)?.value || '';
    const modelKey = (this.container.closest('.app')?.querySelector('#model-select') as HTMLSelectElement)?.value || '';

    if (!brandKey || !modelKey || !this.playstyleSelect.value || !this.issueTextarea.value.trim()) {
      this.options.onSubmit({
        brandKey,
        modelKey,
        playstyle: this.playstyleSelect.value as FormData['playstyle'],
        issueText: this.issueTextarea.value.trim()
      });
      return;
    }

    this.options.onSubmit({
      brandKey,
      modelKey,
      playstyle: this.playstyleSelect.value as FormData['playstyle'],
      issueText: this.issueTextarea.value.trim()
    });
  }

  public setDisabled(disabled: boolean): void {
    this.playstyleSelect.disabled = disabled;
    this.issueTextarea.disabled = disabled;
    this.submitBtn.setDisabled(disabled);
    this.options.disabled = disabled;
  }

  public setLoading(loading: boolean): void {
    this.submitBtn.setLoading(loading);
    this.setDisabled(loading);
  }

  public getData(): FormData {
    const brandKey = (this.container.closest('.app')?.querySelector('#brand-select') as HTMLSelectElement)?.value || '';
    const modelKey = (this.container.closest('.app')?.querySelector('#model-select') as HTMLSelectElement)?.value || '';

    return {
      brandKey,
      modelKey,
      playstyle: this.playstyleSelect.value as FormData['playstyle'],
      issueText: this.issueTextarea.value.trim()
    };
  }

  public reset(): void {
    this.playstyleSelect.value = 'balanced';
    this.issueTextarea.value = '';
    this.updateCharCounter();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.submitBtn.destroy();
    this.container.remove();
  }
}