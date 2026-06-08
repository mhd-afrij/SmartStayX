import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ConfigManager, { config } from '../../config/ConfigManager';

describe('ConfigManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ConfigManager();
    manager.resetOverrides();
  });

  describe('singleton', () => {
    it('returns same instance', () => {
      const instance1 = new ConfigManager();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('get with dot notation', () => {
    it('returns nested config value', () => {
      expect(manager.get('app.name')).toBe('SmartStayX');
    });

    it('returns default for missing key', () => {
      expect(manager.get('nonexistent.key', 'fallback')).toBe('fallback');
    });

    it('returns null default for missing key when not specified', () => {
      expect(manager.get('nonexistent.key')).toBeNull();
    });

    it('returns default when intermediate value is null', () => {
      expect(manager.get('api.baseUrl.nested', 'fallback')).toBe('fallback');
    });
  });

  describe('getApi', () => {
    it('prepends api prefix', () => {
      expect(manager.getApi('baseUrl')).toBe('');
    });

    it('returns default for missing api key', () => {
      expect(manager.getApi('missing')).toBeFalsy();
    });
  });

  describe('getFeature', () => {
    it('returns feature flag with default false', () => {
      expect(manager.getFeature('enableChat')).toBe(true);
    });

    it('returns false for missing feature', () => {
      expect(manager.getFeature('nonexistent')).toBe(false);
    });
  });

  describe('override', () => {
    it('overrides a config value', () => {
      manager.override('app.name', 'OverrideName');
      expect(manager.get('app.name')).toBe('OverrideName');
    });

    it('original config is unchanged when overridden', () => {
      manager.override('app.name', 'OverrideName');
      expect(manager.get('app.name')).toBe('OverrideName');

      manager.resetOverrides();
      expect(manager.get('app.name')).toBe('SmartStayX');
    });
  });

  describe('resetOverrides', () => {
    it('clears all overrides', () => {
      manager.override('app.name', 'OverrideName');
      manager.override('api.timeout', 9999);
      manager.resetOverrides();
      expect(manager.get('app.name')).toBe('SmartStayX');
      expect(manager.get('api.timeout')).toBe(30000);
    });
  });

  describe('getAll', () => {
    it('returns a copy of entire config', () => {
      const all = manager.getAll();
      expect(all.app.name).toBe('SmartStayX');
      expect(all.api.timeout).toBe(30000);
    });

    it('modifying returned object does not affect config', () => {
      const all = manager.getAll();
      all.app.name = 'Hacked';
      expect(manager.get('app.name')).toBe('SmartStayX');
    });
  });

  describe('isProduction / isDevelopment', () => {
    it('isProduction returns false in test', () => {
      expect(manager.isProduction()).toBe(false);
    });

    it('isDevelopment returns false in test', () => {
      expect(manager.isDevelopment()).toBe(false);
    });
  });
});

describe('shared config singleton', () => {
  it('is a ConfigManager instance', () => {
    expect(config.get).toBeDefined();
    expect(config.get('app.name')).toBe('SmartStayX');
  });
});
