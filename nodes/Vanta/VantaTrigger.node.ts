/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	INodeExecutionData,
} from 'n8n-workflow';

import { vantaApiRequestAllItems } from './transport';

// Runtime licensing notice
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

// Standalone poll functions
async function pollTestFailed(
	context: IPollFunctions,
	options: IDataObject,
): Promise<INodeExecutionData[]> {
	const query: IDataObject = { status: 'FAILING' };

	if (options.frameworkId) {
		query.frameworkId = options.frameworkId;
	}

	const tests = await vantaApiRequestAllItems.call(
		context,
		'GET',
		'/tests',
		undefined,
		query,
	);

	// Get previously known failing tests
	const webhookData = context.getWorkflowStaticData('node');
	const previousFailingTests = (webhookData.failingTestIds as string[]) || [];

	// Filter to only new failing tests
	const newFailingTests = tests.filter(
		(test: IDataObject) => !previousFailingTests.includes(test.id as string),
	);

	// Update state with current failing tests
	webhookData.failingTestIds = tests.map((test: IDataObject) => test.id);

	return newFailingTests.map((test: IDataObject) => ({
		json: { ...test, event: 'testFailed' },
	}));
}

async function pollVulnerabilityCreated(
	context: IPollFunctions,
	options: IDataObject,
	lastChecked: string,
): Promise<INodeExecutionData[]> {
	const query: IDataObject = {
		createdAfter: lastChecked,
	};

	if (options.severity && (options.severity as string[]).length > 0) {
		query.severity = (options.severity as string[]).join(',');
	}

	const vulnerabilities = await vantaApiRequestAllItems.call(
		context,
		'GET',
		'/vulnerabilities',
		undefined,
		query,
	);

	return vulnerabilities.map((vuln: IDataObject) => ({
		json: { ...vuln, event: 'vulnerabilityCreated' },
	}));
}

async function pollVulnerabilitySLA(
	context: IPollFunctions,
	options: IDataObject,
): Promise<INodeExecutionData[]> {
	const slaDaysWarning = (options.slaDaysWarning as number) || 7;
	const warningDate = new Date();
	warningDate.setDate(warningDate.getDate() + slaDaysWarning);

	const vulnerabilities = await vantaApiRequestAllItems.call(
		context,
		'GET',
		'/vulnerabilities',
		undefined,
		{ status: 'OPEN', slaStatus: 'AT_RISK' },
	);

	// Filter vulnerabilities with SLA approaching
	const approachingSLA = vulnerabilities.filter((vuln: IDataObject) => {
		if (!vuln.slaDeadline) return false;
		const deadline = new Date(vuln.slaDeadline as string);
		return deadline <= warningDate;
	});

	// Get previously warned vulnerabilities
	const webhookData = context.getWorkflowStaticData('node');
	const previouslyWarned = (webhookData.warnedVulnIds as string[]) || [];

	// Filter to only new warnings
	const newWarnings = approachingSLA.filter(
		(vuln: IDataObject) => !previouslyWarned.includes(vuln.id as string),
	);

	// Update state
	webhookData.warnedVulnIds = approachingSLA.map((vuln: IDataObject) => vuln.id);

	return newWarnings.map((vuln: IDataObject) => ({
		json: { ...vuln, event: 'vulnerabilitySLAApproaching', slaDaysWarning },
	}));
}

async function pollControlStatusChanged(
	context: IPollFunctions,
	options: IDataObject,
): Promise<INodeExecutionData[]> {
	const query: IDataObject = {};

	if (options.frameworkId) {
		query.frameworkId = options.frameworkId;
	}

	const controls = await vantaApiRequestAllItems.call(
		context,
		'GET',
		'/controls',
		undefined,
		query,
	);

	// Get previous control states
	const webhookData = context.getWorkflowStaticData('node');
	const previousControlStates = (webhookData.controlStates as IDataObject) || {};

	// Find controls with changed status
	const changedControls = controls.filter((control: IDataObject) => {
		const previousStatus = previousControlStates[control.id as string];
		return previousStatus !== undefined && previousStatus !== control.status;
	});

	// Update state with current control statuses
	const newControlStates: IDataObject = {};
	for (const control of controls) {
		newControlStates[control.id as string] = control.status;
	}
	webhookData.controlStates = newControlStates;

	return changedControls.map((control: IDataObject) => ({
		json: {
			...control,
			event: 'controlStatusChanged',
			previousStatus: previousControlStates[control.id as string],
		},
	}));
}

async function pollPersonnelOffboarded(
	context: IPollFunctions,
	lastChecked: string,
): Promise<INodeExecutionData[]> {
	const personnel = await vantaApiRequestAllItems.call(
		context,
		'GET',
		'/people',
		undefined,
		{ status: 'OFFBOARDED', updatedAfter: lastChecked },
	);

	return personnel.map((person: IDataObject) => ({
		json: { ...person, event: 'personnelOffboarded' },
	}));
}

async function pollSecurityTaskOverdue(
	context: IPollFunctions,
): Promise<INodeExecutionData[]> {
	const tasks = await vantaApiRequestAllItems.call(
		context,
		'GET',
		'/security-tasks',
		undefined,
		{ status: 'OVERDUE' },
	);

	// Get previously reported overdue tasks
	const webhookData = context.getWorkflowStaticData('node');
	const previouslyOverdue = (webhookData.overdueTaskIds as string[]) || [];

	// Filter to only newly overdue tasks
	const newlyOverdue = tasks.filter(
		(task: IDataObject) => !previouslyOverdue.includes(task.id as string),
	);

	// Update state
	webhookData.overdueTaskIds = tasks.map((task: IDataObject) => task.id);

	return newlyOverdue.map((task: IDataObject) => ({
		json: { ...task, event: 'securityTaskOverdue' },
	}));
}

async function pollVendorRiskChanged(
	context: IPollFunctions,
): Promise<INodeExecutionData[]> {
	const vendors = await vantaApiRequestAllItems.call(
		context,
		'GET',
		'/vendors',
	);

	// Get previous vendor risk levels
	const webhookData = context.getWorkflowStaticData('node');
	const previousVendorRisks = (webhookData.vendorRiskLevels as IDataObject) || {};

	// Find vendors with changed risk level
	const changedVendors = vendors.filter((vendor: IDataObject) => {
		const previousRisk = previousVendorRisks[vendor.id as string];
		return previousRisk !== undefined && previousRisk !== vendor.riskLevel;
	});

	// Update state
	const newVendorRisks: IDataObject = {};
	for (const vendor of vendors) {
		newVendorRisks[vendor.id as string] = vendor.riskLevel;
	}
	webhookData.vendorRiskLevels = newVendorRisks;

	return changedVendors.map((vendor: IDataObject) => ({
		json: {
			...vendor,
			event: 'vendorRiskChanged',
			previousRiskLevel: previousVendorRisks[vendor.id as string],
		},
	}));
}

async function pollComputerNonCompliant(
	context: IPollFunctions,
): Promise<INodeExecutionData[]> {
	const computers = await vantaApiRequestAllItems.call(
		context,
		'GET',
		'/computers',
		undefined,
		{ complianceStatus: 'NON_COMPLIANT' },
	);

	// Get previously known non-compliant computers
	const webhookData = context.getWorkflowStaticData('node');
	const previousNonCompliant = (webhookData.nonCompliantComputerIds as string[]) || [];

	// Filter to only newly non-compliant
	const newlyNonCompliant = computers.filter(
		(computer: IDataObject) => !previousNonCompliant.includes(computer.id as string),
	);

	// Update state
	webhookData.nonCompliantComputerIds = computers.map((computer: IDataObject) => computer.id);

	return newlyNonCompliant.map((computer: IDataObject) => ({
		json: { ...computer, event: 'computerNonCompliant' },
	}));
}

export class VantaTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Vanta Trigger',
		name: 'vantaTrigger',
		icon: 'file:vanta.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers workflows based on Vanta compliance events',
		defaults: {
			name: 'Vanta Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'vantaOAuth2Api',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				default: 'testFailed',
				options: [
					{
						name: 'Computer Non-Compliant',
						value: 'computerNonCompliant',
						description: 'Trigger when a computer fails security checks',
					},
					{
						name: 'Control Status Changed',
						value: 'controlStatusChanged',
						description: 'Trigger when control compliance status changes',
					},
					{
						name: 'Personnel Offboarded',
						value: 'personnelOffboarded',
						description: 'Trigger when a person is offboarded',
					},
					{
						name: 'Security Task Overdue',
						value: 'securityTaskOverdue',
						description: 'Trigger when a security task becomes overdue',
					},
					{
						name: 'Test Failed',
						value: 'testFailed',
						description: 'Trigger when a test transitions to failing status',
					},
					{
						name: 'Vendor Risk Changed',
						value: 'vendorRiskChanged',
						description: 'Trigger when vendor risk level changes',
					},
					{
						name: 'Vulnerability Created',
						value: 'vulnerabilityCreated',
						description: 'Trigger when a new vulnerability is detected',
					},
					{
						name: 'Vulnerability SLA Approaching',
						value: 'vulnerabilitySLAApproaching',
						description: 'Trigger when vulnerability SLA is approaching',
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Framework ID',
						name: 'frameworkId',
						type: 'string',
						default: '',
						description: 'Filter by framework ID (applies to test and control events)',
					},
					{
						displayName: 'Severity',
						name: 'severity',
						type: 'multiOptions',
						options: [
							{ name: 'Critical', value: 'CRITICAL' },
							{ name: 'High', value: 'HIGH' },
							{ name: 'Medium', value: 'MEDIUM' },
							{ name: 'Low', value: 'LOW' },
							{ name: 'Info', value: 'INFO' },
						],
						default: [],
						description: 'Filter vulnerabilities by severity level',
					},
					{
						displayName: 'SLA Days Warning',
						name: 'slaDaysWarning',
						type: 'number',
						default: 7,
						description: 'Days before SLA deadline to trigger warning (for SLA events)',
					},
				],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		logLicensingNotice();

		const event = this.getNodeParameter('event') as string;
		const options = this.getNodeParameter('options') as IDataObject;
		const webhookData = this.getWorkflowStaticData('node');

		const now = new Date();
		const lastChecked = webhookData.lastChecked as string | undefined;

		// Set last checked to now for next poll
		webhookData.lastChecked = now.toISOString();

		// If first run, don't return any data - just establish baseline
		if (!lastChecked) {
			return null;
		}

		let items: INodeExecutionData[] = [];

		try {
			switch (event) {
				case 'testFailed':
					items = await pollTestFailed(this, options);
					break;
				case 'vulnerabilityCreated':
					items = await pollVulnerabilityCreated(this, options, lastChecked);
					break;
				case 'vulnerabilitySLAApproaching':
					items = await pollVulnerabilitySLA(this, options);
					break;
				case 'controlStatusChanged':
					items = await pollControlStatusChanged(this, options);
					break;
				case 'personnelOffboarded':
					items = await pollPersonnelOffboarded(this, lastChecked);
					break;
				case 'securityTaskOverdue':
					items = await pollSecurityTaskOverdue(this);
					break;
				case 'vendorRiskChanged':
					items = await pollVendorRiskChanged(this);
					break;
				case 'computerNonCompliant':
					items = await pollComputerNonCompliant(this);
					break;
			}
		} catch (error) {
			// If error, return empty to avoid workflow failure
			console.error(`Vanta Trigger poll error for ${event}:`, error);
			return null;
		}

		if (items.length === 0) {
			return null;
		}

		return [items];
	}
}
