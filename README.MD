# The Logical Project

## Overview

The Logical Project is a microservices-based system designed to handle data integration, processing, and visualization. It provides a concept for managing a common data model and processing events through a collection of specialized services.

## Key Features

- **Container orchestration**: Easy deployment and service orchestration using [Docker Compose](https://docs.docker.com/compose/)
- **Azure Functions**: Utilizes [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview) allowing for scalable and cloud agnostic event processing.
- **TypeScript**: Built with TypeScript for type safety and improved developer experience
- **Prisma ORM**: Uses [Prisma](https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma) for database management
- **Environment Management**: Uses .env files for configuration
- **Event Processing**: Robust event handling system using [Kafka](https://kafka.apache.org/) for data streaming
- **Monitoring**: Integrated logging with [Loki](https://grafana.com/oss/loki/)
- **Data Visualization**: Custom [Grafana](https://grafana.com/) dashboarding
- **Consumer Component**: Provides a [Hoppscotch](https://hoppscotch.io/) collection for testing and interacting with the system API

## Installation

1. Clone the repository

2. Build and start the application using Docker Compose:
   ```sh
   docker compose up
   ```

3. The system will initialize all services and set up the required databases and connections.

## Usage

### Accessing Grafana Dashboard
*Or view the dashboard preview [here](#dashboard-preview)*

1. Navigate to: http://localhost:3000/login

2. Use default credentials:
   - Username: `admin`
   - Password: `admin`

### Accessing the database
1. navigate into the systemAPI folder
3. Run the following command to generate the Prisma client:
   ```sh
   npx prisma generate
   ```
2. Run the following command to start [Prisma Studio](https://www.prisma.io/docs/concepts/components/prisma-studio):
   ```sh
   npx prisma studio
   ```
3. This will open a new tab in your browser with the Prisma Studio interface, allowing you to view and manage your database records.

## Project Structure

```
.
├── companyIntegration/  # Company integration service
├── systemAPI/           # Common data model System API
├── grafana/             # Dashboard and visualization
├── consumer/            # Data consumer hoppscotch collection
└── docker-compose.yaml  # Service orchestration
```

## System Components

The system consists of the following main components:

1. **Company Integration Service**
   - Handles event processing and data integration
   - Manages data model ETL and seeding
   - Built with Azure Functions and TypeScript

2. **System API**
   - Provides RESTful endpoints for common data model management
   - Supports CRUD operations for the common data model
   - Health monitoring endpoint
   - Built with Azure Functions and TypeScript

3. **Grafana Dashboard**
   - Visualization of system metrics and data
   - Custom provisioned dashboards
   - Integrated data source configuration

4. **Consumer Component**
   - Provides a [Hoppscotch](https://hoppscotch.io/) collection for interacting with the system API

## Architecture

The application follows a microservice architecture. Below is a high-level overview of the system concept and architecture.
- **System Concept**: The system is designed to handle data integration and event processing through a series of microservices. Each service is responsible for a specific task, allowing for scalability and maintainability.
- **Architecture**: The architecture consists of multiple services that communicate with each other through APIs and event streams. The system is designed to be deployed using containerization, which simplifies the orchestration of services and their dependencies. Also making it cloud agnostic and easy to deploy on various platforms.
- **Monitoring and Logging**: The system includes integrated logging with Loki, allowing for real-time monitoring of events and system health. Grafana is used for data visualization, providing custom dashboards to monitor system performance and metrics.

### Application Concept
![Application Concept](app.drawio.svg)

### Architecture
![Application Architecture](architecture.drawio.svg)

## Dashboard preview
[You can view a snapshot of the grafana dashboard here on raintank](https://snapshots.raintank.io/dashboard/snapshot/CVwonmisAMJPPKi0md30fEJvNqX8Al0p)
### Syncronized relations
In the image below you can see the syncronized relations between the different databases.
![relation table databases](/images/relations%20databases.png)

### Specific relation logging
In the image below you can see the logging of a specific relation. In the logging you can see the creation and the update of the relation with the update event being processed by the integrations. You can see the first relation creation event throws an error in the the integration because it is already present in that specific integration. The update event is processed correctly and the relation is updated in the integration.
![relation logging](/images/relation%20specific%20logging.png)

### Logging volume
![logging volume](/images/logging%20volume%20timeline.png)
