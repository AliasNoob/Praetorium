# Praetorium (Flame Fork) - Agent Reference Guide

## Project Overview

Praetorium is a fork of Flame, a self-hosted startpage/dashboard for servers. It displays apps and bookmarks organized into categories on a customizable home page.

## Tech Stack

### Backend
- **Node.js + Express** - REST API server on port 5005
- **Sequelize ORM** - Database abstraction
- **SQLite** - Database stored in `data/db.sqlite`
- **Socket.io** - Real-time updates

### Frontend
- **React 18** with TypeScript
- **Redux** - State management (uses legacy `bindActionCreators` pattern)
- **React Router v6** - Client-side routing
- **CSS Modules** - Component-scoped styles (`.module.css` files)
- Development server on port 3000, proxies `/api` to backend

## Directory Structure

```
├── server.js           # Entry point, starts Express + Socket
├── api.js              # Express app configuration, middleware
├── routes/             # Express route definitions
├── controllers/        # Route handlers (business logic)
├── models/             # Sequelize models
├── middleware/         # Express middleware (auth, error handling)
├── data/               # SQLite DB, config.json, uploads
├── utils/              # Helper functions
└── client/             # React frontend
    └── src/
        ├── App.tsx
        ├── components/ # React components
        ├── store/      # Redux store, actions, reducers
        ├── interfaces/ # TypeScript interfaces
        └── utility/    # Frontend helpers
```

## Database Models

### Category
```js
{ id, name, type: 'apps'|'bookmarks', isPinned, orderId, isPublic }
```

### App
```js
{ id, name, url, categoryId, icon, isPinned, orderId, isPublic, description }
```

### Bookmark
```js
{ id, name, url, categoryId, icon, isPinned, orderId, isPublic }
```

### Config
Key-value store for settings:
```js
{ key, value, valueType: 'string'|'number'|'boolean', isLocked }
```

## API Routes

| Route | Methods | Auth | Description |
|-------|---------|------|-------------|
| `/api/config` | GET, PUT | PUT: Yes | App configuration |
| `/api/config/0/css` | GET, PUT | PUT: Yes | Custom CSS |
| `/api/config/layout` | GET, PUT | Yes | Full layout JSON |
| `/api/categories` | GET, POST | POST: Yes | Categories CRUD |
| `/api/categories/:id` | GET, PUT, DELETE | PUT/DEL: Yes | Single category |
| `/api/apps` | GET, POST | POST: Yes | Apps CRUD |
| `/api/bookmarks` | GET, POST | POST: Yes | Bookmarks CRUD |
| `/api/auth` | POST | No | Login (password + duration) |
| `/api/auth/validate` | POST | No | Validate JWT token |
| `/api/weather` | GET, PUT | PUT: Yes | Weather widget data |
| `/api/themes` | GET, POST, DELETE | Varies | Custom themes |
| `/api/queries` | GET, POST, PUT, DELETE | Varies | Search providers |

## Authentication

- Simple password-based auth via `PASSWORD` env variable
- JWT tokens with configurable expiration
- Token sent in `Authorization-Flame: Bearer <token>` header
- Middleware chain: `auth` (extracts token) → `requireAuth` (enforces auth)

### Key Files
- `middleware/auth.js` - Token validation, sets `req.isAuthenticated`
- `middleware/requireAuth.js` - Returns 401 if not authenticated
- `controllers/auth/login.js` - Password check, token generation
- `utils/signToken.js` - JWT signing

## Redux Store Structure

```typescript
state = {
  apps: { categories: Category[], loading: boolean },
  bookmarks: { categories: Category[], loading: boolean },
  config: { config: Config, loading: boolean },
  auth: { isAuthenticated: boolean, token: string | null },
  notifications: Notification[],
  themes: Theme[]
}
```

### Action Pattern
Components use `bindActionCreators` to dispatch:
```tsx
const dispatch = useDispatch();
const { getCategories, createNotification } = bindActionCreators(actionCreators, dispatch);
```

## Frontend Components

### UI Components (`client/src/components/UI/`)
- `Button` - Props: `children`, `click` (not onClick!)
- `InputGroup` - Form field wrapper
- `Spinner` - Loading indicator
- `Modal` - Dialog wrapper
- `Container`, `Headline` - Layout components

### Settings (`client/src/components/Settings/`)
Each settings page follows the same pattern:
1. Load data on mount via `useEffect`
2. Local state for form
3. Submit via axios PUT with `applyAuth()` header
4. Show notification on success/error

Routes defined in `settings.json`:
```json
{ "name": "Layout", "dest": "/settings/layout", "authRequired": true }
```

## Key Patterns

### API Calls (Frontend)
```tsx
import axios from 'axios';
import { applyAuth } from '../../../utility';

// GET (public)
axios.get<ApiResponse<Data>>('/api/endpoint')

// PUT (authenticated)
axios.put<ApiResponse<Data>>('/api/endpoint', payload, { headers: applyAuth() })
```

### Controller Pattern (Backend)
```js
const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');

const handler = asyncWrapper(async (req, res, next) => {
  // Business logic
  if (error) return next(new ErrorResponse('Message', 400));
  
  res.status(200).json({ success: true, data: result });
});
```

### Adding New Settings Page
1. Create component in `client/src/components/Settings/NewSetting/`
2. Add route to `settings.json`
3. Import and add Route in `Settings.tsx`
4. If needs backend, add controller + route

## Environment Variables

```env
PORT=5005           # Backend port
PASSWORD=xxx        # Login password
SECRET=xxx          # JWT signing secret
NODE_ENV=development|production
```

## Development Commands

```bash
npm run dev-init    # First-time setup (install deps)
npm run dev         # Start both servers (concurrently)
npm run dev-server  # Backend only (nodemon)
npm run dev-client  # Frontend only (react-scripts)
```

## Common Issues

1. **Port 3000 in use** - Kill existing process: `netstat -ano | grep :3000` then `taskkill //PID <pid> //F`

2. **Button onClick not working** - Use `click` prop, not `onClick`

3. **Auth not working** - Check `Authorization-Flame` header, ensure `applyAuth()` is used

4. **TypeScript errors** - Check `client/src/interfaces/` for type definitions

5. **Database issues** - SQLite file at `data/db.sqlite`, migrations in `db/migrations/`

## File Locations for Common Tasks

| Task | Files |
|------|-------|
| Add new API endpoint | `routes/*.js`, `controllers/*/` |
| Modify data model | `models/*.js`, add migration |
| Add settings option | `controllers/config/`, frontend component |
| Change home layout | `client/src/components/Home/` |
| Modify auth | `middleware/auth.js`, `controllers/auth/` |
| Add Redux action | `client/src/store/action-creators/`, `reducers/` |
| Custom styling | `public/flame.css` or component `.module.css` |

## Security Notes

- Rate limiting on `/api/auth` (5 attempts/15min)
- Timing-safe password comparison in login
- JWT verification in auth middleware
- `isPublic` field controls visibility when logged out
