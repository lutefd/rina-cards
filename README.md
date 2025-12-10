# RinaCards - K-pop Photocard Marketplace

This is a [Next.js](https://nextjs.org) project for a K-pop photocard marketplace with group purchase functionality.

## Tech Stack

- **Frontend**: Next.js 16 with App Router
- **Database**: PostgreSQL in Docker
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth with Google OAuth and Email/Password
- **UI**: Tailwind CSS with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose

### Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and update the values
3. Run the setup script:

```bash
pnpm setup
```

This will:
- Start PostgreSQL in Docker
- Generate the database schema
- Run migrations

4. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Google OAuth Setup

To enable Google OAuth authentication:

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Configure the OAuth consent screen
3. Create OAuth 2.0 credentials
4. Add the client ID and secret to your `.env.local` file:

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
