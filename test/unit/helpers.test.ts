/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  simplifyOutput,
  returnData,
  formatDateForApi,
  validateRequiredFields,
  cleanObject,
  buildListQuery,
  calculateRiskScore,
  checkSlaDueDate,
  extractDataFromResponse,
  extractPaginationCursor,
} from '../../nodes/Vanta/utils/helpers';

describe('Helper Functions', () => {
  describe('simplifyOutput', () => {
    it('should return original items if no fields specified', () => {
      const items = [{ id: '1', name: 'Test', extra: 'data' }];
      const result = simplifyOutput(items);
      expect(result).toEqual(items);
    });

    it('should return original items if empty fields array', () => {
      const items = [{ id: '1', name: 'Test', extra: 'data' }];
      const result = simplifyOutput(items, []);
      expect(result).toEqual(items);
    });

    it('should filter to specified fields', () => {
      const items = [{ id: '1', name: 'Test', extra: 'data' }];
      const result = simplifyOutput(items, ['id', 'name']);
      expect(result).toEqual([{ id: '1', name: 'Test' }]);
    });

    it('should handle missing fields gracefully', () => {
      const items = [{ id: '1', name: 'Test' }];
      const result = simplifyOutput(items, ['id', 'nonexistent']);
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('returnData', () => {
    it('should convert items to n8n execution data format', () => {
      const items = [{ id: '1' }, { id: '2' }];
      const result = returnData(items);
      expect(result).toEqual([
        { json: { id: '1' } },
        { json: { id: '2' } },
      ]);
    });

    it('should handle empty array', () => {
      const result = returnData([]);
      expect(result).toEqual([]);
    });
  });

  describe('formatDateForApi', () => {
    it('should format Date object to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDateForApi(date);
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should format date string to ISO string', () => {
      const result = formatDateForApi('2024-01-15');
      expect(result).toContain('2024-01-15');
    });
  });

  describe('validateRequiredFields', () => {
    it('should not throw for valid input', () => {
      const input = { name: 'Test', email: 'test@example.com' };
      expect(() => validateRequiredFields(input, ['name', 'email'])).not.toThrow();
    });

    it('should throw for missing fields', () => {
      const input = { name: 'Test' };
      expect(() => validateRequiredFields(input, ['name', 'email'])).toThrow(
        'Missing required fields: email'
      );
    });

    it('should throw for empty string values', () => {
      const input = { name: '', email: 'test@example.com' };
      expect(() => validateRequiredFields(input, ['name', 'email'])).toThrow(
        'Missing required fields: name'
      );
    });

    it('should throw for null values', () => {
      const input = { name: null, email: 'test@example.com' };
      expect(() => validateRequiredFields(input, ['name', 'email'])).toThrow(
        'Missing required fields: name'
      );
    });
  });

  describe('cleanObject', () => {
    it('should remove undefined values', () => {
      const obj = { a: 'value', b: undefined, c: 'another' };
      const result = cleanObject(obj);
      expect(result).toEqual({ a: 'value', c: 'another' });
    });

    it('should remove null values', () => {
      const obj = { a: 'value', b: null, c: 'another' };
      const result = cleanObject(obj);
      expect(result).toEqual({ a: 'value', c: 'another' });
    });

    it('should remove empty string values', () => {
      const obj = { a: 'value', b: '', c: 'another' };
      const result = cleanObject(obj);
      expect(result).toEqual({ a: 'value', c: 'another' });
    });

    it('should keep zero and false values', () => {
      const obj = { a: 0, b: false, c: 'value' };
      const result = cleanObject(obj);
      expect(result).toEqual({ a: 0, b: false, c: 'value' });
    });
  });

  describe('buildListQuery', () => {
    it('should include pageSize and pageCursor', () => {
      const options = { pageSize: 50, pageCursor: 'abc123' };
      const result = buildListQuery(options);
      expect(result).toEqual({ pageSize: 50, pageCursor: 'abc123' });
    });

    it('should include filter parameters', () => {
      const options = { status: 'FAILING', severity: 'HIGH', frameworkId: 'SOC2' };
      const result = buildListQuery(options);
      expect(result).toEqual({ status: 'FAILING', severity: 'HIGH', frameworkId: 'SOC2' });
    });

    it('should ignore non-filter parameters', () => {
      const options = { status: 'FAILING', randomField: 'value' };
      const result = buildListQuery(options);
      expect(result).toEqual({ status: 'FAILING' });
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate correct risk score', () => {
      expect(calculateRiskScore('RARE', 'INSIGNIFICANT')).toBe(1);
      expect(calculateRiskScore('ALMOST_CERTAIN', 'SEVERE')).toBe(25);
      expect(calculateRiskScore('POSSIBLE', 'MODERATE')).toBe(9);
    });

    it('should default to 3x3 for unknown values', () => {
      expect(calculateRiskScore('UNKNOWN', 'UNKNOWN')).toBe(9);
    });
  });

  describe('checkSlaDueDate', () => {
    it('should return OVERDUE for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(checkSlaDueDate(pastDate.toISOString())).toBe('OVERDUE');
    });

    it('should return AT_RISK for dates within 7 days', () => {
      const nearDate = new Date();
      nearDate.setDate(nearDate.getDate() + 3);
      expect(checkSlaDueDate(nearDate.toISOString())).toBe('AT_RISK');
    });

    it('should return ON_TRACK for dates beyond 7 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      expect(checkSlaDueDate(futureDate.toISOString())).toBe('ON_TRACK');
    });
  });

  describe('extractDataFromResponse', () => {
    it('should extract data from nested results structure', () => {
      const response = { results: { data: [{ id: '1' }], pageInfo: {} } };
      const result = extractDataFromResponse(response);
      expect(result).toEqual([{ id: '1' }]);
    });

    it('should extract data from direct data array', () => {
      const response = { data: [{ id: '1' }] };
      const result = extractDataFromResponse(response);
      expect(result).toEqual([{ id: '1' }]);
    });

    it('should handle single item response', () => {
      const response = { id: '1', name: 'Test' };
      const result = extractDataFromResponse(response);
      expect(result).toEqual([{ id: '1', name: 'Test' }]);
    });

    it('should return empty array for unknown format', () => {
      const response = { unknown: 'format' };
      const result = extractDataFromResponse(response);
      expect(result).toEqual([]);
    });
  });

  describe('extractPaginationCursor', () => {
    it('should extract cursor from nested pageInfo', () => {
      const response = {
        results: { pageInfo: { hasNextPage: true, endCursor: 'cursor123' } },
      };
      const result = extractPaginationCursor(response);
      expect(result).toBe('cursor123');
    });

    it('should return undefined when no next page', () => {
      const response = {
        results: { pageInfo: { hasNextPage: false, endCursor: 'cursor123' } },
      };
      const result = extractPaginationCursor(response);
      expect(result).toBeUndefined();
    });

    it('should return undefined when no cursor', () => {
      const response = { results: { pageInfo: { hasNextPage: true } } };
      const result = extractPaginationCursor(response);
      expect(result).toBeUndefined();
    });
  });
});
