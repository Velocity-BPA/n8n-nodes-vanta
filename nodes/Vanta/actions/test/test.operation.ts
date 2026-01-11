/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { vantaApiRequest, vantaApiRequestAllItems } from '../../transport';
import { returnData } from '../../utils';

export const testOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['test'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get a single test by ID',
				action: 'Get a test',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all tests',
				action: 'Get all tests',
			},
			{
				name: 'Get Failing Resources',
				value: 'getFailingResources',
				description: 'Get resources failing a specific test',
				action: 'Get failing resources for a test',
			},
			{
				name: 'Get Results',
				value: 'getResults',
				description: 'Get test results for a specific test',
				action: 'Get test results',
			},
			{
				name: 'Deactivate Monitoring',
				value: 'deactivateMonitoring',
				description: 'Deactivate monitoring for specific resources on a test',
				action: 'Deactivate test monitoring',
			},
			{
				name: 'Update Resource Scope',
				value: 'updateResourceScope',
				description: 'Mark resources in/out of scope for a test',
				action: 'Update resource scope for a test',
			},
		],
		default: 'getAll',
	},
];

export const testFields: INodeProperties[] = [
	// Get operation
	{
		displayName: 'Test ID',
		name: 'testId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['test'],
				operation: ['get', 'getResults', 'getFailingResources', 'updateResourceScope', 'deactivateMonitoring'],
			},
		},
		description: 'The unique identifier of the test',
	},

	// GetAll operation
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['test'],
				operation: ['getAll', 'getResults', 'getFailingResources'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['test'],
				operation: ['getAll', 'getResults', 'getFailingResources'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},

	// Filters for getAll
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['test'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Passing', value: 'PASSING' },
					{ name: 'Failing', value: 'FAILING' },
					{ name: 'Disabled', value: 'DISABLED' },
					{ name: 'Not Applicable', value: 'NOT_APPLICABLE' },
				],
				default: '',
				description: 'Filter by test status',
			},
			{
				displayName: 'Framework ID',
				name: 'frameworkId',
				type: 'string',
				default: '',
				description: 'Filter by compliance framework ID',
			},
			{
				displayName: 'Control ID',
				name: 'controlId',
				type: 'string',
				default: '',
				description: 'Filter by control ID',
			},
		],
	},

	// Update Resource Scope fields
	{
		displayName: 'Resource ID',
		name: 'resourceId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['test'],
				operation: ['updateResourceScope', 'deactivateMonitoring'],
			},
		},
		description: 'The unique identifier of the resource',
	},
	{
		displayName: 'In Scope',
		name: 'inScope',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['test'],
				operation: ['updateResourceScope'],
			},
		},
		description: 'Whether the resource should be in scope for this test',
	},
];

export const description: INodeProperties[] = [...testOperations, ...testFields];

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
	operation: string,
): Promise<INodeExecutionData[]> {
	const results: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			let responseData: IDataObject | IDataObject[];

			switch (operation) {
				case 'get': {
					const testId = this.getNodeParameter('testId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/tests/${testId}`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getAll': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					const query: IDataObject = {};

					if (filters.status) query.status = filters.status;
					if (filters.frameworkId) query.frameworkId = filters.frameworkId;
					if (filters.controlId) query.controlId = filters.controlId;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/tests', undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', '/tests', undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getResults': {
					const testId = this.getNodeParameter('testId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', `/tests/${testId}/results`);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await vantaApiRequest.call(this, 'GET', `/tests/${testId}/results`, undefined, { pageSize: limit });
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getFailingResources': {
					const testId = this.getNodeParameter('testId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', `/tests/${testId}/failing-resources`);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await vantaApiRequest.call(this, 'GET', `/tests/${testId}/failing-resources`, undefined, { pageSize: limit });
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'updateResourceScope': {
					const testId = this.getNodeParameter('testId', i) as string;
					const resourceId = this.getNodeParameter('resourceId', i) as string;
					const inScope = this.getNodeParameter('inScope', i) as boolean;

					responseData = await vantaApiRequest.call(this, 'PUT', `/tests/${testId}/resources/${resourceId}/scope`, {
						inScope,
					});
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'deactivateMonitoring': {
					const testId = this.getNodeParameter('testId', i) as string;
					const resourceId = this.getNodeParameter('resourceId', i) as string;

					responseData = await vantaApiRequest.call(this, 'POST', `/tests/${testId}/resources/${resourceId}/deactivate`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				default:
					throw new Error(`Unknown operation: ${operation}`);
			}
		} catch (error) {
			if (this.continueOnFail()) {
				results.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
				continue;
			}
			throw error;
		}
	}

	return results;
}
