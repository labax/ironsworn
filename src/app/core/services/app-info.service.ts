import { Injectable, signal } from '@angular/core';

import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class AppInfoService {
  readonly appName = signal(environment.appName);
  readonly version = signal(environment.appVersion);
}
