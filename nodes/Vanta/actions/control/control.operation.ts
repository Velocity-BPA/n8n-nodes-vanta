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

const controlOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['control'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get a single control by ID',
				action: 'Get a control',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many controls',
				action: 'Get many controls',
			},
			{
				name: 'Get Tests by Control',
				value: 'getTestsByControl',
				description: 'Get tests associated with a control',
				action: 'Get tests for a control',
			},
			{
				name: 'Update Owner',
				value: 'updateOwner',
				description: 'Update control owner',
				action: 'Update control owner',
			},
			{
				name: 'Update Status',
				value: 'updateStatus',
				description: 'Update control status',
				action: 'Update control status',
			},
		],
		default: 'getAll',
	},
];

const controlFields: INodeProperties[] = [
	{
		displayName: 'Control ID',
		name: 'controlId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['get', 'getTestsByControl', 'updateOwner', 'updateStatus'],
			},
		},
		description: 'The unique identifier of the control',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['getAll', 'getTestsByControl'],
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
				resource: ['control'],
				operation: ['getAll', 'getTestsByControl'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Framework ID',
				name: 'frameworkId',
				type: 'string',
				default: '',
				description: 'Filter by framework ID',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Compliant', value: 'COMPLIANT' },
					{ name: 'Non-Compliant', value: 'NON_COMPLIANT' },
					{ name: 'Not Applicable', value: 'NOT_APPLICABLE' },
					{ name: 'In Progress', value: 'IN_PROGRESS' },
				],
				default: '',
				description: 'Filter by control status',
			},
		],
	},
	{
		displayName: 'Owner ID',
		name: 'ownerId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['updateOwner'],
			},
		},
		description: 'The user ID of the new control owner',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		required: true,
		options: [
			{ name: 'Compliant', value: 'COMPLIANT' },
			{ name: 'Non-Compliant', value: 'NON_COMPLIANT' },
			{ name: 'Not Applicable', value: 'NOT_APPLICABLE' },
			{ name: 'In Progress', value: 'IN_PROGRESS' },
		],
		default: 'COMPLIANT',
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['updateStatus'],
			},
		},
		description: 'The new status for the control',
	},
];

export const description: INodeProperties[] = [...controlOperations, ...controlFields];

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
					const controlId = this.getNodeParameter('controlId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/controls/${controlId}`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getAll': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					const query: IDataObject = {};

					if (filters.frameworkId) query.frameworkId = filters.frameworkId;
					if (filters.status) query.status = filters.status;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/controls', undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', '/controls', undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getTestsByControl': {
					const controlId = this.getNodeParameter('controlId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', `/controls/${controlId}/tests`);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await vantaApiRequest.call(this, 'GET', `/controls/${controlId}/tests`, undefined, { pageSize: limit });
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'updateOwner': {
					const controlId = this.getNodeParameter('controlId', i) as string;
					const ownerId = this.getNodeParameter('ownerId', i) as string;

					responseData = await vantaApiRequest.call(this, 'PUT', `/controls/${controlId}/owner`, { ownerId });
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'updateStatus': {
					const controlId = this.getNodeParameter('controlId', i) as string;
					const status = this.getNodeParameter('status', i) as string;

					responseData = await vantaApiRequest.call(this, 'PUT', `/controls/${controlId}/status`, { status });
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
