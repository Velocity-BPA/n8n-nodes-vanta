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

export const riskOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['risk'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new risk',
				action: 'Create a risk',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get risk by ID',
				action: 'Get a risk',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all risks',
				action: 'Get all risks',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update risk details',
				action: 'Update a risk',
			},
			{
				name: 'Update Treatment',
				value: 'updateTreatment',
				description: 'Update risk treatment plan',
				action: 'Update risk treatment',
			},
		],
		default: 'getAll',
	},
];

export const riskFields: INodeProperties[] = [
	// Risk ID field
	{
		displayName: 'Risk ID',
		name: 'riskId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['get', 'update', 'updateTreatment'],
			},
		},
		description: 'The unique identifier of the risk',
	},

	// Create fields
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['create'],
			},
		},
		description: 'The title of the risk',
	},
	{
		displayName: 'Likelihood',
		name: 'likelihood',
		type: 'options',
		required: true,
		options: [
			{ name: 'Rare', value: 'RARE' },
			{ name: 'Unlikely', value: 'UNLIKELY' },
			{ name: 'Possible', value: 'POSSIBLE' },
			{ name: 'Likely', value: 'LIKELY' },
			{ name: 'Almost Certain', value: 'ALMOST_CERTAIN' },
		],
		default: 'POSSIBLE',
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['create'],
			},
		},
		description: 'The likelihood of the risk occurring',
	},
	{
		displayName: 'Impact',
		name: 'impact',
		type: 'options',
		required: true,
		options: [
			{ name: 'Insignificant', value: 'INSIGNIFICANT' },
			{ name: 'Minor', value: 'MINOR' },
			{ name: 'Moderate', value: 'MODERATE' },
			{ name: 'Major', value: 'MAJOR' },
			{ name: 'Severe', value: 'SEVERE' },
		],
		default: 'MODERATE',
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['create'],
			},
		},
		description: 'The impact of the risk if it occurs',
	},

	// GetAll options
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['getAll'],
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
				resource: ['risk'],
				operation: ['getAll'],
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
				resource: ['risk'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Open', value: 'OPEN' },
					{ name: 'Mitigated', value: 'MITIGATED' },
					{ name: 'Accepted', value: 'ACCEPTED' },
					{ name: 'Transferred', value: 'TRANSFERRED' },
				],
				default: '',
				description: 'Filter by risk status',
			},
		],
	},

	// Additional fields for create
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Description of the risk',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				description: 'User ID of the risk owner',
			},
			{
				displayName: 'Control ID',
				name: 'controlId',
				type: 'string',
				default: '',
				description: 'Associated control ID',
			},
			{
				displayName: 'Treatment Plan',
				name: 'treatmentPlan',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Risk treatment plan description',
			},
		],
	},

	// Update fields
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the risk',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Description of the risk',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Open', value: 'OPEN' },
					{ name: 'Mitigated', value: 'MITIGATED' },
					{ name: 'Accepted', value: 'ACCEPTED' },
					{ name: 'Transferred', value: 'TRANSFERRED' },
				],
				default: 'OPEN',
				description: 'Risk status',
			},
			{
				displayName: 'Likelihood',
				name: 'likelihood',
				type: 'options',
				options: [
					{ name: 'Rare', value: 'RARE' },
					{ name: 'Unlikely', value: 'UNLIKELY' },
					{ name: 'Possible', value: 'POSSIBLE' },
					{ name: 'Likely', value: 'LIKELY' },
					{ name: 'Almost Certain', value: 'ALMOST_CERTAIN' },
				],
				default: 'POSSIBLE',
				description: 'The likelihood of the risk occurring',
			},
			{
				displayName: 'Impact',
				name: 'impact',
				type: 'options',
				options: [
					{ name: 'Insignificant', value: 'INSIGNIFICANT' },
					{ name: 'Minor', value: 'MINOR' },
					{ name: 'Moderate', value: 'MODERATE' },
					{ name: 'Major', value: 'MAJOR' },
					{ name: 'Severe', value: 'SEVERE' },
				],
				default: 'MODERATE',
				description: 'The impact of the risk if it occurs',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				description: 'User ID of the risk owner',
			},
		],
	},

	// Update Treatment fields
	{
		displayName: 'Treatment Plan',
		name: 'treatmentPlan',
		type: 'string',
		required: true,
		typeOptions: {
			rows: 4,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['updateTreatment'],
			},
		},
		description: 'The risk treatment plan description',
	},
];

export const description: INodeProperties[] = [...riskOperations, ...riskFields];

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
				case 'create': {
					const title = this.getNodeParameter('title', i) as string;
					const likelihood = this.getNodeParameter('likelihood', i) as string;
					const impact = this.getNodeParameter('impact', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const body: IDataObject = {
						title,
						likelihood,
						impact,
						...additionalFields,
					};

					responseData = await vantaApiRequest.call(this, 'POST', '/risks', body);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'get': {
					const riskId = this.getNodeParameter('riskId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/risks/${riskId}`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getAll': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					const query: IDataObject = {};

					if (filters.status) query.status = filters.status;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/risks', undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', '/risks', undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'update': {
					const riskId = this.getNodeParameter('riskId', i) as string;
					const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

					responseData = await vantaApiRequest.call(this, 'PUT', `/risks/${riskId}`, updateFields);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'updateTreatment': {
					const riskId = this.getNodeParameter('riskId', i) as string;
					const treatmentPlan = this.getNodeParameter('treatmentPlan', i) as string;

					responseData = await vantaApiRequest.call(this, 'PUT', `/risks/${riskId}/treatment`, { treatmentPlan });
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
