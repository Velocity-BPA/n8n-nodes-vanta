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

export const documentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['document'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Upload a new document',
				action: 'Upload a document',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a document',
				action: 'Delete a document',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get document by ID',
				action: 'Get a document',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all documents',
				action: 'Get all documents',
			},
			{
				name: 'Get by Evidence Request',
				value: 'getByEvidenceRequest',
				description: 'Get documents for an evidence request',
				action: 'Get documents by evidence request',
			},
			{
				name: 'Upload to Evidence Request',
				value: 'uploadToEvidenceRequest',
				description: 'Upload document to evidence request',
				action: 'Upload to evidence request',
			},
		],
		default: 'getAll',
	},
];

export const documentFields: INodeProperties[] = [
	// Document ID field
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['get', 'delete'],
			},
		},
		description: 'The unique identifier of the document',
	},

	// Evidence Request ID field
	{
		displayName: 'Evidence Request ID',
		name: 'evidenceRequestId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['getByEvidenceRequest', 'uploadToEvidenceRequest'],
			},
		},
		description: 'The unique identifier of the evidence request',
	},

	// Binary Property for upload
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['create', 'uploadToEvidenceRequest'],
			},
		},
		description: 'Name of the binary property containing the file to upload',
	},

	// GetAll options
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['getAll', 'getByEvidenceRequest'],
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
				resource: ['document'],
				operation: ['getAll', 'getByEvidenceRequest'],
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
				resource: ['document'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Control ID',
				name: 'controlId',
				type: 'string',
				default: '',
				description: 'Filter by associated control',
			},
			{
				displayName: 'File Type',
				name: 'fileType',
				type: 'options',
				options: [
					{ name: 'PDF', value: 'PDF' },
					{ name: 'DOCX', value: 'DOCX' },
					{ name: 'XLSX', value: 'XLSX' },
					{ name: 'CSV', value: 'CSV' },
					{ name: 'PNG', value: 'PNG' },
					{ name: 'JPG', value: 'JPG' },
				],
				default: '',
				description: 'Filter by file type',
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
				resource: ['document'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Control ID',
				name: 'controlId',
				type: 'string',
				default: '',
				description: 'Associate document with a control',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description of the document',
			},
		],
	},
];

export const description: INodeProperties[] = [...documentOperations, ...documentFields];

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
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					responseData = await vantaApiUploadFile.call(
						this,
						'/documents',
						binaryPropertyName,
						additionalFields,
					);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'get': {
					const documentId = this.getNodeParameter('documentId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/documents/${documentId}`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getAll': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					const query: IDataObject = {};

					if (filters.controlId) query.controlId = filters.controlId;
					if (filters.fileType) query.fileType = filters.fileType;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/documents', undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', '/documents', undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'delete': {
					const documentId = this.getNodeParameter('documentId', i) as string;
					await vantaApiRequest.call(this, 'DELETE', `/documents/${documentId}`);
					results.push(...returnData([{ success: true, documentId }]));
					break;
				}

				case 'getByEvidenceRequest': {
					const evidenceRequestId = this.getNodeParameter('evidenceRequestId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', `/evidence-requests/${evidenceRequestId}/documents`);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await vantaApiRequest.call(this, 'GET', `/evidence-requests/${evidenceRequestId}/documents`, undefined, { pageSize: limit });
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'uploadToEvidenceRequest': {
					const evidenceRequestId = this.getNodeParameter('evidenceRequestId', i) as string;
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;

					responseData = await vantaApiUploadFile.call(
						this,
						`/evidence-requests/${evidenceRequestId}/documents`,
						binaryPropertyName,
					);
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
