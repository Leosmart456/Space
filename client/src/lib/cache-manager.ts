const APP_VERSION = '2.2.0';
const VERSION_KEY = 'app-version';

interface CacheStatus {
  needsClear: boolean;
  reason?: string;
}

class CacheManager {
  private isStorageDisabled(): boolean {
    try {
      const testKey = '__storage_availability_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return false;
    } catch {
      return true;
    }
  }

  checkVersion(): CacheStatus {
    if (this.isStorageDisabled()) {
      console.warn('localStorage is disabled or unavailable');
      return { needsClear: false };
    }

    try {
      const storedVersion = localStorage.getItem(VERSION_KEY);

      if (!storedVersion) {
        try {
          localStorage.setItem(VERSION_KEY, APP_VERSION);
        } catch (error) {
          console.warn('Failed to set version key:', error);
        }
        return { needsClear: false };
      }

      if (storedVersion !== APP_VERSION) {
        return {
          needsClear: true,
          reason: `App updated from ${storedVersion} to ${APP_VERSION}`
        };
      }

      return { needsClear: false };
    } catch (error) {
      console.error('Error checking version:', error);
      return { needsClear: false };
    }
  }

  clearAllCache(): void {
    try {
      const GLOBAL_RECOVERY_KEY = 'global-auto-recovery-attempts';
      const GLOBAL_RECOVERY_TIMESTAMP_KEY = 'global-auto-recovery-timestamp';

      // Preserve these keys across cache clears — includes splash flags so the
      // user does not see the full branded splash a second time after a hard reload,
      // and cookie consent so the banner does not re-appear after a cache clear.
      const keysToPreserve = [
        VERSION_KEY,
        GLOBAL_RECOVERY_KEY,
        GLOBAL_RECOVERY_TIMESTAMP_KEY,
        '__lumirra_splash_date__',
        '__lumirra_splash_anim_ver__',
        'lumirra-cookie-consent',
      ];
      const preservedData: Record<string, string> = {};

      keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          preservedData[key] = value;
        }
      });

      // Also preserve the session splash flag so the React SplashScreen
      // skips itself on the reload triggered by a version bump.
      const sessionSplashShown = sessionStorage.getItem('__lumirra_splash_shown__');

      localStorage.clear();
      sessionStorage.clear();

      Object.entries(preservedData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      if (sessionSplashShown) {
        sessionStorage.setItem('__lumirra_splash_shown__', sessionSplashShown);
      }

      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
          });
        });
      }

      console.log('All cache cleared (splash flags and recovery counters preserved)');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  hardReload(): void {
    try {
      try {
        localStorage.setItem(VERSION_KEY, APP_VERSION);
      } catch (versionError) {
        console.warn('Failed to update version key:', versionError);
      }

      this.clearAllCache();

      const url = new URL(window.location.href);
      url.searchParams.set('_cache_bust', Date.now().toString());
      window.location.replace(url.toString());
    } catch (error) {
      console.error('Hard reload failed, falling back to standard reload:', error);
      window.location.reload();
    }
  }

  clearStorageOnly(): void {
    try {
      const keysToPreserve = [
        VERSION_KEY,
        '__lumirra_splash_date__',
        '__lumirra_splash_anim_ver__',
        'lumirra-cookie-consent',
      ];
      const preservedData: Record<string, string> = {};

      keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          preservedData[key] = value;
        }
      });

      localStorage.clear();
      sessionStorage.clear();

      Object.entries(preservedData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      console.log('Storage cleared (version and splash flags preserved)');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  validateStorage(): boolean {
    if (this.isStorageDisabled()) {
      console.warn('localStorage is disabled');
      return false;
    }

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, '1');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return value === '1';
    } catch (error) {
      console.error('Storage validation failed:', error);
      return false;
    }
  }

  detectCorruption(): boolean {
    if (this.isStorageDisabled()) {
      return false;
    }

    try {
      const lumirraKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('lumirra-')
      );

      for (const key of lumirraKeys) {
        const value = localStorage.getItem(key);
        if (value === null || value === undefined) {
          console.warn(`Corrupted key detected: ${key}`);
          return true;
        }

        if (key.includes('JSON') || key.includes('wallet') || key.includes('user')) {
          try {
            JSON.parse(value);
          } catch {
            console.warn(`Invalid JSON in key: ${key}`);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Corruption detection failed:', error);
      return false;
    }
  }

  autoCheck(): void {
    if (this.isStorageDisabled()) {
      console.warn('localStorage is disabled or unavailable. App will run with limited functionality.');
      return;
    }

    // Version checking is now done in index.html BEFORE React loads.
    // If we reach this point the version already matches, so we only
    // need to check for storage corruption.

    // Skip if we just did a hard reload (URL has _cache_bust param)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('_cache_bust')) {
      console.log('Skipping auto-check after hard reload to prevent infinite loop');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (!this.validateStorage()) {
      console.warn('Storage validation failed. Skipping automatic clear to prevent reload loop.');
      return;
    }

    if (this.detectCorruption()) {
      console.warn('Storage corruption detected, attempting to clear');
      try {
        this.clearStorageOnly();
        // Do NOT hard reload for corruption — soft clear is enough to recover
      } catch (error) {
        console.error('Failed to clear corrupted storage:', error);
      }
    }
  }

  getRecoveryInfo(): string {
    const info: string[] = [];
    info.push(`App Version: ${APP_VERSION}`);

    if (this.isStorageDisabled()) {
      info.push('LocalStorage: Disabled or Unavailable');
      info.push('Storage Valid: N/A');
      info.push('Corruption Detected: N/A');
      return info.join('\n');
    }

    info.push(`Storage Valid: ${this.validateStorage()}`);
    info.push(`Corruption Detected: ${this.detectCorruption()}`);

    try {
      info.push(`LocalStorage Keys: ${Object.keys(localStorage).length}`);
    } catch {
      info.push('LocalStorage: Unavailable');
    }

    return info.join('\n');
  }
}

export const cacheManager = new CacheManager();
