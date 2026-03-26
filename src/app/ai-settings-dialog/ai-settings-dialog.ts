import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'app-ai-settings-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ i18n.t('aiSettingsTitle') }}</h2>
    <mat-dialog-content>
      <p>{{ i18n.t('enterGeminiApiKey') }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ i18n.t('geminiApiKey') }}</mat-label>
        <input
          matInput
          [type]="hideKey() ? 'password' : 'text'"
          [ngModel]="apiKey()"
          (ngModelChange)="apiKey.set($event)"
          [placeholder]="i18n.t('enterApiKey')" />
        <button
          mat-icon-button
          matSuffix
          (click)="hideKey.set(!hideKey())"
          [attr.aria-label]="hideKey() ? i18n.t('showApiKey') : i18n.t('hideApiKey')"
          [attr.aria-pressed]="!hideKey()">
          <mat-icon>{{ hideKey() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>
      <p class="hint">
        {{ i18n.t('apiKeyStoredLocally') }}
        <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">{{ i18n.t('cancel') }}</button>
      <button mat-flat-button color="primary" (click)="onSave()">{{ i18n.t('save') }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    .full-width {
      width: 100%;
      margin-top: 8px;
    }
    .hint {
      font-size: 0.85rem;
      opacity: 0.7;
      margin-top: 16px;
    }
    a {
      color: var(--md-sys-color-primary);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `,
})
export class AiSettingsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AiSettingsDialogComponent>);
  private readonly storage = inject(StorageService);
  private readonly aiService = inject(AiService);
  protected readonly i18n = inject(I18nService);

  protected readonly apiKey = signal(this.storage.loadApiKey() ?? '');
  protected readonly hideKey = signal(true);

  protected onCancel(): void {
    this.dialogRef.close();
  }

  protected onSave(): void {
    this.storage.saveApiKey(this.apiKey().trim() || null);
    this.aiService.updateApiKeyStatus();
    this.dialogRef.close(true);
  }
}
