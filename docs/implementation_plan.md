# SmartStayX AI Concierge Platform Implementation Plan

**Version:** 1.0  
**Project:** SmartStayX Hotel Management and AI Concierge System  
**Architecture:** MERN, FastAPI AI microservice, MongoDB, external AI provider

## 1. Project Overview

### 1.1 Objective

Build an AI-powered hotel concierge platform that supports:

- Intelligent guest assistance
- Hotel and room recommendations
- Booking support
- Reservation status checks
- Guest service requests
- Personalized travel recommendations
- Conversation history management

The AI service works as an internal microservice connected through the main Express backend.

```text
Frontend
   |
Node.js Backend
   |
FastAPI AI Service
   |
MongoDB
   |
OpenRouter / LLM Provider
```

## 2. Development Principles

### 2.1 Simplicity First

Implementation should:

- Use simple, direct solutions
- Avoid unnecessary abstractions
- Keep business logic separated by service boundary
- Prefer readable code over complex optimization

### 2.2 Code Quality Standards

Use descriptive names for functions, variables, and API payload fields.

Good examples:

```python
get_user_bookings()
create_service_request()
conversation_id
```

Avoid vague names:

```python
x()
abc()
data1
```

### 2.3 Logging

Development must include useful logging for API failures, database issues, AI provider errors, and authentication problems.

Example:

```python
logger.exception("LLM request failed request_id=%s", request_id)
```

## 3. Implementation Phases

## Phase 1: Project Foundation

**Duration:** Week 1

### Tasks

1. Confirm repository structure:

```text
SmartStayX/
├── frontend/
├── backend/
├── ai-service/
├── ml-service/
└── docs/
```

2. Prepare environment configuration:

```text
.env
.env.example
```

Backend variables:

```text
MONGODB_URI
REDIS_URL
CLERK_SECRET_KEY
STRIPE_SECRET_KEY
AI_SERVICE_URL
AI_INTERNAL_TOKEN
```

AI service variables:

```text
MONGODB_URI
OPENAI_API_KEY
AI_MODEL
AI_INTERNAL_TOKEN
```

3. Confirm database collections:

```text
users
hotels
rooms
bookings
conversations
messages
serviceRequests
```

### Deliverables

- Repository structure ready
- Environment setup documented
- Database connection working

## Phase 2: Backend Core Development

**Duration:** Weeks 2-3

### 2.1 Authentication System

Technology: Clerk Authentication

```text
User Login -> Clerk -> Backend Middleware -> User Identity
```

Features:

- User authentication
- Role management
- Organization support

Roles:

```text
guest
receptionist
hotel_manager
super_admin
```

### 2.2 Hotel Management

Implement hotel CRUD:

- Create hotel
- Update hotel
- Delete hotel
- Search hotel

Hotel data:

```text
name
city
description
amenities
owner
approvalStatus
```

### 2.3 Room Management

Features:

- Add rooms
- Update rooms
- Check availability

Room data:

```text
roomNumber
roomType
pricePerNight
hotel
availability
```

### 2.4 Booking System

Features:

- Create booking
- Check availability
- Process payments
- Cancel booking
- Modify booking

Flow:

```text
Guest -> Search Hotel -> Select Room -> Check Availability -> Payment -> Booking Confirmed
```

## Phase 3: AI Microservice Development

**Duration:** Weeks 4-5

### 3.1 FastAPI Service Setup

Target structure:

```text
ai-service/
└── app/
    ├── main.py
    ├── config.py
    ├── database.py
    ├── routers/
    ├── services/
    ├── models/
    └── utils/
```

### 3.2 Internal Authentication

Purpose: prevent public access to the AI service.

```text
Frontend -> Backend -> AI Service
```

Required header:

```text
x-internal-token
```

Security behavior:

- Missing internal token: `503`
- Invalid internal token: `401 Unauthorized`

### 3.3 AI Chat System

Endpoint:

```text
POST /api/chat/message
```

Input:

```json
{
  "message": "Show hotels in Colombo"
}
```

Output:

```json
{
  "conversationId": "xxx",
  "message": "Here are available hotels..."
}
```

### 3.4 Streaming Response

Implement Server-Sent Events for streaming responses.

Endpoint:

```text
POST /api/chat/message/stream
```

Flow:

```text
User -> AI Request -> Token Streaming -> UI Update
```

## Phase 4: AI Tool Integration

**Duration:** Week 6

Implement function calling for these tools:

- `search_hotels()` searches hotels by name or city.
- `check_room_availability()` checks availability by hotel, check-in date, and check-out date.
- `get_hotel_details()` returns description, amenities, and contact information.
- `get_user_bookings()` returns only the logged-in user's bookings.
- `get_booking_status()` validates user ownership before returning booking status.
- `create_service_request()` creates housekeeping, maintenance, room service, or other guest requests.

## Phase 5: Personalization Engine

**Duration:** Week 7

### User Context

Collect:

```text
name
preferences
previous bookings
preferred language
recent searches
```

### Hotel Context

Collect:

```text
hotel name
city
amenities
rooms
ratings
```

Prompt composition:

```text
User Context + Hotel Context + Conversation = Personalized Answer
```

## Phase 6: Security Implementation

**Duration:** Week 8

### 6.1 Authentication

Tests:

- Token required
- Invalid token rejected

### 6.2 Authorization

Prevent users from accessing other users' data.

Example rule:

```text
A booking can be read only when booking.user_id equals request.user_id.
```

### 6.3 IDOR Protection

Protect:

- Conversations
- Bookings
- Service requests

Validation:

```text
request user_id == resource owner
```

## Phase 7: Testing Plan

**Duration:** Week 9

### Unit Testing

Framework: `pytest`

Test:

- Functions
- Services
- Validation

### API Testing

Endpoints:

```text
GET /api/health
POST /api/chat/message
POST /api/chat/message/stream
GET /api/chat/conversations
```

### Security Testing

Test cases:

- User A cannot access User B conversation
- User A cannot view User B booking
- Unauthorized service request is blocked

### Performance Testing

Measure:

- API response time
- AI latency
- Database query performance

Targets:

```text
API response < 500ms
AI response < 5 seconds
```

## Phase 8: Deployment Plan

**Duration:** Week 10

Production architecture:

```text
Cloud Load Balancer
        |
Frontend Hosting
        |
Backend API Server
        |
AI Microservice
        |
MongoDB Atlas
```

### Backend Checklist

- Environment variables configured
- Database connection verified
- Logging enabled

### AI Service Checklist

- AI provider API configured
- Internal token configured
- MongoDB connected

### Security Checklist

- HTTPS enabled
- Secrets protected
- CORS configured

## Phase 9: Monitoring

Track:

- API errors
- AI failures
- Database failures

Log levels:

```text
INFO
WARNING
ERROR
EXCEPTION
```

## Phase 10: Future Improvements

### AI Improvements

- Voice assistant
- Multilingual AI
- Image-based hotel search
- Smart itinerary generation

### Business Improvements

- Loyalty recommendations
- Dynamic pricing
- Automated customer support

## Final Deliverables

| Item | Status |
| --- | --- |
| Backend API | Planned |
| AI Microservice | Implemented |
| Authentication | Implemented |
| Chat System | Implemented |
| Tool Calling | Implemented |
| Security Tests | Implemented |
| Documentation | Required |
| Deployment | Pending |

## Recommended Documentation Files

```text
docs/
├── prd.md
├── implementation_plan.md
├── audit.md
├── bugs.md
└── testing.md
```

This roadmap covers development, testing, deployment, monitoring, and future expansion for SmartStayX.
