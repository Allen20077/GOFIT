# GoFit Protein — Frontend

GoFit Protein is a web application for discovering protein food boxes, placing orders, and managing sales through an admin dashboard. The frontend is built with React and Vite.

## Features

- **Product display:** Browse GoFit protein food boxes and available add-ons.
- **Order placement:** Enter customer details, select quantities, and choose pickup options.
- **WhatsApp integration:** Open WhatsApp with a prepared order message.
- **Customer authentication:** Access customer login functionality.
- **Admin dashboard:** View order statistics, boxes sold, revenue, and order history.
- **Manual sales records:** Add manual order, box-sale, and revenue figures to dashboard statistics.
- **Responsive interface:** Designed for desktop and mobile browsers.
- **Installable web app:** Includes app-icon and web-app manifest configuration.

## Tech Stack

- React
- Vite
- JavaScript
- HTML5
- CSS3
- FastAPI backend integration

## Project Structure

```text
frontend/
├── public/
│   ├── gofit-icon-192.png
│   ├── gofit-icon-512.png
│   └── manifest.webmanifest
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

## Requirements

Install the following before running the project:

- Node.js
- npm
- The GoFit backend, if using features that require the API

## Installation

Open a terminal in the `frontend` directory and run:

```bash
npm install
```

## Environment Configuration

Create a `.env.local` file inside `frontend/` if your local setup requires a custom backend URL.

Example:

```env
VITE_API_URL=http://localhost:8000
```

Use the actual backend URL for your environment. Do not place passwords, JWT secrets, or private API keys in frontend environment variables.

## Run the Development Server

```bash
npm run dev
```

Vite will display the local URL in the terminal, usually:

```text
http://localhost:5173
```

Open that URL in your browser.

## Build for Production

```bash
npm run build
```

The production build is generated in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

## Backend Integration

The frontend communicates with the GoFit backend for features that require server-side processing, such as authentication and order management.

For local development, the backend is typically available at:

```text
http://localhost:8000
```

Ensure the backend is running and the configured API URL is correct before testing API-dependent features.

## Deployment

The frontend can be deployed to Vercel or another platform that supports Vite applications.

For deployment:

1. Install the project dependencies.
2. Configure the appropriate backend API URL.
3. Run the production build.
4. Deploy the frontend using the hosting platform's build settings.
5. Verify login, order placement, dashboard data, and app installation after deployment.

## Security Notes

- Never commit `.env` files containing secrets.
- Keep JWT signing secrets on the backend.
- Protect administrative endpoints with server-side authentication and authorization.
- Validate order data on the backend rather than relying only on frontend validation.

## Project

**Name:** GoFit Protein  
**Application:** Protein food-box ordering and sales management  
**Frontend:** React + Vite  
**Backend:** Python + FastAPI
