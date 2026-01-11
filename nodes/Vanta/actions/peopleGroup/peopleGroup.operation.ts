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

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['peopleGroup'],
			},
		},
		options: [
			{
				name: 'Add Member',
				value: 'addMember',
				description: 'Add a person to a group',
				action: 'Add member to group',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new people group',
				action: 'Create a people group',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a people group',
				action: 'Delete a people group',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a people group by ID',
				action: 'Get a people group',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many people groups',
				action: 'Get many people groups',
			},
			{
				name: 'Remove Member',
				value: 'removeMember',
				description: 'Remove a person from a group',
				action: 'Remove member from group',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a people group',
				action: 'Update a people group',
			},
		],
		default: 'getAll',
	},
	// ----------------------------------
	//         peopleGroup: create
	// ----------------------------------
	{
		displayName: 'Group Name',
		name: 'groupName',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the people group',
		displayOptions: {
			show: {
				resource: ['peopleGroup'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['peopleGroup'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description of the group',
			},
		],
	},
	// ----------------------------------
	//         peopleGroup: get
	// ----------------------------------
	{
		displayName: 'Group ID',
		name: 'groupId',
		type: 'string',
		required: true,
		default: '',
		description: 'Unique identifier of the people group',
		displayOptions: {
			show: {
				resource: ['peopleGroup'],
				operation: ['get', 'delete', 'update', 'addMember', 'removeMember'],
			},
		},
	},
	// ----------------------------------
	//         peopleGroup: getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['peopleGroup'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['peopleGroup'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
	},
	// ----------------------------------
	//         peopleGroup: update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['peopleGroup'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description of the group',
			},
			{
				displayName: 'Group Name',
				name: 'groupName',
				type: 'string',
				default: '',
				description: 'Name of the group',
			},
		],
	},
	// ----------------------------------
	//         peopleGroup: addMember / removeMember
	// ----------------------------------
	{
		displayName: 'Person ID',
		name: 'personId',
		type: 'string',
		required: true,
		default: '',
		description: 'Unique identifier of the person to add or remove',
		displayOptions: {
			show: {
				resource: ['peopleGroup'],
				operation: ['addMember', 'removeMember'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
	operation: string,
): Promise<INodeExecutionData[]> {
	const results: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			let responseData: IDataObject | IDataObject[] = {};

			if (operation === 'create') {
				const groupName = this.getNodeParameter('groupName', i) as string;
				const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

				const body: IDataObject = {
					name: groupName,
				};

				if (additionalFields.description) {
					body.description = additionalFields.description;
				}

				responseData = await vantaApiRequest.call(
					this,
					'POST',
					'/people-groups',
					body,
				);
			}

			if (operation === 'get') {
				const groupId = this.getNodeParameter('groupId', i) as string;

				responseData = await vantaApiRequest.call(
					this,
					'GET',
					`/people-groups/${groupId}`,
				);
			}

			if (operation === 'getAll') {
				const returnAll = this.getNodeParameter('returnAll', i) as boolean;
				const limit = this.getNodeParameter('limit', i, 50) as number;

				if (returnAll) {
					responseData = await vantaApiRequestAllItems.call(
						this,
						'GET',
						'/people-groups',
					);
				} else {
					const response = await vantaApiRequest.call(
						this,
						'GET',
						'/people-groups',
						undefined,
						{ pageSize: limit },
					);
					const results = response.results as IDataObject | undefined;
					responseData = (results?.data as IDataObject[]) || (response.data as IDataObject[]) || [];
				}
			}

			if (operation === 'update') {
				const groupId = this.getNodeParameter('groupId', i) as string;
				const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

				const body: IDataObject = {};

				if (updateFields.groupName) {
					body.name = updateFields.groupName;
				}

				if (updateFields.description) {
					body.description = updateFields.description;
				}

				responseData = await vantaApiRequest.call(
					this,
					'PUT',
					`/people-groups/${groupId}`,
					body,
				);
			}

			if (operation === 'delete') {
				const groupId = this.getNodeParameter('groupId', i) as string;

				await vantaApiRequest.call(
					this,
					'DELETE',
					`/people-groups/${groupId}`,
				);

				responseData = { success: true, groupId };
			}

			if (operation === 'addMember') {
				const groupId = this.getNodeParameter('groupId', i) as string;
				const personId = this.getNodeParameter('personId', i) as string;

				responseData = await vantaApiRequest.call(
					this,
					'POST',
					`/people-groups/${groupId}/members`,
					{ personId },
				);
			}

			if (operation === 'removeMember') {
				const groupId = this.getNodeParameter('groupId', i) as string;
				const personId = this.getNodeParameter('personId', i) as string;

				await vantaApiRequest.call(
					this,
					'DELETE',
					`/people-groups/${groupId}/members/${personId}`,
				);

				responseData = { success: true, groupId, personId };
			}

			const dataArray = Array.isArray(responseData) ? responseData : [responseData];
			results.push(...returnData(dataArray));
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
