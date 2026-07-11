interface StorageOptions {
  fallback?: string | null;
  prefix?: string;
}

class SafeStorage {
  private prefix: string;

  constructor(prefix: string = "lumirra-") {
    this.prefix = prefix;
  }

  getItem(key: string, options: StorageOptions = {}): string | null {
    const fullKey = `${this.prefix}${key}`;
    const { fallback = null } = options;

    try {
      const value = localStorage.getItem(fullKey);
      return value !== null ? value : fallback;
    } catch (error) {
      console.warn(`localStorage.getItem failed for key "${fullKey}":`, error);
      this.removeItem(key);
      return fallback;
    }
  }

  getJSON<T>(key: string, fallback: T): T {
    const value = this.getItem(key);
    if (value === null) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn(`JSON.parse failed for key "${this.prefix}${key}":`, error);
      this.removeItem(key);
      return fallback;
    }
  }

  setItem(key: string, value: string): boolean {
    const fullKey = `${this.prefix}${key}`;

    try {
      localStorage.setItem(fullKey, value);
      return true;
    } catch (error) {
      console.error(`localStorage.setItem failed for key "${fullKey}":`, error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting to clear old data');
        this.clearAll();
        try {
          localStorage.setItem(fullKey, value);
          return true;
        } catch (retryError) {
          console.error('Failed to set item even after clearing:', retryError);
          return false;
        }
      }
      return false;
    }
  }

  setJSON<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      return this.setItem(key, serialized);
    } catch (error) {
      console.error(`JSON.stringify failed for key "${this.prefix}${key}":`, error);
      return false;
    }
  }

  removeItem(key: string): void {
    const fullKey = `${this.prefix}${key}`;
    try {
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.warn(`localStorage.removeItem failed for key "${fullKey}":`, error);
    }
  }

  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove key "${key}":`, e);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Failed to clear all localStorage:', e);
      }
    }
  }

  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  validateJSON(key: string): boolean {
    const value = this.getItem(key);
    if (!value) return true;

    try {
      JSON.parse(value);
      return true;
    } catch {
      console.warn(`Invalid JSON detected in key "${this.prefix}${key}", removing...`);
      this.removeItem(key);
      return false;
    }
  }

  runHealthCheck(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.isAvailable()) {
      issues.push('localStorage is not available');
      return { healthy: false, issues };
    }

    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      
      for (const key of keys) {
        const value = localStorage.getItem(key);
        
        if (value === null) {
          issues.push(`Null value for key: ${key}`);
          continue;
        }

        if (key.includes('-wallet') || key.includes('-user') || key.includes('-settings')) {
          try {
            JSON.parse(value);
          } catch {
            issues.push(`Corrupted JSON in key: ${key}`);
            localStorage.removeItem(key);
          }
        }
      }

      if (keys.length > 100) {
        issues.push(`Too many keys: ${keys.length} (possible memory leak)`);
      }

    } catch (error) {
      issues.push(`Health check failed: ${error}`);
      return { healthy: false, issues };
    }

    return { healthy: issues.length === 0, issues };
  }

  autoCleanup(): number {
    let cleaned = 0;
    
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      
      for (const key of keys) {
        const value = localStorage.getItem(key);
        
        if (!value || value === 'null' || value === 'undefined') {
          localStorage.removeItem(key);
          cleaned++;
          continue;
        }

        if (key.includes('-timestamp')) {
          try {
            const timestamp = parseInt(value);
            const age = Date.now() - timestamp;
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            
            if (age > thirtyDays) {
              localStorage.removeItem(key);
              cleaned++;
            }
          } catch {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      }

      if (cleaned > 0) {
        console.log(`Auto-cleanup removed ${cleaned} stale/corrupted items`);
      }
    } catch (error) {
      console.error('Auto-cleanup failed:', error);
    }

    return cleaned;
  }

  getStorageInfo(): { totalKeys: number; appKeys: number; sizeEstimate: string } {
    try {
      const allKeys = Object.keys(localStorage);
      const appKeys = allKeys.filter(k => k.startsWith(this.prefix));
      
      let totalSize = 0;
      appKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      });

      const sizeInKB = (totalSize / 1024).toFixed(2);
      
      return {
        totalKeys: allKeys.length,
        appKeys: appKeys.length,
        sizeEstimate: `~${sizeInKB} KB`,
      };
    } catch {
      return {
        totalKeys: 0,
        appKeys: 0,
        sizeEstimate: 'Unknown',
      };
    }
  }
}

export const safeStorage = new SafeStorage();
