# API Documentation

This directory contains the API documentation for AI Code Mentor.

## OpenAPI Specification

The complete API is documented in OpenAPI 3.0 format:
- [openapi.yaml](./openapi.yaml) - Full specification

## Viewing the Documentation

### Option 1: Swagger Editor (Online)
1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Copy the contents of `openapi.yaml`
3. Paste into the editor

### Option 2: Local Swagger UI
```bash
npx @redocly/cli preview-docs docs/api/openapi.yaml
```

### Option 3: VS Code Extension
Install the "OpenAPI (Swagger) Editor" extension.

## Quick Reference

### Authentication
All protected endpoints require a JWT token in the `ai-code-mentor-auth` cookie.

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}'
```

### Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Auth (`/auth/*`) | 5 req / 15 min |
| General API | 60 req / 1 min |
| AI (`/generate-lesson`, `/v2/analyze`) | 10 req / 5 min |

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | User registration |
| POST | `/auth/logout` | User logout |
| GET | `/auth/user` | Get current user |
| POST | `/generate-lesson` | Generate AI lesson |
| POST | `/v2/analyze` | Analyze code with AI |
| GET | `/progress-summary` | Get learning progress |
| GET | `/health` | Health check |
