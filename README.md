# N-Auth
> A demonstration of multi-device login system with configurable device limits and real-time session tracking

![GitHub](https://img.shields.io/github/license/adhi1911/n-device-login)
![React](https://img.shields.io/badge/react-19-%2361DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116.1-%2306D6A0.svg)

## Overview
This project demonstrates a login system that:
- Enforces a maximum number (N) of concurrent device logins per user
- Shows what happens when a user attempts login from device #N+1
- Provides force logout capabilities for existing sessions
- Visualizes the entire login flow and session management

## Animated Demo Steps
1. **New Device Login** - User attempts login from device #N+1
2. **Session Validation** - System checks active sessions (N/N)
3. **Limit Check** - Device limit reached (MAX: N)
4. **Access Denied** - Login blocked, shows active devices

## Tech Stack

### Frontend
- Next.js 15.5
- React 19
- Tailwind CSS
- Auth0 SDK

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- Python-Jose

## Environment Setup

### Frontend (.env)
```env
DOMAIN=your-auth0-domain
API_AUDIENCE=your-api-audience
CLIENT_ID=your-client-id
BACKEND_URI=http://localhost:8000
FRONTEND_URI=http://localhost:3000
REDIRECT_URI=http://localhost:8000/token
SCOPE=offline_access openid profile email
MAX_N=3
```

### Backend (.env)
```env
DOMAIN=your-auth0-domain
API_AUDIENCE=your-api-audience
ISSUER=https://your-auth0-domain/
ALGORITHMS=RS256
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
MAX_N=3
SCOPE=offline_access openid profile email
BACKEND_URI=http://localhost:8000
FRONTEND_URI=http://localhost:3000
REDIRECT_URI=http://localhost:8000/token
```

## Quick Start

```bash
# Frontend
cd frontend
npm install && npm run dev

# Backend
cd backend
python -m venv venv && .\venv\Scripts\activate
pip install -r requirements.txt
hypercorn main:app --reload --bind 0.0.0.0:8000
```

Visit `http://localhost:3000` to see the demonstration 🚀

## Contributing
For contributions, please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License
MIT © [Aaradhya]

---
This project uses Auth0 for authentication. Make sure to configure your Auth0 application properly with the correct callback URLs and permissions.