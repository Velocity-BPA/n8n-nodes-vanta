/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject } from 'n8n-workflow';

// ============ Enums ============

export type TestStatus = 'PASSING' | 'FAILING' | 'DISABLED' | 'NOT_APPLICABLE';

export type ControlStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE' | 'IN_PROGRESS';

export type VulnerabilitySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type VulnerabilityStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED';

export type SlaStatus = 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';

export type PersonnelStatus = 'ACTIVE' | 'OFFBOARDED' | 'PENDING';

export type EmploymentType = 'EMPLOYEE' | 'CONTRACTOR' | 'SERVICE_ACCOUNT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskStatus = 'OPEN' | 'MITIGATED' | 'ACCEPTED' | 'TRANSFERRED';

export type RiskLikelihood = 'RARE' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'ALMOST_CERTAIN';

export type RiskImpact = 'INSIGNIFICANT' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'SEVERE';

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComputerPlatform = 'MACOS' | 'WINDOWS' | 'LINUX';

export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT';

export type FileType = 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'PNG' | 'JPG';

export type FrameworkType = 'SOC2' | 'ISO27001' | 'HIPAA' | 'GDPR' | 'PCI_DSS' | 'SOC1' | 'NIST_CSF' | 'NIST_800_53' | 'NIST_800_171' | 'CCPA' | 'CMMC';

// ============ Interfaces ============

export interface VantaTest {
	id: string;
	name: string;
	description?: string;
	status: TestStatus;
	frameworkId?: string;
	controlId?: string;
	lastRun?: string;
	nextRun?: string;
	passingResourceCount?: number;
	failingResourceCount?: number;
	disabledResourceCount?: number;
	createdAt: string;
	updatedAt: string;
}

export interface VantaTestResult {
	id: string;
	testId: string;
	status: TestStatus;
	resourceId: string;
	resourceName: string;
	resourceType: string;
	details?: string;
	evaluatedAt: string;
}

export interface VantaControl {
	id: string;
	name: string;
	description?: string;
	status: ControlStatus;
	frameworkId: string;
	ownerId?: string;
	ownerName?: string;
	testCount?: number;
	passingTestCount?: number;
	createdAt: string;
	updatedAt: string;
}

export interface VantaFramework {
	id: string;
	name: string;
	type: FrameworkType;
	enabled: boolean;
	controlCount?: number;
	compliantControlCount?: number;
	compliancePercentage?: number;
	createdAt: string;
	updatedAt: string;
}

export interface VantaVulnerability {
	id: string;
	title: string;
	description?: string;
	severity: VulnerabilitySeverity;
	status: VulnerabilityStatus;
	slaStatus?: SlaStatus;
	slaDueDate?: string;
	integrationId?: string;
	integrationName?: string;
	resourceId?: string;
	resourceName?: string;
	cveId?: string;
	cvssScore?: number;
	remediation?: string;
	assigneeId?: string;
	assigneeName?: string;
	createdAt: string;
	updatedAt: string;
}

export interface VantaPerson {
	id: string;
	email: string;
	displayName?: string;
	firstName?: string;
	lastName?: string;
	status: PersonnelStatus;
	employmentType: EmploymentType;
	groupId?: string;
	groupName?: string;
	startDate?: string;
	endDate?: string;
	isAdmin?: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface VantaVendor {
	id: string;
	name: string;
	website?: string;
	category?: string;
	riskLevel?: RiskLevel;
	description?: string;
	contactEmail?: string;
	contactName?: string;
	securityReviewStatus?: string;
	securityReviewDate?: string;
	documentCount?: number;
	createdAt: string;
	updatedAt: string;
}

export interface VantaDocument {
	id: string;
	fileName: string;
	fileType?: FileType;
	fileSize?: number;
	controlId?: string;
	evidenceRequestId?: string;
	uploadedBy?: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export interface VantaIntegration {
	id: string;
	name: string;
	displayName?: string;
	type: string;
	status: string;
	resourceCount?: number;
	lastSyncAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface VantaComputer {
	id: string;
	name: string;
	platform: ComputerPlatform;
	osVersion?: string;
	serialNumber?: string;
	complianceStatus: ComplianceStatus;
	ownerId?: string;
	ownerEmail?: string;
	lastSeen?: string;
	isInScope: boolean;
	failingCheckCount?: number;
	createdAt: string;
	updatedAt: string;
}

export interface VantaSecurityTask {
	id: string;
	title: string;
	description?: string;
	status: TaskStatus;
	priority: TaskPriority;
	assigneeId?: string;
	assigneeName?: string;
	dueDate?: string;
	completedAt?: string;
	controlId?: string;
	createdAt: string;
	updatedAt: string;
}

export interface VantaRisk {
	id: string;
	title: string;
	description?: string;
	status: RiskStatus;
	likelihood: RiskLikelihood;
	impact: RiskImpact;
	riskScore?: number;
	treatmentPlan?: string;
	ownerId?: string;
	ownerName?: string;
	controlId?: string;
	createdAt: string;
	updatedAt: string;
}

export interface VantaPeopleGroup {
	id: string;
	name: string;
	description?: string;
	memberCount?: number;
	createdAt: string;
	updatedAt: string;
}

// ============ API Response Types ============

export interface VantaPageInfo {
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	startCursor?: string;
	endCursor?: string;
}

export interface VantaPaginatedResponse<T> {
	results: {
		data: T[];
		pageInfo: VantaPageInfo;
	};
}

export interface VantaApiError {
	error: {
		code: string;
		message: string;
		details?: Array<{
			field: string;
			message: string;
		}>;
	};
}

// ============ Operation Types ============

export interface ResourceScope {
	resourceId: string;
	inScope: boolean;
}

export interface VantaListOptions extends IDataObject {
	pageSize?: number;
	pageCursor?: string;
	returnAll?: boolean;
	limit?: number;
}

export interface TestFilterOptions extends VantaListOptions {
	status?: TestStatus;
	frameworkId?: string;
	controlId?: string;
}

export interface VulnerabilityFilterOptions extends VantaListOptions {
	severity?: VulnerabilitySeverity;
	status?: VulnerabilityStatus;
	slaStatus?: SlaStatus;
	integrationId?: string;
}

export interface PersonnelFilterOptions extends VantaListOptions {
	status?: PersonnelStatus;
	employmentType?: EmploymentType;
	groupId?: string;
}

export interface ComputerFilterOptions extends VantaListOptions {
	platform?: ComputerPlatform;
	complianceStatus?: ComplianceStatus;
}
