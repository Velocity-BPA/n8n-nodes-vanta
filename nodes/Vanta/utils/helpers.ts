/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

/**
 * Simplifies output data by extracting relevant fields
 */
export function simplifyOutput(items: IDataObject[], fields?: string[]): IDataObject[] {
	if (!fields || fields.length === 0) {
		return items;
	}

	return items.map((item) => {
		const simplified: IDataObject = {};
		for (const field of fields) {
			if (item[field] !== undefined) {
				simplified[field] = item[field];
			}
		}
		return simplified;
	});
}

/**
 * Converts API response items to n8n execution data format
 */
export function returnData(items: IDataObject[]): INodeExecutionData[] {
	return items.map((item) => ({
		json: item,
	}));
}

/**
 * Formats date string for API requests
 */
export function formatDateForApi(date: string | Date): string {
	if (date instanceof Date) {
		return date.toISOString();
	}
	return new Date(date).toISOString();
}

/**
 * Parses ISO date string to Date object
 */
export function parseApiDate(dateString: string): Date {
	return new Date(dateString);
}

/**
 * Validates that required fields are present in the input
 */
export function validateRequiredFields(
	input: IDataObject,
	requiredFields: string[],
): void {
	const missingFields: string[] = [];

	for (const field of requiredFields) {
		if (input[field] === undefined || input[field] === null || input[field] === '') {
			missingFields.push(field);
		}
	}

	if (missingFields.length > 0) {
		throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
	}
}

/**
 * Removes undefined and null values from an object
 */
export function cleanObject(obj: IDataObject): IDataObject {
	const cleaned: IDataObject = {};

	for (const [key, value] of Object.entries(obj)) {
		if (value !== undefined && value !== null && value !== '') {
			cleaned[key] = value;
		}
	}

	return cleaned;
}

/**
 * Builds query parameters for list operations
 */
export function buildListQuery(options: IDataObject): IDataObject {
	const query: IDataObject = {};

	if (options.pageSize) {
		query.pageSize = options.pageSize;
	}

	if (options.pageCursor) {
		query.pageCursor = options.pageCursor;
	}

	// Add any filter parameters
	const filterKeys = ['status', 'severity', 'frameworkId', 'controlId', 'integrationId', 'platform', 'complianceStatus', 'groupId', 'employmentType', 'slaStatus', 'priority', 'assigneeId'];

	for (const key of filterKeys) {
		if (options[key]) {
			query[key] = options[key];
		}
	}

	return query;
}

/**
 * Extracts pagination cursor from API response
 */
export function extractPaginationCursor(response: IDataObject): string | undefined {
	const results = response.results as IDataObject | undefined;
	const pageInfo = (results?.pageInfo || response.pageInfo) as IDataObject | undefined;

	if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
		return pageInfo.endCursor as string;
	}

	return undefined;
}

/**
 * Extracts data array from API response
 */
export function extractDataFromResponse(response: IDataObject, dataKey?: string): IDataObject[] {
	// Handle nested results structure
	if (response.results && typeof response.results === 'object') {
		const results = response.results as IDataObject;
		if (Array.isArray(results.data)) {
			return results.data as IDataObject[];
		}
	}

	// Handle direct data key
	if (dataKey && Array.isArray(response[dataKey])) {
		return response[dataKey] as IDataObject[];
	}

	// Handle direct data array
	if (Array.isArray(response.data)) {
		return response.data as IDataObject[];
	}

	// Handle array response
	if (Array.isArray(response)) {
		return response as IDataObject[];
	}

	// Return single item as array
	if (response.id) {
		return [response];
	}

	return [];
}

/**
 * Calculates risk score based on likelihood and impact
 */
export function calculateRiskScore(likelihood: string, impact: string): number {
	const likelihoodScores: Record<string, number> = {
		RARE: 1,
		UNLIKELY: 2,
		POSSIBLE: 3,
		LIKELY: 4,
		ALMOST_CERTAIN: 5,
	};

	const impactScores: Record<string, number> = {
		INSIGNIFICANT: 1,
		MINOR: 2,
		MODERATE: 3,
		MAJOR: 4,
		SEVERE: 5,
	};

	return (likelihoodScores[likelihood] || 3) * (impactScores[impact] || 3);
}

/**
 * Formats a Vanta timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
	return new Date(timestamp).toLocaleString();
}

/**
 * Checks if a date is within SLA
 */
export function checkSlaDueDate(dueDate: string): 'ON_TRACK' | 'AT_RISK' | 'OVERDUE' {
	const now = new Date();
	const due = new Date(dueDate);
	const daysUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

	if (daysUntilDue < 0) {
		return 'OVERDUE';
	} else if (daysUntilDue <= 7) {
		return 'AT_RISK';
	}
	return 'ON_TRACK';
}
