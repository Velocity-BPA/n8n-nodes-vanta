/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import * as computer from './actions/computer';
import * as control from './actions/control';
import * as document from './actions/document';
import * as framework from './actions/framework';
import * as integration from './actions/integration';
import * as peopleGroup from './actions/peopleGroup';
import * as personnel from './actions/personnel';
import * as risk from './actions/risk';
import * as securityTask from './actions/securityTask';
import * as test from './actions/test';
import * as vendor from './actions/vendor';
import * as vulnerability from './actions/vulnerability';

// Runtime licensing notice - logged once per node load
const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]
This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;

let licensingNoticeLogged = false;

function logLicensingNotice(): void {
	if (!licensingNoticeLogged) {
		console.warn(LICENSING_NOTICE);
		licensingNoticeLogged = true;
	}
}

export class Vanta implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Vanta',
		name: 'vanta',
		icon: 'file:vanta.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Vanta compliance automation platform API',
		defaults: {
			name: 'Vanta',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'vantaOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Computer',
						value: 'computer',
					},
					{
						name: 'Control',
						value: 'control',
					},
					{
						name: 'Document',
						value: 'document',
					},
					{
						name: 'Framework',
						value: 'framework',
					},
					{
						name: 'Integration',
						value: 'integration',
					},
					{
						name: 'People Group',
						value: 'peopleGroup',
					},
					{
						name: 'Personnel',
						value: 'personnel',
					},
					{
						name: 'Risk',
						value: 'risk',
					},
					{
						name: 'Security Task',
						value: 'securityTask',
					},
					{
						name: 'Test',
						value: 'test',
					},
					{
						name: 'Vendor',
						value: 'vendor',
					},
					{
						name: 'Vulnerability',
						value: 'vulnerability',
					},
				],
				default: 'test',
			},
			// Test operations
			...test.test.description,
			// Control operations
			...control.control.description,
			// Framework operations
			...framework.framework.description,
			// Vulnerability operations
			...vulnerability.vulnerability.description,
			// Personnel operations
			...personnel.personnel.description,
			// Vendor operations
			...vendor.vendor.description,
			// Document operations
			...document.document.description,
			// Integration operations
			...integration.integration.description,
			// Computer operations
			...computer.computer.description,
			// Security Task operations
			...securityTask.securityTask.description,
			// Risk operations
			...risk.risk.description,
			// People Group operations
			...peopleGroup.peopleGroup.description,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		logLicensingNotice();

		const items = this.getInputData();
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		let returnData: INodeExecutionData[] = [];

		switch (resource) {
			case 'computer':
				returnData = await computer.computer.execute.call(this, items, operation);
				break;
			case 'control':
				returnData = await control.control.execute.call(this, items, operation);
				break;
			case 'document':
				returnData = await document.document.execute.call(this, items, operation);
				break;
			case 'framework':
				returnData = await framework.framework.execute.call(this, items, operation);
				break;
			case 'integration':
				returnData = await integration.integration.execute.call(this, items, operation);
				break;
			case 'peopleGroup':
				returnData = await peopleGroup.peopleGroup.execute.call(this, items, operation);
				break;
			case 'personnel':
				returnData = await personnel.personnel.execute.call(this, items, operation);
				break;
			case 'risk':
				returnData = await risk.risk.execute.call(this, items, operation);
				break;
			case 'securityTask':
				returnData = await securityTask.securityTask.execute.call(this, items, operation);
				break;
			case 'test':
				returnData = await test.test.execute.call(this, items, operation);
				break;
			case 'vendor':
				returnData = await vendor.vendor.execute.call(this, items, operation);
				break;
			case 'vulnerability':
				returnData = await vulnerability.vulnerability.execute.call(this, items, operation);
				break;
			default:
				throw new Error(`Resource ${resource} is not supported`);
		}

		return [returnData];
	}
}
