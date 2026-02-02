# API Runtimes & SQLite Compatibility

## Node.js Runtime (Required)
The application uses `better-sqlite3` for local database operations. This library depends on native Node.js bindings and **is not compatible with the Edge Runtime**.

### Enforcing Node.js Runtime
All API routes that interact with the database (directly or via `lib/db.js`) must explicitly export the following configuration:

```javascript
export const config = {
  runtime: 'nodejs',
};
```

## Edge Runtime
The Edge Runtime should only be used for:
- Lightweight API routes without database dependencies.
- Middleware (e.g., authentication checks that don't hit the DB).
- Simple data transformation or proxying.

## Audit Checklist
- [x] `pages/api/est/[weekId].js` -> Node.js enforced.
- [x] `pages/api/get-lesson.js` -> Node.js enforced.
- [ ] Any new route importing `lib/db.js` MUST enforce Node.js.
