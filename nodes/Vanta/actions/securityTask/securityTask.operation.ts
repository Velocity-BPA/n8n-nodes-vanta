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

export const securityTaskOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['securityTask'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get task by ID',
				action: 'Get a security task',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all security tasks',
				action: 'Get all security tasks',
			},
			{
				name: 'Get by Assignee',
				value: 'getByAssignee',
				description: 'Get tasks assigned to a user',
				action: 'Get tasks by assignee',
			},
			{
				name: 'Get Overdue',
				value: 'getOverdue',
				description: 'Get overdue tasks',
				action: 'Get overdue tasks',
			},
			{
				name: 'Update Status',
				value: 'updateStatus',
				description: 'Update task status',
				action: 'Update task status',
			},
		],
		default: 'getAll',
	},
];

export const securityTaskFields: INodeProperties[] = [
	// Task ID field
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['securityTask'],
				operation: ['get', 'updateStatus'],
			},
		},
		description: 'The unique identifier of the task',
	},

	// Assignee ID field
	{
		displayName: 'Assignee ID',
		name: 'assigneeId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['securityTask'],
				operation: ['getByAssignee'],
			},
		},
		description: 'The ID of the user to get tasks for',
	},

	// GetAll options
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['securityTask'],
				operation: ['getAll', 'getOverdue', 'getByAssignee'],
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
				resource: ['securityTask'],
				operation: ['getAll', 'getOverdue', 'getByAssignee'],
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
				resource: ['securityTask'],
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
					{ name: 'In Progress', value: 'IN_PROGRESS' },
					{ name: 'Completed', value: 'COMPLETED' },
					{ name: 'Overdue', value: 'OVERDUE' },
				],
				default: '',
				description: 'Filter by task status',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'Low', value: 'LOW' },
					{ name: 'Medium', value: 'MEDIUM' },
					{ name: 'High', value: 'HIGH' },
					{ name: 'Critical', value: 'CRITICAL' },
				],
				default: '',
				description: 'Filter by priority',
			},
			{
				displayName: 'Assignee ID',
				name: 'assigneeId',
				type: 'string',
				default: '',
				description: 'Filter by assigned user',
			},
		],
	},

	// Update Status fields
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		required: true,
		options: [
			{ name: 'Open', value: 'OPEN' },
			{ name: 'In Progress', value: 'IN_PROGRESS' },
			{ name: 'Completed', value: 'COMPLETED' },
		],
		default: 'OPEN',
		displayOptions: {
			show: {
				resource: ['securityTask'],
				operation: ['updateStatus'],
			},
		},
		description: 'The new status for the task',
	},
];

export const description: INodeProperties[] = [...securityTaskOperations, ...securityTaskFields];

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
					const taskId = this.getNodeParameter('taskId', i) as string;
					responseData = await vantaApiRequest.call(this, 'GET', `/security-tasks/${taskId}`);
					results.push(...returnData([responseData as IDataObject]));
					break;
				}

				case 'getAll': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					const query: IDataObject = {};

					if (filters.status) query.status = filters.status;
					if (filters.priority) query.priority = filters.priority;
					if (filters.assigneeId) query.assigneeId = filters.assigneeId;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/security-tasks', undefined, query);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						query.pageSize = limit;
						const response = await vantaApiRequest.call(this, 'GET', '/security-tasks', undefined, query);
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getOverdue': {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/security-tasks/overdue');
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await vantaApiRequest.call(this, 'GET', '/security-tasks/overdue', undefined, { pageSize: limit });
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'getByAssignee': {
					const assigneeId = this.getNodeParameter('assigneeId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;

					if (returnAll) {
						responseData = await vantaApiRequestAllItems.call(this, 'GET', '/security-tasks', undefined, { assigneeId });
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await vantaApiRequest.call(this, 'GET', '/security-tasks', undefined, { assigneeId, pageSize: limit });
						responseData = ((response.results as IDataObject)?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
					}
					results.push(...returnData(responseData as IDataObject[]));
					break;
				}

				case 'updateStatus': {
					const taskId = this.getNodeParameter('taskId', i) as string;
					const status = this.getNodeParameter('status', i) as string;

					responseData = await vantaApiRequest.call(this, 'PUT', `/security-tasks/${taskId}/status`, { status });
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
