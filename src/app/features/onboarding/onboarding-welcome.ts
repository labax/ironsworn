import { Component, ElementRef, ViewChild, inject, afterNextRender } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ONBOARDING_WELCOME_COPY, OnboardingStateService } from '@app/domain/onboarding';

@Component({
  selector: 'app-onboarding-welcome',
  imports: [RouterLink],
  templateUrl: './onboarding-welcome.html',
  styleUrl: './onboarding-welcome.css',
})
export class OnboardingWelcome {
  private readonly onboarding = inject(OnboardingStateService);
  private readonly router = inject(Router);
  @ViewChild('welcomeTitle') private readonly welcomeTitle?: ElementRef<HTMLHeadingElement>;

  protected readonly copy = ONBOARDING_WELCOME_COPY;
  protected completing = false;

  constructor() {
    afterNextRender(() => this.welcomeTitle?.nativeElement.focus());
  }

  protected async startSetup(): Promise<void> {
    if (this.completing) return;
    this.completing = true;
    await this.onboarding.completeWelcome();
    await this.router.navigate(['/character']);
  }
}
