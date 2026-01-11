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
import { vantaApiRequest, vantaApiRequestAllItems, vantaApiUploadFile } from '../../transport';
import { returnData } from '../../utils';

export const vendorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['vendor'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new vendor',
				action: 'Create a vendor',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a vendor',
				action: 'Delete a vendor',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get vendor by ID',
				action: 'Get a vendor',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all vendors',
				action: 'Get all vendors',
			},
			{
				name: 'Get Security Review',
				value: 'getSecurityReview',
				description: 'Get vendor security review status',
				action: 'Get vendor security review',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update vendor details',
				action: 'Update a vendor',
			},
			{
				name: 'Upload Document',
				value: 'uploadDocument',
				description: 'Upload document to vendor',
				action: 'Upload document to vendor',
			},
		],
		default: 'getAll',
	},
];

export const vendorFields: INodeProperties[] = [
	// Vendor ID field
	{
		displayName: 'Vendor ID',
		name: 'vendorId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['get', 'update', 'delete', 'uploadDocument', 'getSecurityReview'],
			},
		},
		description: 'The unique identifier of the vendor',
	},

	// Create fields
	{
		displayName: 'Vendor Name',
		name: 'vendorName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['create'],
			},
		},
		description: 'The name of the vendor',
	},
	{
		displayName: 'Vendor Website',
		name: 'vendorWebsite',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com',
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['create'],
			},
		},
		description: 'The website URL of the vendor',
	},
	{
		displayName: 'Vendor Category',
		name: 'vendorCategory',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['create'],
			},
		},
		description: 'The category of the vendor',
	},

	// GetAll options
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['vendor'],
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
				resource: ['vendor'],
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
				resource: ['vendor'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Risk Level',
				name: 'riskLevel',
				type: 'options',
				options: [
					{ name: 'Low', value: 'LOW' },
					{ name: 'Medium', value: 'MEDIUM' },
					{ name: 'High', value: 'HIGH' },
					{ name: 'Critical', value: 'CRITICAL' },
				],
				default: '',
				description: 'Filter by risk level',
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
				resource: ['vendor'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description of the vendor',
			},
			{
				displayName: 'Risk Level',
				name: 'riskLevel',
				type: 'options',
				options: [
					{ name: 'Low', value: 'LOW' },
					{ name: 'Medium', value: 'MEDIUM' },
					{ name: 'High', value: 'HIGH' },
					{ name: 'Critical', value: 'CRITICAL' },
				],
				default: 'MEDIUM',
				description: 'Risk level of the vendor',
			},
			{
				displayName: 'Contact Email',
				name: 'contactEmail',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
				description: 'Contact email for the vendor',
			},
			{
				displayName: 'Contact Name',
				name: 'contactName',
				type: 'string',
				default: '',
				description: 'Contact name for the vendor',
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
				resource: ['vendor'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Vendor Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'The name of the vendor',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'The website URL of the vendor',
			},
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
				description: 'The category of the vendor',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description of the vendor',
			},
			{
				displayName: 'Risk Level',
				name: 'riskLevel',
				type: 'options',
				options: [
					{ name: 'Low', value: 'LOW' },
					{ name: 'Medium', value: 'MEDIUM' },
					{ name: 'High', value: 'HIGH' },
					{ name: 'Critical', value: 'CRITICAL' },
				],
				default: 'MEDIUM',
				description: 'Risk level of the vendor',
			},
			{
				displayName: 'Contact Email',
				name: 'contactEmail',
				type: 'string',
				default: '',
				description: 'Contact email for the vendor',
			},
			{
				displayName: 'Contact Name',
				name: 'contactName',
				type: 'string',
				default: '',
				description: 'Contact name for the vendor',
			},
		],
	},

	// Upload document fields
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['uploadDocument'],
			},
		},
		description: 'Name of the binary property containing the file to upload',
	},
];

export const description: INodeProperties[] = [...vendorOperations, ...vendorFields];

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
					const vendorName = this.getNodeParameter('vendorName', i) as string;
					const vendorWebsite = this.getNodeParameter('vendorWebsite', i) as string;
					const vendorCategory = this.getNodeParameter('vendorCategory', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const body: IDataObject = {
						name: vendorName,
						website: vendorWebsite,
						category: vendorCategory,
						...additionalFields,
					};

					responseData = await vantaApiRequest.call(this, 'POST', '/vendors', body);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'get': {
					const vendorId = this.getNodeParameter('vendorId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/vendors/${vendorId}`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getAll': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					const query: IDataObject = {};

					if (filters.riskLevel) query.riskLevel = filters.riskLevel;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/vendors', undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', '/vendors', undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'update': {
					const vendorId = this.getNodeParameter('vendorId', i) as string;
					const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

					responseData = await vantaApiRequest.call(this, 'PUT', `/vendors/${vendorId}`, updateFields);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'delete': {
					const vendorId = this.getNodeParameter('vendorId', i) as string;
					await vantaApiRequest.call(this, 'DELETE', `/vendors/${vendorId}`);
					results.push(...returnData([{ success: true, vendorId }]));
					break;
				}

				case 'uploadDocument': {
					const vendorId = this.getNodeParameter('vendorId', i) as string;
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;

					responseData = await vantaApiUploadFile.call(
						this,
						`/vendors/${vendorId}/documents`,
						binaryPropertyName,
					);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getSecurityReview': {
					const vendorId = this.getNodeParameter('vendorId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/vendors/${vendorId}/security-review`);
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
