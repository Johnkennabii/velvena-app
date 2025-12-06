# Velvena App

Multi-tenant dress rental management application built with React, TypeScript, and Tailwind CSS.

## Features

- **Multi-tenant Architecture**: Full support for multiple organizations with data isolation
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Dress Management**: Complete catalog system for dress inventory
- **Customer Management**: Customer profiles, notes, and history
- **Contract Management**: Rental contracts with packages and addons
- **Real-time Updates**: WebSocket integration for live data synchronization
- **Modern UI**: Beautiful, responsive interface with dark mode support

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling
- **React Router 7** - Routing
- **Socket.IO Client** - Real-time communication
- **FullCalendar** - Calendar and scheduling

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to Velvena API (https://api.velvena.fr)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.development

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Velvena
VITE_APP_ENVIRONMENT=development
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # Reusable UI components
├── context/          # React contexts (Auth, Organization, etc.)
├── hooks/            # Custom React hooks
├── layout/           # Layout components
├── pages/            # Page components
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Multi-tenancy

The application supports full multi-tenancy with:

- Organization-level data isolation
- Organization context available throughout the app via `useOrganization()` hook
- User authentication includes `organizationId`
- All API requests automatically scoped to the user's organization

## Development

```bash
# Run development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## API Integration

The app connects to the Velvena API (https://github.com/Johnkennabii/velvena-api):

- RESTful endpoints for CRUD operations
- JWT authentication with automatic token refresh
- WebSocket connection for real-time updates
- Multi-tenant request handling

## License

Private - All rights reserved

## Support

For questions or issues, please contact the development team.
