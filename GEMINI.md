# Project Overview

This is a Next.js application built with TypeScript and using MongoDB as the database. The project is a budgeting application that appears to integrate with Plaid for financial data aggregation. The application is containerized using Docker.

The front-end is built with React and Tailwind CSS, and utilizes a number of libraries including Tremor for charts, TanStack Table for data grids, and Recharts for additional charting capabilities.

The back-end is a set of API routes built with Next.js API routes. It uses the official MongoDB driver to interact with the database. The API provides endpoints for managing transactions, categories, users, and for interacting with the Plaid API.

# Building and Running

## Development

To run the application in a development environment, you can use one of the following commands:

```bash
npm run dev
```

This will start the Next.js development server on `http://localhost:3000`.

Alternatively, you can run the application using Docker:

```bash
npm run dev:docker
```

This will start the application and a MongoDB instance using `docker-compose`.

## Production

To build the application for production, run the following command:

```bash
npm run build
```

To run the application in production, you can use Docker. The `publish` script in `package.json` can be used to build and push the production Docker image:

```bash
npm run publish
```

# Development Conventions

## Code Style

The project uses ESLint for linting, and the configuration is in `.eslintrc.json`. It's recommended to run the linter before committing changes:

```bash
npm run lint
```

## API

The API routes are located in `app/api`. Each route is in its own directory, with the logic in a `route.ts` file. Data fetching logic is abstracted into a `queries` directory, with each file corresponding to a data model.

## Database

The database connection is managed in `app/lib/mongodb.ts`. The application uses the `mongodb` package to interact with the database. The database schema is not explicitly defined in the code, but can be inferred from the interfaces in `app/interfaces` and the queries in `app/queries`.
