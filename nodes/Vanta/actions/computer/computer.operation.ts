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

export const computerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['computer'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get computer by ID',
				action: 'Get a computer',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all monitored computers',
				action: 'Get all computers',
			},
			{
				name: 'Get Failing Security Checks',
				value: 'getFailingSecurityChecks',
				description: 'Get computers with failing security checks',
				action: 'Get failing security checks',
			},
			{
				name: 'Update Scope',
				value: 'updateScope',
				description: 'Update computer scope status',
				action: 'Update computer scope',
			},
		],
		default: 'getAll',
	},
];

export const computerFields: INodeProperties[] = [
	// Computer ID field
	{
		displayName: 'Computer ID',
		name: 'computerId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['computer'],
				operation: ['get', 'updateScope'],
			},
		},
		description: 'The unique identifier of the computer',
	},

	// GetAll options
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['computer'],
				operation: ['getAll', 'getFailingSecurityChecks'],
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
				resource: ['computer'],
				operation: ['getAll', 'getFailingSecurityChecks'],
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
				resource: ['computer'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Platform',
				name: 'platform',
				type: 'options',
				options: [
					{ name: 'macOS', value: 'MACOS' },
					{ name: 'Windows', value: 'WINDOWS' },
					{ name: 'Linux', value: 'LINUX' },
				],
				default: '',
				description: 'Filter by operating system platform',
			},
			{
				displayName: 'Compliance Status',
				name: 'complianceStatus',
				type: 'options',
				options: [
					{ name: 'Compliant', value: 'COMPLIANT' },
					{ name: 'Non-Compliant', value: 'NON_COMPLIANT' },
				],
				default: '',
				description: 'Filter by compliance status',
			},
		],
	},

	// Filters for getFailingSecurityChecks
	{
		displayName: 'Security Check Type',
		name: 'securityCheckType',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['computer'],
				operation: ['getFailingSecurityChecks'],
			},
		},
		description: 'Filter by type of security check',
	},

	// Update Scope fields
	{
		displayName: 'In Scope',
		name: 'inScope',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['computer'],
				operation: ['updateScope'],
			},
		},
		description: 'Whether the computer should be in scope for compliance',
	},
];

export const description: INodeProperties[] = [...computerOperations, ...computerFields];

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
					const computerId = this.getNodeParameter('computerId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/computers/${computerId}`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getAll': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					const query: IDataObject = {};

					if (filters.platform) query.platform = filters.platform;
					if (filters.complianceStatus) query.complianceStatus = filters.complianceStatus;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/computers', undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', '/computers', undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getFailingSecurityChecks': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const securityCheckType = this.getNodeParameter('securityCheckType', i) as string;
					const query: IDataObject = {};

					if (securityCheckType) query.securityCheckType = securityCheckType;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/computers/failing-security-checks', undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', '/computers/failing-security-checks', undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'updateScope': {
					const computerId = this.getNodeParameter('computerId', i) as string;
					const inScope = this.getNodeParameter('inScope', i) as boolean;

					responseData = await vantaApiRequest.call(this, 'PUT', `/computers/${computerId}/scope`, { inScope });
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
