import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CHALLENGE_RANK_LABELS, CHALLENGE_RANKS, type ChallengeRank } from '@app/domain/progress';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import { VOW_STATUS_LABELS, VOW_STATUSES, type Vow, type VowStatus } from '@app/domain/vows';
import type { ValidationError } from '@app/rules/validation';

interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface VowListItem {
  readonly vow: Vow;
  readonly title: string;
  readonly rankLabel: string;
  readonly statusLabel: string;
  readonly description: string;
  readonly notes: string;
}

@Component({
  selector: 'app-vows',
  imports: [ReactiveFormsModule],
  templateUrl: './vows.html',
  styleUrl: './vows.css',
})
export class Vows {
  private readonly workspace = inject(CampaignWorkspaceService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  protected readonly rankOptions: readonly SelectOption<ChallengeRank>[] = CHALLENGE_RANKS.map(
    (rank) => ({ value: rank, label: CHALLENGE_RANK_LABELS[rank] }),
  );
  protected readonly statusOptions: readonly SelectOption<VowStatus>[] = VOW_STATUSES.map(
    (status) => ({
      value: status,
      label: VOW_STATUS_LABELS[status],
    }),
  );
  protected readonly selectedVowId = this.workspace.selectedVowId;
  protected readonly vows = computed<readonly VowListItem[]>(() =>
    this.workspace.vows().map((vow) => ({
      vow,
      title: vow.title.trim() || 'Untitled vow',
      rankLabel: CHALLENGE_RANK_LABELS[vow.rank] ?? 'Unknown rank',
      statusLabel: VOW_STATUS_LABELS[vow.status] ?? 'Unknown status',
      description: vow.description ?? '',
      notes: vow.notes ?? '',
    })),
  );

  protected readonly vowForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
    rank: ['troublesome' as ChallengeRank, [Validators.required]],
    status: ['active' as VowStatus, [Validators.required]],
    notes: [''],
  });

  protected editingVowId: string | null = null;
  protected formMessage = '';
  protected fieldErrors: Partial<Record<'title' | 'rank' | 'status', string>> = {};
  private cleanFormSnapshot = JSON.stringify(this.vowForm.getRawValue());

  protected openCreate(): void {
    if (!this.confirmDiscard()) return;
    this.editingVowId = null;
    this.vowForm.reset({
      title: '',
      description: '',
      rank: 'troublesome',
      status: 'active',
      notes: '',
    });
    this.fieldErrors = {};
    this.markClean();
    this.formMessage = 'Creating a new vow.';
    this.focusTitle();
  }

  protected openVow(vowId: string): void {
    if (!this.confirmDiscard()) return;
    const vow = this.workspace.selectVow(vowId);
    if (!vow) return;
    this.editingVowId = vow.id;
    this.vowForm.reset({
      title: vow.title,
      description: vow.description ?? '',
      rank: vow.rank,
      status: vow.status,
      notes: vow.notes ?? '',
    });
    this.fieldErrors = {};
    this.markClean();
    this.formMessage = 'Editing selected vow.';
    this.focusTitle();
  }

  protected saveVow(): void {
    this.fieldErrors = {};
    this.formMessage = '';
    if (this.vowForm.invalid) {
      this.vowForm.markAllAsTouched();
    }

    const value = this.vowForm.getRawValue();
    const result = this.workspace.saveVow({ id: this.editingVowId ?? undefined, ...value });
    if (!result.ok) {
      this.applyErrors(result.errors);
      return;
    }

    this.editingVowId = result.vow.id;
    this.markClean();
    this.formMessage = 'Vow saved.';
    this.focusTitle();
  }

  protected cancelEdit(): void {
    if (!this.confirmDiscard()) return;
    this.editingVowId = null;
    this.vowForm.reset({
      title: '',
      description: '',
      rank: 'troublesome',
      status: 'active',
      notes: '',
    });
    this.fieldErrors = {};
    this.markClean();
    this.formMessage = 'Changes discarded.';
    this.focusTitle();
  }

  protected showError(controlName: 'title' | 'rank' | 'status'): boolean {
    const control = this.vowForm.controls[controlName];
    return (
      Boolean(this.fieldErrors[controlName]) ||
      (control.invalid && (control.touched || control.dirty))
    );
  }

  private confirmDiscard(): boolean {
    if (
      !this.vowForm.dirty &&
      this.cleanFormSnapshot === JSON.stringify(this.vowForm.getRawValue())
    )
      return true;
    const confirmed = window.confirm('Discard unsaved vow changes?');
    if (!confirmed) {
      this.formMessage = 'Unsaved changes were kept.';
      return false;
    }
    return true;
  }

  private markClean(): void {
    this.vowForm.markAsPristine();
    this.cleanFormSnapshot = JSON.stringify(this.vowForm.getRawValue());
  }

  private applyErrors(errors: readonly ValidationError[]): void {
    this.fieldErrors = Object.fromEntries(
      errors
        .filter(
          (error): error is ValidationError & { field: 'title' | 'rank' | 'status' } =>
            error.field === 'title' || error.field === 'rank' || error.field === 'status',
        )
        .map((error) => [error.field, error.message]),
    );
    this.formMessage = 'Fix the highlighted fields.';
    this.focusFirstFieldError();
  }

  private focusFirstFieldError(): void {
    const firstField = (['title', 'rank', 'status'] as const).find(
      (field) => this.fieldErrors[field],
    );
    if (!firstField) return;
    document.getElementById(`vow-${firstField}`)?.focus();
  }

  private focusTitle(): void {
    queueMicrotask(() => this.titleInput()?.nativeElement.focus());
  }
}
