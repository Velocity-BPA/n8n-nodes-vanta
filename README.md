# n8n-nodes-vanta

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for integrating with the Vanta compliance automation platform. Automate your security compliance monitoring, test management, vulnerability tracking, vendor risk management, and personnel compliance operations through Vanta's REST API.

![n8n-nodes-vanta](https://img.shields.io/npm/v/n8n-nodes-vanta)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![n8n](https://img.shields.io/badge/n8n-community--node-orange)

## Features

- **12 Resource Categories** with 50+ operations for complete Vanta API coverage
- **OAuth 2.0 Client Credentials** authentication with automatic token refresh
- **Cursor-based Pagination** with automatic handling for large datasets
- **Multi-region Support** for US, EU, and Australia Vanta instances
- **Polling Trigger** for 8 compliance event types
- **Rate Limit Handling** with automatic backoff and retry
- **TypeScript** implementation with full type safety

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-vanta`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-vanta

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-vanta.git
cd n8n-nodes-vanta

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-vanta

# Restart n8n
n8n start
```

## Credentials Setup

1. Log in to your Vanta account
2. Navigate to **Settings** > **Developer Console**
3. Create a new OAuth application:
   - Select "Manage Vanta" or "Build Integrations" app type
   - Generate client credentials
4. In n8n, create a new **Vanta OAuth2 API** credential with:

| Field | Description |
|-------|-------------|
| Client ID | Your OAuth client ID (format: `vci_xxx`) |
| Client Secret | Your OAuth client secret |
| Scope | API scopes (default: `vanta-api.all:read vanta-api.all:write`) |
| Environment | Region: US (default), EU, or Australia |

## Resources & Operations

### Tests
Manage automated compliance tests.
- **Get**: Retrieve a specific test by ID
- **Get Many**: List all tests with filtering
- **Get Results**: Get test results for a specific test
- **Get Failing Resources**: Get resources failing a test
- **Update Resource Scope**: Mark resources in/out of scope
- **Deactivate Monitoring**: Disable monitoring for resources

### Controls
Manage compliance controls.
- **Get**: Retrieve a specific control
- **Get Many**: List all controls
- **Get Tests By Control**: Get tests associated with a control
- **Update Owner**: Change control ownership
- **Update Status**: Update control compliance status

### Frameworks
View compliance framework information.
- **Get**: Retrieve framework details
- **Get Many**: List all enabled frameworks
- **Get Controls**: Get controls for a framework
- **Get Compliance Status**: Get overall compliance status

### Vulnerabilities
Track and manage security vulnerabilities.
- **Get**: Retrieve vulnerability details
- **Get Many**: List all vulnerabilities
- **Get Approaching SLA**: Get vulnerabilities near SLA deadline
- **Update Status**: Change vulnerability status
- **Add Comment**: Add comment to vulnerability

### Personnel
Manage personnel compliance.
- **Get**: Retrieve person by ID
- **Get Many**: List all personnel
- **Get By Email**: Find person by email
- **Update**: Update person attributes
- **Offboard**: Mark person as offboarded
- **Update Group**: Change group assignment
- **Mark Service Account**: Mark as service account

### Vendors
Manage vendor risk and compliance.
- **Create**: Add a new vendor
- **Get**: Retrieve vendor details
- **Get Many**: List all vendors
- **Update**: Update vendor information
- **Delete**: Remove a vendor
- **Upload Document**: Add document to vendor
- **Get Security Review**: Get vendor security review

### Documents
Manage compliance documentation.
- **Create**: Upload a new document
- **Get**: Retrieve document by ID
- **Get Many**: List all documents
- **Delete**: Remove a document
- **Get By Evidence Request**: Get documents for evidence request
- **Upload To Evidence Request**: Upload to evidence request

### Integrations
View connected integrations.
- **Get**: Retrieve integration details
- **Get Many**: List all integrations
- **Get Resources**: Get resources from integration
- **Get Resource Kinds**: Get supported resource types

### Computers
Monitor computer compliance.
- **Get**: Retrieve computer by ID
- **Get Many**: List all computers
- **Get Failing Security Checks**: Find non-compliant computers
- **Update Scope**: Update computer scope status

### Security Tasks
Manage security tasks.
- **Get**: Retrieve task by ID
- **Get Many**: List all tasks
- **Get By Assignee**: Get tasks for a user
- **Get Overdue**: List overdue tasks
- **Update Status**: Update task status

### Risks
Manage risk register.
- **Create**: Add a new risk
- **Get**: Retrieve risk by ID
- **Get Many**: List all risks
- **Update**: Update risk details
- **Update Treatment**: Update risk treatment plan

### People Groups
Manage personnel groups.
- **Create**: Create a new group
- **Get**: Retrieve group by ID
- **Get Many**: List all groups
- **Update**: Update group details
- **Delete**: Remove a group
- **Add Member**: Add person to group
- **Remove Member**: Remove person from group

## Trigger Node

The **Vanta Trigger** node monitors Vanta for compliance events using polling.

### Events

| Event | Description |
|-------|-------------|
| Test Failed | When a test transitions to failing status |
| Vulnerability Created | When new vulnerability is detected |
| Vulnerability SLA Approaching | When vulnerability SLA deadline is near |
| Control Status Changed | When control compliance status changes |
| Personnel Offboarded | When a person is offboarded |
| Security Task Overdue | When a security task becomes overdue |
| Vendor Risk Changed | When vendor risk level changes |
| Computer Non-Compliant | When a computer fails security checks |

### Configuration

- **Polling Interval**: Minimum 1 minute, default 5 minutes
- **Framework Filter**: Filter events by framework ID
- **Severity Filter**: Filter vulnerabilities by severity level
- **SLA Warning Days**: Days before SLA to trigger warning (default: 7)

## Usage Examples

### Get Failing Tests

```javascript
// Vanta Node Configuration
Resource: Test
Operation: Get Many
Return All: false
Limit: 100
Filters:
  - Status: FAILING
  - Framework ID: SOC2
```

### Create Vendor with Risk Assessment

```javascript
// Vanta Node Configuration
Resource: Vendor
Operation: Create
Vendor Name: Acme Corp
Vendor Website: https://acme.com
Vendor Category: Software
Additional Fields:
  - Risk Level: MEDIUM
  - Description: SaaS provider for team collaboration
```

### Monitor Vulnerabilities Approaching SLA

```javascript
// Vanta Trigger Configuration
Event: Vulnerability SLA Approaching
Options:
  - Severity: CRITICAL, HIGH
  - SLA Days Warning: 3
```

## Vanta API Concepts

### Compliance Frameworks
Vanta supports multiple compliance frameworks including SOC 2, ISO 27001, HIPAA, GDPR, and PCI DSS. Each framework contains controls that map to automated tests.

### Tests
Tests are automated checks that verify compliance with specific requirements. They can have statuses: PASSING, FAILING, DISABLED, or NOT_APPLICABLE.

### Controls
Controls are specific security requirements within a framework. Multiple tests may map to a single control.

### Risk Scoring
Risks are scored using likelihood (RARE to ALMOST_CERTAIN) and impact (INSIGNIFICANT to SEVERE) to calculate overall risk level.

## API Regions

| Region | Base URL |
|--------|----------|
| US (Default) | `https://api.vanta.com` |
| EU | `https://api.eu.vanta.com` |
| Australia | `https://api.aus.vanta.com` |

## Error Handling

The node handles common API errors:

| Status | Meaning | Handling |
|--------|---------|----------|
| 400 | Bad Request | Validation error - check parameters |
| 401 | Unauthorized | Token expired - automatic refresh |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Automatic backoff and retry |
| 500 | Server Error | Retry with exponential backoff |

## Security Best Practices

1. **Credential Storage**: Use n8n's encrypted credential storage
2. **Scope Limitation**: Request only necessary API scopes
3. **Network Security**: Ensure n8n is on a secure network
4. **Audit Logging**: Monitor API usage via Vanta's audit logs
5. **Token Rotation**: Rotate client secrets periodically

## Development

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Watch mode during development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass (`npm test`)
- Code is linted (`npm run lint`)
- TypeScript compiles (`npm run build`)

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-vanta/issues)
- **Documentation**: [Vanta API Docs](https://developer.vanta.com/docs)
- **n8n Community**: [n8n Community Forum](https://community.n8n.io/)

## Acknowledgments

- [n8n](https://n8n.io/) - Workflow automation platform
- [Vanta](https://vanta.com/) - Security compliance automation
- [Anthropic](https://anthropic.com/) - AI assistance in development
