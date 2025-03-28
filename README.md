# Workload App

A project management application for tracking development projects, epics, and tasks.

## Project Structure

- `workload-app`: React/Vite frontend application
- `workload-server`: Bun server with Drizzle ORM and SQLite database

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/) (latest version)

### Setting up the Server

1. Navigate to the server directory:

```bash
cd workload-server
```

2. Install dependencies:

```bash
bun install
```

3. Generate database migrations:

```bash
bun run db:generate
```

4. Start the server:

```bash
bun run dev
```

The server will run on http://localhost:3000 with Swagger documentation available at http://localhost:3000/swagger.

### Setting up the Frontend

1. In a new terminal, navigate to the frontend directory:

```bash
cd workload-app
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

The frontend will run on http://localhost:5173 by default.

## Application Features

- Create and manage development projects
- Organize work into epics and tasks
- Track task dependencies and progress
- Assign tasks to team members
- Filter and sort tasks by various criteria

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Zustand (state management)
- TailwindCSS
- Radix UI components

### Backend
- Bun
- Elysia (web framework)
- Drizzle ORM
- SQLite (development)
- Postgres (planned for production)

## API Documentation

The API is organized around RESTful principles:

- `/api/projects`: Manage projects
- `/api/epics`: Manage epics within projects
- `/api/tasks`: Manage tasks within epics

Full API documentation is available at the Swagger endpoint: http://localhost:3000/swagger

## Database Schema

The application uses the following data model:

- **Projects**: Top-level containers for work
- **Epics**: Features or major pieces of work within a project
- **Tasks**: Individual work items within epics
- **Users**: People who can be assigned to tasks
- **Comments**: Discussion on tasks

## Future Plans

- Migrate from SQLite to PostgreSQL
- Add authentication and user management
- Implement real-time collaboration features
- Add file attachments and comments on tasks 