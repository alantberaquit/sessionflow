# Conferia

Conferia is a full-stack event registration and session-management platform for professional conferences. Participants can discover events, maintain a profile, select breakout sessions, submit manual payment evidence, and track registration status. Administrators can review payments and refunds and manage event, plenary, and breakout-session content.

## Live application

- Application: https://conferia-phi.vercel.app/events
- API: https://conferia-api.vercel.app

## Demo accounts

These accounts contain fictional data and are provided only for portfolio evaluation. They are shared accounts, so their visible state may change when another reviewer uses them.

### Participant

- Sign in: https://conferia-phi.vercel.app/login
- Email: `demo.participant@conferia.test`
- Password: `ConferiaDemo2026!`
- Starting state: completed profile with no event registrations

Use this account to browse events, select sessions, walk through registration, and view the participant dashboard. Payment-provider integrations are prototypes; do not enter real financial information.

### Administrator

- Sign in: https://conferia-phi.vercel.app/login
- Email: `demo.admin@conferia.test`
- Password: `ConferiaAdmin2026!`
- Event management: https://conferia-phi.vercel.app/admin/events

Use this account to review the administrator experience, including:

- Creating and editing events
- Publishing or unpublishing event content
- Managing plenary sessions, schedules, rooms, and speakers
- Managing breakout blocks and selectable sessions
- Configuring session capacity, display order, selection limits, and status
- Reviewing manual payments, cancellations, and refunds

Please use clearly labeled test content and remove it after evaluating the management workflow. Do not modify or delete the seeded summit program.

## Technology

- React and Vite
- React Router
- Node.js and Express
- MongoDB Atlas and Mongoose
- JWT authentication and bcrypt password hashing
- Multer receipt uploads
- Vercel frontend and serverless API deployments

## Local development

Install and start the API:

```bash
cd server
npm install
npm run dev
```

In another terminal, install and start the frontend:

```bash
cd client
npm install
npm run dev
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting configuration and current free-tier limitations.
