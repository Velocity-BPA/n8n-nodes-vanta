/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { Vanta } from '../../nodes/Vanta/Vanta.node';
import { VantaTrigger } from '../../nodes/Vanta/VantaTrigger.node';

describe('Vanta Node', () => {
  let vantaNode: Vanta;

  beforeEach(() => {
    vantaNode = new Vanta();
  });

  describe('Node Description', () => {
    it('should have correct display name', () => {
      expect(vantaNode.description.displayName).toBe('Vanta');
    });

    it('should have correct name', () => {
      expect(vantaNode.description.name).toBe('vanta');
    });

    it('should have required credentials', () => {
      expect(vantaNode.description.credentials).toHaveLength(1);
      expect(vantaNode.description.credentials?.[0].name).toBe('vantaOAuth2Api');
    });

    it('should have 12 resources', () => {
      const resourceProperty = vantaNode.description.properties.find(
        (p) => p.name === 'resource'
      );
      expect(resourceProperty).toBeDefined();
      expect(resourceProperty?.type).toBe('options');
      
      const options = resourceProperty?.options as Array<{ value: string }>;
      expect(options).toHaveLength(12);
      
      const resourceValues = options.map((o) => o.value);
      expect(resourceValues).toContain('test');
      expect(resourceValues).toContain('control');
      expect(resourceValues).toContain('framework');
      expect(resourceValues).toContain('vulnerability');
      expect(resourceValues).toContain('personnel');
      expect(resourceValues).toContain('vendor');
      expect(resourceValues).toContain('document');
      expect(resourceValues).toContain('integration');
      expect(resourceValues).toContain('computer');
      expect(resourceValues).toContain('securityTask');
      expect(resourceValues).toContain('risk');
      expect(resourceValues).toContain('peopleGroup');
    });

    it('should have version 1', () => {
      expect(vantaNode.description.version).toBe(1);
    });

    it('should be in transform group', () => {
      expect(vantaNode.description.group).toContain('transform');
    });
  });
});

describe('Vanta Trigger Node', () => {
  let vantaTrigger: VantaTrigger;

  beforeEach(() => {
    vantaTrigger = new VantaTrigger();
  });

  describe('Trigger Description', () => {
    it('should have correct display name', () => {
      expect(vantaTrigger.description.displayName).toBe('Vanta Trigger');
    });

    it('should have correct name', () => {
      expect(vantaTrigger.description.name).toBe('vantaTrigger');
    });

    it('should be a polling trigger', () => {
      expect(vantaTrigger.description.polling).toBe(true);
    });

    it('should have 8 event types', () => {
      const eventProperty = vantaTrigger.description.properties.find(
        (p) => p.name === 'event'
      );
      expect(eventProperty).toBeDefined();
      
      const options = eventProperty?.options as Array<{ value: string }>;
      expect(options).toHaveLength(8);
      
      const eventValues = options.map((o) => o.value);
      expect(eventValues).toContain('testFailed');
      expect(eventValues).toContain('vulnerabilityCreated');
      expect(eventValues).toContain('vulnerabilitySLAApproaching');
      expect(eventValues).toContain('controlStatusChanged');
      expect(eventValues).toContain('personnelOffboarded');
      expect(eventValues).toContain('securityTaskOverdue');
      expect(eventValues).toContain('vendorRiskChanged');
      expect(eventValues).toContain('computerNonCompliant');
    });

    it('should have no inputs', () => {
      expect(vantaTrigger.description.inputs).toHaveLength(0);
    });

    it('should have one output', () => {
      expect(vantaTrigger.description.outputs).toHaveLength(1);
    });
  });
});
