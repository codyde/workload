# Workload Project Guidelines

## Commands
- **App:** `cd workload-app && npm run dev` - Start the React frontend
- **Server:** `cd workload-server && bun run dev` - Start the Bun backend
- **Database:** `cd workload-server && bun run db:generate` - Generate Drizzle migrations
- **Lint:** `cd workload-app && npm run lint` - Run ESLint
- **Build:** `cd workload-app && npm run build` - Build the frontend
- **Single Test:** (Not implemented) - No test commands defined in package.json

## Code Style
- **Formatting:** TypeScript with strict type checking, max 400 lines per file
- **Imports:** Group imports by source (React, third-party, local)
- **TypeScript:** Use explicit types for function params, strict null checks 
- **Components:** Functional components with React Hooks, named exports
- **State:** Zustand for state management, with typed stores
- **API calls:** Centralized in api.ts, with proper error handling
- **Error Handling:** Try/catch with detailed error logs, throw with context
- **Naming:** camelCase for variables/functions, PascalCase for types/components
- **Backend:** Controller pattern with Elysia routes and Drizzle ORM
- **CSS:** TailwindCSS for styling