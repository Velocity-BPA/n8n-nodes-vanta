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

export const integrationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['integration'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get integration details',
				action: 'Get an integration',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all connected integrations',
				action: 'Get all integrations',
			},
			{
				name: 'Get Resource Kinds',
				value: 'getResourceKinds',
				description: 'Get supported resource types for integration',
				action: 'Get integration resource kinds',
			},
			{
				name: 'Get Resources',
				value: 'getResources',
				description: 'Get resources from an integration',
				action: 'Get integration resources',
			},
		],
		default: 'getAll',
	},
];

export const integrationFields: INodeProperties[] = [
	// Integration ID field
	{
		displayName: 'Integration ID',
		name: 'integrationId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['integration'],
				operation: ['get', 'getResources', 'getResourceKinds'],
			},
		},
		description: 'The identifier of the integration (e.g., aws, gcp, azure, okta)',
		placeholder: 'aws',
	},

	// GetAll options
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['integration'],
				operation: ['getAll', 'getResources'],
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
				resource: ['integration'],
				operation: ['getAll', 'getResources'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},

	// Resource Kind filter for getResources
	{
		displayName: 'Resource Kind',
		name: 'resourceKind',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['integration'],
				operation: ['getResources'],
			},
		},
		description: 'Filter by resource type (e.g., EC2Instance, User)',
		placeholder: 'EC2Instance',
	},
];

export const description: INodeProperties[] = [...integrationOperations, ...integrationFields];

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
					const integrationId = this.getNodeParameter('integrationId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/integrations/${integrationId}`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getAll': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/integrations');
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await vantaApiRequest.call(this, 'GET', '/integrations', undefined, { pageSize: limit });
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getResources': {
					const integrationId = this.getNodeParameter('integrationId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const resourceKind = this.getNodeParameter('resourceKind', i) as string;
					const query: IDataObject = {};

					if (resourceKind) query.resourceKind = resourceKind;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', `/integrations/${integrationId}/resources`, undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', `/integrations/${integrationId}/resources`, undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getResourceKinds': {
					const integrationId = this.getNodeParameter('integrationId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/integrations/${integrationId}/resource-kinds`);
					const data = (responseData as IDataObject).data || responseData;
					results.push(...returnData(Array.isArray(data) ? data as IDataObject[] : [data as IDataObject]));
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
