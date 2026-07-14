import { Component, ElementRef, ViewChild, inject, afterNextRender } from '@angular/core';
import { Router } from '@angular/router';

import { ONBOARDING_WELCOME_COPY, OnboardingStateService } from '@app/domain/onboarding';

@Component({
  selector: 'app-onboarding-welcome',
  imports: [],
  templateUrl: './onboarding-welcome.html',
  styleUrl: './onboarding-welcome.css',
})
export class OnboardingWelcome {
  private readonly onboarding = inject(OnboardingStateService);
  private readonly router = inject(Router);
  @ViewChild('welcomeTitle') private readonly welcomeTitle?: ElementRef<HTMLHeadingElement>;

  protected readonly copy = ONBOARDING_WELCOME_COPY;
  protected completing = false;
  protected skipping = false;

  constructor() {
    afterNextRender(() => this.welcomeTitle?.nativeElement.focus());
  }

  protected async startSetup(): Promise<void> {
    if (this.completing || this.skipping) return;
    this.completing = true;
    await this.onboarding.completeWelcome();
    await this.router.navigate(['/character']);
  }

  protected async skipForNow(): Promise<void> {
    if (this.completing || this.skipping) return;
    this.skipping = true;
    await this.onboarding.skipForNow();
    await this.router.navigate(['/moves']);
  }
}
