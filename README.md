# CrossConnect-Phos

CrossConnect-Phos is a robust, modular, and extensible platform designed to enable seamless connectivity and data synchronization between diverse systems. It offers a suite of services and tools that make integration across multiple platforms, databases, and APIs straightforward and reliable. The architecture prioritizes scalability, maintainability, and developer productivity, making it suitable for complex enterprise environments as well as smaller, focused integrations. It centralizes metrics data from Amazon, Walmart, Warehance, TikTok, Shopify, Faire, and Target.com.

---

## Features

- **Pluggable Integration Modules:** Easily add or remove connectors for new systems, databases, and APIs.
- **Automated Data Synchronization:** Schedule and automate data transfer jobs with flexible triggers and intervals.
- **Unified API Gateway:** Expose internal operations as RESTful APIs for streamlined access and management.
- **Robust Error Handling:** Centralized error logging and retry strategies ensure reliable operation.
- **Comprehensive Monitoring:** Built-in dashboards and logging for job status, system health, and performance metrics.
- **Security & Access Control:** Support for secure authentication, authorization, and encrypted data transfers.
- **Developer Friendly:** Clean codebase, thorough documentation, and clear configuration options.
- **Amazon metrics integration:** Collects sales, advertising, traffic, and inventory KPIs through Amazon Seller and Advertising APIs.
- **Walmart metrics integration:** Gathers sales performance, buy box visibility, fulfillment, and inventory metrics from Walmart marketplace APIs.
- **Warehance metrics integration:** Aggregates warehouse operations, inventory accuracy, inbound, and outbound processing KPIs from Warehance.
- **TikTok metrics integration:** Pulls campaign, ad group, creative, and conversion metrics from TikTok Shop and Ads endpoints.
- **Shopify metrics integration:** Syncs orders, products, traffic, and financial metrics from Shopify Admin and analytics APIs.
- **Faire metrics integration:** Retrieves wholesale order, retailer, and payout metrics from Faire partner APIs.
- **Target.com metrics integration:** Consolidates sales, inventory, and fulfillment KPIs from Target marketplace integrations.
- **Background jobs with BullMQ:** Uses queues and workers to process metrics synchronization jobs reliably in the background.

---

## Requirements

- **Node.js** (version 14 or higher)
- **npm** (Node Package Manager)
- **Supported Databases:** MongoDB, MySQL, PostgreSQL, or others via connectors
- **Network Access:** As required by your integration endpoints
- **Operating System:** Linux, macOS, or Windows

Optional dependencies may be needed for specific connectors or advanced features.

---

## Installation

To set up CrossConnect-Phos in your environment, follow these steps:

1. **Clone the Repository**
    ```bash
    git clone https://github.com/PheonixCodder/CrossConnect-Phos.git
    cd CrossConnect-Phos
    ```

2. **Install Dependencies**
    ```bash
    npm install
    ```

3. **Configure Environment Variables**
   - Copy the example configuration:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` to set your database credentials, API keys, and other required variables.

4. **Run Database Migrations (if applicable)**
    ```bash
    npm run migrate
    ```

5. **Start the Application**
    ```bash
    npm start
    ```

---

## Usage

After installation, CrossConnect-Phos can be used to configure and manage integration jobs via its API or CLI.

### Common CLI Commands

- **Start the server**
    ```bash
    npm start
    ```
- **Run integration jobs manually**
    ```bash
    npm run job --name="JobName"
    ```
- **View logs**
    ```bash
    npm run logs
    ```

### API Access

CrossConnect-Phos exposes a RESTful API for managing jobs, connectors, and monitoring system status. You can interact with the API using any HTTP client or build custom dashboards on top.

### Background Jobs with BullMQ

BullMQ executes heavy metrics collection tasks as background jobs to avoid blocking the main API process. It manages job queues for each marketplace, ensuring reliable and isolated processing for every platform.

- Each marketplace, such as Amazon or Walmart, can have a dedicated BullMQ queue.
- Workers consume jobs from queues to fetch metrics, transform data, and write to storage.
- Retry strategies handle transient API failures, backoff delays, and maximum attempt limits per job.
- Delayed and repeatable jobs support scheduled metrics refreshes and near real time updates.
- BullMQ job states track active, completed, failed, and delayed jobs for monitoring and debugging.
- Queue concurrency settings control how many jobs run in parallel for each connector.
- Rate limiting features help keep API calls within marketplace quotas and throttling rules.
- Metrics ingestion jobs can fan out into sub jobs, such as per account, region, or store.
- Administrators can inspect queue health, job histories, and processing times using BullMQ tooling.

---

## Configuration

CrossConnect-Phos supports deep configuration through environment variables and configuration files.

### Environment Variables

- `PORT`: Port number for the API server
- `DB_URI`: Database connection string
- `API_KEYS`: Comma-separated API keys for connectors
- `LOG_LEVEL`: Logging verbosity (debug, info, warn, error)
- Refer to `.env.example` for a complete list.

BullMQ queues follow environment settings from your configuration file, including shared connection details and runtime limits.

### Job and Connector Configuration

Jobs and connectors are defined in the `config` directory. Each file describes:
- Source and destination systems
- Data mapping rules
- Schedule and triggers
- Error handling policies

Example job configuration:

```json
{
  "name": "SyncCustomers",
  "source": "MySQL",
  "destination": "MongoDB",
  "schedule": "0 * * * *",
  "mapping": { "customer_id": "id", "name": "fullName" }
}
```

Each marketplace connector defines platform specific settings like accounts, credentials, and default metrics collections. Amazon jobs can specify targeted stores, marketplaces, and metric groups such as sales, traffic, and ads. Walmart jobs can configure seller accounts, fulfillment channels, and required KPIs like buy box and on time ship. Warehance jobs may focus on specific warehouses, stock locations, and operational performance indicators. TikTok jobs can filter by campaigns, ad groups, and attribution windows for marketing analytics. Shopify jobs configure shops, sales channels, and analytics scopes for orders and products. Faire jobs may target wholesale partners, order flows, and payout tracking metrics. Target.com jobs define marketplace accounts, catalog scopes, and fulfillment performance metrics for synchronization.

BullMQ related configuration can extend each job with queue names, concurrency, and retry policies. Jobs can specify whether to run as scheduled, ad hoc, or as part of a chained workflow. Queue specific settings help tune throughput and stability for high volume marketplaces.

---

## Contributing

We welcome contributions from the community! To contribute:

- Fork the repository and create your branch from `main`.
- Add your feature or fix, ensuring code style and tests are maintained.
- Submit a pull request with a clear description and reference related issues.

### Development Workflow

1. Run tests locally with `npm test`.
2. Document new modules and APIs.
3. Follow commit message conventions for clarity and changelog automation.

---

## License

CrossConnect-Phos is licensed under the Apache License 2.0. See the [LICENSE](./LICENSE) file for full details.

---

Thank you for using CrossConnect-Phos! For issues, suggestions, or feature requests, please open an issue or join the discussion on our GitHub repository.
