# MADOLOGY Backend

Production-ready Express backend for the MADOLOGY storefront with JWT auth, bcrypt password hashing, MongoDB Atlas, role-based access control, email verification, password reset, security middleware, and deployment support.

## Folder Structure

```text
server.js
package.json
.env.example
.gitignore
src/
  app.js
  config/
    database.js
  controllers/
    admin.controller.js
    auth.controller.js
    order.controller.js
  middleware/
    async.middleware.js
    auth.middleware.js
    error.middleware.js
    rate-limit.middleware.js
  models/
    Order.js
    User.js
  routes/
    admin.routes.js
    auth.routes.js
    order.routes.js
  services/
    email.service.js
    token.service.js
public/
  auth.js
  login.js
  register.js
  admin.html
  products.html
```

## Main Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/verify/:token`
- `POST /auth/forgot-password`
- `GET /auth/reset-password/:token`
- `POST /auth/reset-password/:token`
- `GET /auth/me`
- `POST /orders`
- `GET /admin/users`
- `GET /admin/orders`

Compatibility routes kept for the current frontend:

- `POST /register`
- `POST /login`
- `POST /order`

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `BACKEND_PUBLIC_URL`
   - `CORS_ORIGINS`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `EMAIL_FROM`
   - `ADMIN_EMAILS`

## Local Run

```bash
npm install
npm run dev
```

Health check:

```bash
http://localhost:3000/health
```

## MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Add your IP in `Network Access`.
4. Copy the Atlas connection string into `MONGODB_URI`.
5. Use a database name like `madology`.

## Email Verification and Reset

- Registration creates a verification token that expires in 24 hours.
- Forgot password creates a reset token that expires in 15 minutes.
- Tokens are stored hashed in MongoDB.
- The email link points to your backend public URL.

## Frontend Integration Examples

Use this base URL pattern:

```js
const API_BASE_URL = window.MADOLOGY_API_BASE_URL || localStorage.getItem("apiBaseUrl") || "http://localhost:3000";
```

Register:

```js
await fetch(`${API_BASE_URL}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, address, password })
});
```

Login:

```js
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
localStorage.setItem("token", data.token);
localStorage.setItem("userName", data.user.name);
localStorage.setItem("userRole", data.user.role);
```

Protected admin request:

```js
await fetch(`${API_BASE_URL}/admin/users`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});
```

Create order:

```js
await fetch(`${API_BASE_URL}/orders`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
  },
  body: JSON.stringify({ items: cart })
});
```

## GitHub Steps

1. `git init`
2. `git add .`
3. `git commit -m "Build production-ready MADOLOGY backend"`
4. Create a GitHub repository.
5. `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git`
6. `git branch -M main`
7. `git push -u origin main`

## Render Deployment

1. Push to GitHub.
2. Create a new Render Web Service.
3. Connect the repository.
4. Use:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add all environment variables from `.env.example`.
6. Set:
   - `BACKEND_PUBLIC_URL=https://your-service.onrender.com`
   - `FRONTEND_URL=https://your-frontend-domain.com`
   - `CORS_ORIGINS=https://your-frontend-domain.com`
7. Enable auto deploy from GitHub.

## Railway Deployment

1. Push to GitHub.
2. Create a Railway project from the repo.
3. Set all environment variables.
4. Generate a public domain.
5. Update:
   - `BACKEND_PUBLIC_URL`
   - `FRONTEND_URL`
   - `CORS_ORIGINS`
6. Keep automatic deploy enabled.

## Admin Role

Users default to `user`.

To create an admin, add the email before registration:

```env
ADMIN_EMAILS=admin@madology.com
```
