import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { OnboardingStateService } from './onboarding-state.service';

export const firstRunWelcomeGuard: CanActivateFn = async () => {
  const onboarding = inject(OnboardingStateService);
  const router = inject(Router);
  const decision = await onboarding.getGateDecision();
  return decision === 'show-welcome' ? router.createUrlTree(['/welcome']) : true;
};
