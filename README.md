# Mo Money - Modern Banking Application

A modern banking application built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

- User authentication with JWT
- Real-time balance updates
- Transaction history
- Money transfers
- Loan requests
- Account management
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd mo-money
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend/config` directory with the following variables:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=3001
```

4. Start the development server:
```bash
npm run dev
```

5. Access the application at `http://localhost:3001`

## Project Structure

```
mo_money/
├── backend/
│   ├── config/
│   │   └── config.env
│   ├── controllers/
│   │   └── userController.js
│   ├── models/
│   │   └── userModel.js
│   └── server.js
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── js/
│   │   │   ├── login.js
│   │   │   └── dashboard.js
│   │   └── img/
│   │       ├── icon.png
│   │       └── logo.png
│   ├── index.html
│   └── dashboard.html
└── package.json
```

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `GET /api/user` - Get user data
- `POST /api/movements` - Add a new movement
- `GET /api/movements` - Get user movements

## License

MIT 