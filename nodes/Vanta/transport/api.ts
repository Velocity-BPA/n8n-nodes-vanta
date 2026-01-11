/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
	IHttpRequestMethods,
	IRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

interface TokenCache {
	accessToken: string;
	expiresAt: number;
}

const tokenCache: Map<string, TokenCache> = new Map();

/**
 * Get the base URL for the Vanta API based on environment
 */
export function getBaseUrl(environment: string): string {
	switch (environment) {
		case 'eu':
			return 'https://api.eu.vanta.com';
		case 'aus':
			return 'https://api.aus.vanta.com';
		default:
			return 'https://api.vanta.com';
	}
}

/**
 * Get OAuth2 access token using Client Credentials flow
 */
export async function getAccessToken(
	this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
): Promise<string> {
	const credentials = await this.getCredentials('vantaOAuth2Api');

	const cacheKey = `${credentials.clientId}`;
	const cached = tokenCache.get(cacheKey);

	// Return cached token if still valid (with 5 minute buffer)
	if (cached && cached.expiresAt > Date.now() + 300000) {
		return cached.accessToken;
	}

	const baseUrl = getBaseUrl(credentials.environment as string);

	try {
		const response = await this.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}/oauth/token`,
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
				scope: credentials.scope || 'vanta-api.all:read vanta-api.all:write',
				grant_type: 'client_credentials',
			},
		});

		const expiresIn = response.expires_in || 3600;
		tokenCache.set(cacheKey, {
			accessToken: response.access_token,
			expiresAt: Date.now() + expiresIn * 1000,
		});

		return response.access_token;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: 'Failed to obtain access token',
		});
	}
}

/**
 * Make an authenticated request to the Vanta API
 */
export async function vantaApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('vantaOAuth2Api');
	const accessToken = await getAccessToken.call(this);
	const baseUrl = getBaseUrl(credentials.environment as string);

	const options: IRequestOptions = {
		method,
		uri: `${baseUrl}/v1${endpoint}`,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (query && Object.keys(query).length > 0) {
		options.qs = query;
	}

	try {
		const response = await this.helpers.request(options);
		return response as IDataObject;
	} catch (error) {
		const errorObj = error as JsonObject;
		const statusCode = errorObj.statusCode as number;

		// Handle rate limiting
		if (statusCode === 429) {
			const responseObj = errorObj.response as JsonObject | undefined;
			const headersObj = responseObj?.headers as JsonObject | undefined;
			const retryAfter = headersObj?.['x-ratelimit-reset'];
			throw new NodeApiError(this.getNode(), errorObj, {
				message: `Rate limit exceeded. ${retryAfter ? `Retry after: ${retryAfter}` : 'Please wait before making another request.'}`,
			});
		}

		throw new NodeApiError(this.getNode(), errorObj);
	}
}

/**
 * Make an authenticated request and return all items with pagination
 */
export async function vantaApiRequestAllItems(
	this: IExecuteFunctions | IPollFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
	dataKey?: string,
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];
	let pageCursor: string | undefined;

	const qs = { ...(query || {}) };
	qs.pageSize = qs.pageSize || 100;

	do {
		if (pageCursor) {
			qs.pageCursor = pageCursor;
		}

		const response = await vantaApiRequest.call(this, method, endpoint, body, qs);

		// Handle different response structures
		let data: IDataObject[] = [];
		let pageInfo: IDataObject | undefined;

		if (response.results && typeof response.results === 'object') {
			const results = response.results as IDataObject;
			data = (results.data as IDataObject[]) || [];
			pageInfo = results.pageInfo as IDataObject;
		} else if (dataKey && response[dataKey]) {
			data = response[dataKey] as IDataObject[];
			pageInfo = response.pageInfo as IDataObject;
		} else if (response.data) {
			data = response.data as IDataObject[];
			pageInfo = response.pageInfo as IDataObject;
		} else if (Array.isArray(response)) {
			data = response as IDataObject[];
		}

		returnData.push(...data);

		// Check for next page
		if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
			pageCursor = pageInfo.endCursor as string;
		} else {
			pageCursor = undefined;
		}
	} while (pageCursor);

	return returnData;
}

/**
 * Handle binary file upload to Vanta
 */
export async function vantaApiUploadFile(
	this: IExecuteFunctions,
	endpoint: string,
	binaryPropertyName: string,
	additionalFields?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('vantaOAuth2Api');
	const accessToken = await getAccessToken.call(this);
	const baseUrl = getBaseUrl(credentials.environment as string);

	const binaryData = this.helpers.assertBinaryData(0, binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(0, binaryPropertyName);

	const formData: IDataObject = {
		file: {
			value: buffer,
			options: {
				filename: binaryData.fileName || 'file',
				contentType: binaryData.mimeType,
			},
		},
	};

	if (additionalFields) {
		Object.assign(formData, additionalFields);
	}

	try {
		const response = await this.helpers.request({
			method: 'POST',
			uri: `${baseUrl}/v1${endpoint}`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			formData,
			json: true,
		});

		return response as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
