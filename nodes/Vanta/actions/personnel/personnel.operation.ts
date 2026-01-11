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

export const personnelOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['personnel'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get person by ID',
				action: 'Get a person',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all personnel',
				action: 'Get all personnel',
			},
			{
				name: 'Get by Email',
				value: 'getByEmail',
				description: 'Find person by email',
				action: 'Get person by email',
			},
			{
				name: 'Mark Service Account',
				value: 'markServiceAccount',
				description: 'Mark account as service account (not a person)',
				action: 'Mark as service account',
			},
			{
				name: 'Offboard',
				value: 'offboard',
				description: 'Mark person as offboarded',
				action: 'Offboard person',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update person attributes',
				action: 'Update person',
			},
			{
				name: 'Update Group',
				value: 'updateGroup',
				description: "Change person's group assignment",
				action: 'Update person group',
			},
		],
		default: 'getAll',
	},
];

export const personnelFields: INodeProperties[] = [
	// Person ID field
	{
		displayName: 'Person ID',
		name: 'personId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['personnel'],
				operation: ['get', 'update', 'offboard', 'updateGroup', 'markServiceAccount'],
			},
		},
		description: 'The unique identifier of the person',
	},

	// Email field
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@email.com',
		displayOptions: {
			show: {
				resource: ['personnel'],
				operation: ['getByEmail'],
			},
		},
		description: 'The email address of the person to find',
	},

	// GetAll options
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['personnel'],
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
				resource: ['personnel'],
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
				resource: ['personnel'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'ACTIVE' },
					{ name: 'Offboarded', value: 'OFFBOARDED' },
					{ name: 'Pending', value: 'PENDING' },
				],
				default: '',
				description: 'Filter by personnel status',
			},
			{
				displayName: 'Employment Type',
				name: 'employmentType',
				type: 'options',
				options: [
					{ name: 'Employee', value: 'EMPLOYEE' },
					{ name: 'Contractor', value: 'CONTRACTOR' },
					{ name: 'Service Account', value: 'SERVICE_ACCOUNT' },
				],
				default: '',
				description: 'Filter by employment type',
			},
			{
				displayName: 'Group ID',
				name: 'groupId',
				type: 'string',
				default: '',
				description: 'Filter by group ID',
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
				resource: ['personnel'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Display Name',
				name: 'displayName',
				type: 'string',
				default: '',
				description: "Person's display name",
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				description: "Person's first name",
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				description: "Person's last name",
			},
			{
				displayName: 'Employment Type',
				name: 'employmentType',
				type: 'options',
				options: [
					{ name: 'Employee', value: 'EMPLOYEE' },
					{ name: 'Contractor', value: 'CONTRACTOR' },
				],
				default: 'EMPLOYEE',
				description: 'Employment type',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
				description: 'Employment start date',
			},
		],
	},

	// Update Group field
	{
		displayName: 'Group ID',
		name: 'groupId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['personnel'],
				operation: ['updateGroup'],
			},
		},
		description: 'The ID of the group to assign the person to',
	},

	// Offboard fields
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		default: '',
		displayOptions: {
			show: {
				resource: ['personnel'],
				operation: ['offboard'],
			},
		},
		description: 'The offboarding date (defaults to current date if not specified)',
	},
];

export const description: INodeProperties[] = [...personnelOperations, ...personnelFields];

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
					const personId = this.getNodeParameter('personId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/people/${personId}`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getAll': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					const query: IDataObject = {};

					if (filters.status) query.status = filters.status;
					if (filters.employmentType) query.employmentType = filters.employmentType;
					if (filters.groupId) query.groupId = filters.groupId;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/people', undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', '/people', undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getByEmail': {
					const email = this.getNodeParameter('email', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', '/people/by-email', undefined, { email });
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'update': {
					const personId = this.getNodeParameter('personId', i) as string;
					const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

					responseData = await vantaApiRequest.call(this, 'PUT', `/people/${personId}`, updateFields);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'offboard': {
					const personId = this.getNodeParameter('personId', i) as string;
					const endDate = this.getNodeParameter('endDate', i) as string;

					const body: IDataObject = {
						status: 'OFFBOARDED',
					};
					if (endDate) {
						body.endDate = endDate;
					}

					responseData = await vantaApiRequest.call(this, 'PUT', `/people/${personId}/offboard`, body);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'updateGroup': {
					const personId = this.getNodeParameter('personId', i) as string;
					const groupId = this.getNodeParameter('groupId', i) as string;

					responseData = await vantaApiRequest.call(this, 'PUT', `/people/${personId}/group`, { groupId });
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'markServiceAccount': {
					const personId = this.getNodeParameter('personId', i) as string;

					responseData = await vantaApiRequest.call(this, 'PUT', `/people/${personId}/service-account`, {
						isServiceAccount: true,
					});
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
