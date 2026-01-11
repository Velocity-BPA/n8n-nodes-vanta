/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { VantaOAuth2Api } from '../../credentials/VantaOAuth2Api.credentials';

describe('VantaOAuth2Api Credentials', () => {
  let credentials: VantaOAuth2Api;

  beforeEach(() => {
    credentials = new VantaOAuth2Api();
  });

  describe('Basic Configuration', () => {
    it('should have correct name', () => {
      expect(credentials.name).toBe('vantaOAuth2Api');
    });

    it('should have correct display name', () => {
      expect(credentials.displayName).toBe('Vanta OAuth2 API');
    });

    it('should have documentation URL', () => {
      expect(credentials.documentationUrl).toBe('https://developer.vanta.com/docs/quick-start');
    });
  });

  describe('Properties', () => {
    it('should have clientId property', () => {
      const clientIdProp = credentials.properties.find((p) => p.name === 'clientId');
      expect(clientIdProp).toBeDefined();
      expect(clientIdProp?.required).toBe(true);
      expect(clientIdProp?.type).toBe('string');
    });

    it('should have clientSecret property with password type', () => {
      const clientSecretProp = credentials.properties.find((p) => p.name === 'clientSecret');
      expect(clientSecretProp).toBeDefined();
      expect(clientSecretProp?.required).toBe(true);
      expect(clientSecretProp?.typeOptions?.password).toBe(true);
    });

    it('should have scope property with default value', () => {
      const scopeProp = credentials.properties.find((p) => p.name === 'scope');
      expect(scopeProp).toBeDefined();
      expect(scopeProp?.default).toBe('vanta-api.all:read vanta-api.all:write');
    });

    it('should have environment property with 3 options', () => {
      const envProp = credentials.properties.find((p) => p.name === 'environment');
      expect(envProp).toBeDefined();
      expect(envProp?.type).toBe('options');
      expect(envProp?.options).toHaveLength(3);
      
      const options = envProp?.options as Array<{ value: string }>;
      const values = options.map((o) => o.value);
      expect(values).toContain('us');
      expect(values).toContain('eu');
      expect(values).toContain('aus');
    });

    it('should have US as default environment', () => {
      const envProp = credentials.properties.find((p) => p.name === 'environment');
      expect(envProp?.default).toBe('us');
    });
  });
});
