import { Injectable, signal } from '@angular/core';

import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class AppInfoService {
  readonly appName = signal(environment.appName);
  readonly version = signal(environment.appVersion);
  readonly environmentName = signal('name' in environment ? environment.name : 'development');
  readonly showUatBanner = signal(
    'showUatBanner' in environment ? environment.showUatBanner : false,
  );
  readonly storageMode = signal('storageMode' in environment ? environment.storageMode : 'local');
  readonly contentMode = signal(
    'contentMode' in environment ? environment.contentMode : 'development',
  );
}
