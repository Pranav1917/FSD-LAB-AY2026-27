# CineWorld — Movie Ticket Booking & Resale System

A full-stack movie ticket booking platform with a Node.js and Express backend, MongoDB database, JWT-based authentication, Razorpay test-mode payment integration, seat reservation, and ticket resale functionality.

## 📌 Project Overview

CineWorld is a backend case study designed to demonstrate the development of RESTful APIs for a movie ticket booking system. It manages movie listings, showtimes, user accounts, seat reservations, bookings, payment verification, and ticket resale.

The backend provides APIs that connect the frontend with MongoDB and support the core workflows of the application.

## 🎯 Objectives

- Build RESTful APIs using Node.js and Express.js.
- Store and manage application data using MongoDB and Mongoose.
- Implement user registration, login, and JWT authentication.
- Support movie and showtime management.
- Manage seat availability and prevent duplicate seat reservations.
- Integrate Razorpay test-mode payments and payment signature verification.
- Implement ticket resale and ownership transfer.
- Protect administrative movie-management endpoints.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| MongoDB | NoSQL database |
| Mongoose | MongoDB object modeling |
| JWT | Authentication |
| bcrypt | Password hashing |
| Razorpay | Test-mode payment integration |
| HTML, CSS, JavaScript | Frontend interface |
| Postman | API testing |
| VS Code | Development environment |

## 🏗️ System Architecture

```text
             User / Administrator
                      |
                      v
             CineWorld Frontend
                      |
                      v
              Express REST API
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
    Auth & Users   Movies &    Bookings &
                   Showtimes   Seat Reservations
          |           |           |
          +-----------+-----------+
                      |
                      v
                 MongoDB
                      |
                      v
             Payment Integration
                  Razorpay
                      |
                      v
               Ticket Resale
```

## ✨ Key Features

### 1. User Authentication
- User registration and login.
- Password hashing.
- JWT-based authentication.
- HTTP-only authentication cookie.
- Role-based access for customers and administrators.

### 2. Movie Management
- Retrieve movie listings.
- Filter movies by status.
- Retrieve available showtimes.
- View booked seats for a particular show.
- Create, update, and delete movies through protected administrative endpoints.

### 3. Booking and Seat Reservation
- Select a movie, showtime, and seats.
- Calculate the booking total.
- Create a pending booking before payment.
- Hold selected seats to reduce conflicting reservations.
- Confirm bookings after successful payment verification.
- Retrieve a user's bookings.
- Cancel eligible pending bookings.

### 4. Payment Integration
- Create Razorpay orders.
- Verify payment signatures on the backend.
- Update booking and seat-reservation statuses after successful verification.
- Store payment details and transaction status.
- Support testing with Razorpay test-mode credentials.

**Note:** Successful payment verification is required before a pending booking is confirmed through the payment-verification flow.

### 5. Ticket Resale
- View available resale listings.
- List eligible tickets for resale.
- Purchase a listed ticket through the implemented ownership-transfer flow.
- Withdraw an active listing.
- Update booking and seat-reservation ownership when a resale succeeds.

**Payment limitation:** The current resale workflow transfers ownership but does not collect a resale payment. It should not be treated as a complete production resale-payment system.

## 🗄️ Database Models

The application uses MongoDB collections managed through Mongoose.

| Model | Purpose |
|---|---|
| `User` | Stores user accounts, hashed passwords, and roles |
| `Movie` | Stores movie details, prices, images, and status |
| `Show` | Stores movie showtimes and dates |
| `Booking` | Stores booking details, seats, totals, and booking status |
| `SeatReservation` | Tracks held and booked seats for each show |
| `Payment` | Stores payment orders, references, amounts, and statuses |
| `Resale` | Stores ticket resale listings and ownership-transfer status |

### Important Data Relationships

- A show references a movie.
- A booking references a user and a show.
- A payment references a booking and a user.
- A seat reservation references a show and can reference a booking.
- A resale listing references the original booking and the seller; a completed resale also records the buyer.

A unique database index on the show and seat combination helps prevent duplicate reservation records for the same seat and show.

## 🔌 API Endpoints

Base URL for local development:

```text
http://localhost:5000
```

### Health and Movies

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API status |
| GET | `/api/movies` | Retrieve movies |
| GET | `/api/movies?status=now-showing` | Filter movies by status |
| GET | `/api/movies/shows` | Retrieve showtimes |
| GET | `/api/movies/shows?movieId=ID` | Filter showtimes by movie |
| GET | `/api/movies/shows?date=YYYY-MM-DD` | Filter showtimes by date |
| GET | `/api/movies/shows/:id/seats` | Retrieve booked seats for a show |
| POST | `/api/movies` | Create a movie — admin only |
| PUT | `/api/movies/:id` | Update a movie — admin only |
| DELETE | `/api/movies/:id` | Delete a movie — admin only |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in a user |

### Bookings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bookings` | Create a pending booking and reserve seats |
| GET | `/api/bookings/mine` | Retrieve the logged-in user's bookings |
| GET | `/api/bookings/:id` | Retrieve a booking |
| POST | `/api/bookings/:id/cancel` | Cancel an eligible pending booking |

### Payments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/create-order` | Create a Razorpay payment order |
| POST | `/api/payments/verify` | Verify payment signature and update booking status |
| POST | `/api/payments/webhook` | Receive a Razorpay webhook request |

### Ticket Resale

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/resale` | Retrieve active resale listings |
| GET | `/api/resale/mine` | Retrieve the user's listings |
| POST | `/api/resale` | Create a resale listing |
| POST | `/api/resale/:id/buy` | Transfer ownership of a listed ticket |
| POST | `/api/resale/:id/withdraw` | Withdraw a listing |

**API note:** Request bodies, authentication requirements, and validation rules depend on the individual endpoint implementation. Use the source code as the definitive reference for exact request formats.

## ⚙️ Installation and Setup

### Prerequisites

Install the following:

- Node.js and npm
- MongoDB Community Server
- Git (optional)
- Postman (for API testing)

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd CineWorld-fullstack
```

Replace the placeholder with your actual GitHub repository URL.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root using `.env.example` as a reference.

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cineworld
JWT_SECRET=replace_with_a_long_random_secret

RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Replace the placeholder values with your own local configuration and Razorpay test credentials.

**Security:** Never commit `.env`, passwords, JWT secrets, or Razorpay secret keys to GitHub.

### 4. Start MongoDB

Ensure the MongoDB service is running on your computer.

The default connection string uses:

```text
mongodb://127.0.0.1:27017/cineworld
```

### 5. Seed the Database

Run the seed script to insert the sample movie and showtime data:

```bash
node scripts/seed.js
```

Run the seed script only when you intend to load or reset the sample data according to its implementation.

### 6. Start the Backend

```bash
npm start
```

The application should start at:

```text
http://localhost:5000
```

### 7. Verify the API

Open the following URL in your browser or send a GET request using Postman:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "app": "CineWorld API"
}
```

You can also test:

```text
http://localhost:5000/api/movies
http://localhost:5000/api/movies/shows
```

## 🧪 Testing with Postman

The following tests can be used to validate the backend.

| Test | Expected result |
|---|---|
| GET `/api/health` | API health response |
| GET `/api/movies` | Movie data returned from MongoDB |
| GET `/api/movies/shows` | Showtime data returned |
| POST `/api/auth/register` | User registration |
| POST `/api/auth/login` | Login and authentication cookie |
| POST `/api/bookings` | Pending booking and seat reservation |
| POST `/api/payments/create-order` | Payment order created |
| POST `/api/payments/verify` | Signature verification and booking update |
| PUT `/api/movies/:id` | Movie updated by an authorized administrator |
| DELETE `/api/movies/:id` | Movie deleted by an authorized administrator |

Use valid test data and an authenticated session for protected routes. Payment testing requires valid Razorpay test-mode configuration and the appropriate payment flow.

## 🔐 Security Considerations

- Passwords are hashed rather than stored as plain text.
- JWT authentication protects restricted endpoints.
- Authentication cookies use the HTTP-only flag.
- Administrative movie-management routes require an administrator role.
- Payment signatures are verified on the backend.
- Environment variables are used for secrets and configuration.
- A unique index helps prevent duplicate seat-reservation records.

### Production Improvements

Before using the application in production, consider adding:

- HTTPS and secure cookie settings.
- Rate limiting and stronger request validation.
- Atomic transactions for booking, payment, and resale workflows.
- Automatic expiry and cleanup of held seats and unpaid bookings.
- Complete Razorpay webhook event processing and idempotency.
- Payment collection, refund handling, and dispute handling for resale.
- Tests for concurrent bookings, payment failures, and rollback scenarios.
- Logging, monitoring, and deployment configuration.

## 📁 Project Structure

```text
CineWorld-fullstack/
├── middleware/
│   └── auth.js
├── models/
│   ├── Booking.js
│   ├── Movie.js
│   ├── Payment.js
│   ├── Resale.js
│   ├── SeatReservation.js
│   ├── Show.js
│   └── User.js
├── routes/
│   ├── auth.js
│   ├── bookings.js
│   ├── movies.js
│   ├── payments.js
│   └── resale.js
├── scripts/
│   └── seed.js
├── public/
│   ├── index.html
│   ├── booking.html
│   ├── booking.js
│   ├── account.html
│   ├── account.js
│   ├── login.html
│   ├── register.html
│   ├── auth.js
│   ├── resale.html
│   ├── resale.js
│   └── style.css
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## 📈 Learning Outcomes

This case study demonstrates practical understanding of:

- REST API development with Express.js.
- MongoDB schema design and Mongoose relationships.
- Authentication and role-based authorization.
- Seat reservation and booking lifecycle management.
- Payment-order creation and signature verification.
- Ticket resale and ownership-transfer workflows.
- API testing and backend debugging.

## 🚀 Future Enhancements

- Add an administrator dashboard.
- Improve booking history and digital ticket generation.
- Implement seat-hold expiry and automatic cleanup.
- Add complete resale payments and refunds.
- Add automated unit and integration tests.
- Deploy the application with a hosted MongoDB database.

## 👨‍💻 Authors

- **Bheeshma Shankar A**
- **Pranav Ch**

Full Stack Development — CineWorld Movie Ticket Booking & Resale System

## 📄 License

This project was developed for educational and case-study purposes. Add a license such as MIT only if you intend to distribute the project under those terms.
