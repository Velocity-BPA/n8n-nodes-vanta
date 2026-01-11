/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class VantaOAuth2Api implements ICredentialType {
	name = 'vantaOAuth2Api';
	displayName = 'Vanta OAuth2 API';
	documentationUrl = 'https://developer.vanta.com/docs/quick-start';
	icon: Icon = 'file:vanta.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: 'OAuth Client ID from Vanta Developer Console (format: vci_xxx)',
			placeholder: 'vci_your_client_id',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'OAuth Client Secret from Vanta Developer Console',
			placeholder: 'vcs_your_client_secret',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'vanta-api.all:read vanta-api.all:write',
			description: 'API scopes for authentication',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'US (Default)',
					value: 'us',
				},
				{
					name: 'EU',
					value: 'eu',
				},
				{
					name: 'Australia',
					value: 'aus',
				},
			],
			default: 'us',
			description: 'Vanta region environment',
		},
	];
}
