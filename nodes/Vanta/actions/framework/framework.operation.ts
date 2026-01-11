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

export const frameworkOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['framework'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get framework details',
				action: 'Get a framework',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all enabled frameworks',
				action: 'Get all frameworks',
			},
			{
				name: 'Get Compliance Status',
				value: 'getComplianceStatus',
				description: 'Get overall compliance status for a framework',
				action: 'Get framework compliance status',
			},
			{
				name: 'Get Controls',
				value: 'getControls',
				description: 'Get controls for a framework',
				action: 'Get framework controls',
			},
		],
		default: 'getAll',
	},
];

export const frameworkFields: INodeProperties[] = [
	// Framework ID field
	{
		displayName: 'Framework ID',
		name: 'frameworkId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['framework'],
				operation: ['get', 'getControls', 'getComplianceStatus'],
			},
		},
		description: 'The unique identifier of the framework',
	},

	// GetAll options
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['framework'],
				operation: ['getAll', 'getControls'],
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
				resource: ['framework'],
				operation: ['getAll', 'getControls'],
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
				resource: ['framework'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Framework Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'SOC 2', value: 'SOC2' },
					{ name: 'ISO 27001', value: 'ISO27001' },
					{ name: 'HIPAA', value: 'HIPAA' },
					{ name: 'GDPR', value: 'GDPR' },
					{ name: 'PCI DSS', value: 'PCI_DSS' },
					{ name: 'SOC 1', value: 'SOC1' },
					{ name: 'NIST CSF', value: 'NIST_CSF' },
					{ name: 'NIST 800-53', value: 'NIST_800_53' },
					{ name: 'NIST 800-171', value: 'NIST_800_171' },
					{ name: 'CCPA', value: 'CCPA' },
					{ name: 'CMMC', value: 'CMMC' },
				],
				default: '',
				description: 'Filter by framework type',
			},
		],
	},
];

export const description: INodeProperties[] = [...frameworkOperations, ...frameworkFields];

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
					const frameworkId = this.getNodeParameter('frameworkId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/frameworks/${frameworkId}`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getAll': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					const query: IDataObject = {};

					if (filters.type) query.type = filters.type;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/frameworks', undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', '/frameworks', undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getControls': {
					const frameworkId = this.getNodeParameter('frameworkId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', `/frameworks/${frameworkId}/controls`);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await vantaApiRequest.call(this, 'GET', `/frameworks/${frameworkId}/controls`, undefined, { pageSize: limit });
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getComplianceStatus': {
					const frameworkId = this.getNodeParameter('frameworkId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/frameworks/${frameworkId}/compliance-status`);
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
