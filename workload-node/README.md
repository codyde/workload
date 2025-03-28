# Workload Node.js Server

This is a Node.js implementation of the Workload server, which provides the backend API for the Workload application.

## Tech Stack

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Coming soon
- **API Documentation**: Swagger UI
- **Monitoring**: Sentry

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root of the project with the following content:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workload
PORT=3000
NODE_ENV=development
```

4. Set up the database:

```bash
bash scripts/setup.sh
```

5. Start the development server:

```bash
npm run dev
```

## API Endpoints

The server provides RESTful API endpoints for managing:

- Projects
- Epics
- Tasks

API documentation is available at `/api-docs` when the server is running.

## Scripts

- `npm run dev`: Start the development server with hot reloading
- `npm run build`: Build the project for production
- `npm start`: Start the production server
- `npm run db:generate`: Generate Drizzle migrations
- `npm run db:migrate`: Run database migrations

## Differences from Bun Implementation

This implementation uses:

- Express.js instead of Elysia
- Node.js instead of Bun
- Similar database layer (Drizzle ORM)
- Similar controller/route structure but adapted for Express
- Swagger UI for API documentation

## License

ISC