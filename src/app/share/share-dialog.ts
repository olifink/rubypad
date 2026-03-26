import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ShareService } from './share.service';
import { toDataURL } from 'qrcode';
import { I18nService } from '../i18n/i18n.service';

export interface ShareDialogData {
  code: string;
  packages: string[]; // retained for backwards compat; unused in RubyPad
}

@Component({
  selector: 'app-share-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule],
  styles: `
    .share-url-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 20px;
    }

    .share-url-field {
      flex: 1;
    }

    .share-url-input {
      font-size: 13px;
      font-family: 'Roboto Mono', monospace;
    }

    .packages-note {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      background: var(--mat-sys-surface-container);
      border-radius: 8px;
      padding: 8px 12px;
      margin: 0 0 16px;
    }

    .packages-note mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: var(--mat-sys-primary);
    }

    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .qr-img {
      width: 200px;
      height: 200px;
      border-radius: 8px;
      display: block;
    }

    .qr-caption {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }
  `,
  template: `
    <h2 mat-dialog-title>{{ i18n.t('shareDialogTitle') }}</h2>

    <mat-dialog-content>
      @if (packages.length > 0) {
        <p class="packages-note">
          <mat-icon aria-hidden="true">inventory_2</mat-icon>
          {{ packages.length === 1 ? i18n.t('includesPackage') : i18n.t('includesPackages') }}
          <strong>{{ packages.join(', ') }}</strong>
        </p>
      }

      <div class="share-url-row">
        <mat-form-field class="share-url-field" appearance="outline" subscriptSizing="dynamic">
          <input
            matInput
            class="share-url-input"
            [value]="shareUrl"
            readonly
            [attr.aria-label]="i18n.t('shareableUrl')"
            (focus)="onUrlFocus($event)"
          />
        </mat-form-field>
        <button
          mat-stroked-button
          (click)="copyUrl()"
          [attr.aria-label]="copied() ? i18n.t('copied') : i18n.t('copyLink')">
          <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
          {{ copied() ? i18n.t('copiedWithBang') : i18n.t('copy') }}
        </button>
      </div>

      @if (qrDataUrl()) {
        <div class="qr-section">
          <img class="qr-img" [src]="qrDataUrl()" [alt]="i18n.t('qrCodeAlt')" />
          <p class="qr-caption">{{ i18n.t('scanToOpenOnAnotherDevice') }}</p>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ i18n.t('close') }}</button>
    </mat-dialog-actions>
  `,
})
export class ShareDialogComponent implements OnInit {
  private readonly data = inject<ShareDialogData>(MAT_DIALOG_DATA);
  private readonly shareService = inject(ShareService);
  protected readonly i18n = inject(I18nService);

  protected readonly shareUrl = this.shareService.buildShareUrl(this.data.code);
  protected readonly packages: string[] = [];
  protected readonly copied = signal(false);
  protected readonly qrDataUrl = signal('');

  ngOnInit(): void {
    void toDataURL(this.shareUrl, { width: 200, margin: 2, errorCorrectionLevel: 'M' }).then(
      (url) => this.qrDataUrl.set(url),
    );
  }

  protected onUrlFocus(e: FocusEvent): void {
    (e.target as HTMLInputElement).select();
  }

  protected copyUrl(): void {
    void navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
