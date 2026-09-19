# Restaurant Backend

Django + MongoDB REST API for managing restaurant reservations.

## Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Framework  | Django 5 + Django REST Framework  |
| Database   | MongoDB (via MongoEngine ODM)     |
| Server     | Gunicorn                          |
| Container  | Docker                            |

---

## Quick Start

### 1. Clone & configure

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and secret key
```

### 2. Install dependencies

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run

```bash
python manage.py runserver 8080
```

### 4. Docker

```bash
docker build -t restaurant-backend .
docker run -p 8080:8080 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/restaurantdb \
  restaurant-backend
```

---

## API Reference

All endpoints are prefixed with `/api/`.

### Tables

| Method | Endpoint             | Description                         |
|--------|----------------------|-------------------------------------|
| GET    | `/api/tables`        | List tables (paginated, search `?q=`) |
| POST   | `/api/tables`        | Create a table                      |
| GET    | `/api/tables/<id>`   | Get one table                       |
| PUT    | `/api/tables/<id>`   | Full update a table                 |
| DELETE | `/api/tables/<id>`   | Delete a table                      |

**Table body (POST/PUT)**
```json
{
  "number": 5,
  "capacity": 4,
  "location": "window",
  "is_active": true
}
```

### Reservations

| Method | Endpoint                          | Description                          |
|--------|-----------------------------------|--------------------------------------|
| GET    | `/api/reservations`               | List reservations (paginated)        |
| POST   | `/api/reservations`               | Create a reservation                 |
| GET    | `/api/reservations/<id>`          | Get one reservation                  |
| PUT    | `/api/reservations/<id>`          | Full update a reservation            |
| DELETE | `/api/reservations/<id>`          | Delete a reservation                 |
| PATCH  | `/api/reservations/<id>/status`   | Update status only                   |

**Query params for GET `/api/reservations`**
- `q` — search by guest name / email / phone
- `status` — filter by status (`pending`, `confirmed`, `cancelled`, `completed`)
- `date` — filter by date (`YYYY-MM-DD`)
- `page` — 0-indexed page number (default `0`)
- `size` — page size (default `20`)

**Reservation body (POST/PUT)**
```json
{
  "guest_name": "Ana Jovanovska",
  "guest_email": "ana@example.com",
  "guest_phone": "+389 70 123456",
  "table_id": "<mongo-object-id>",
  "party_size": 3,
  "reservation_date": "2025-12-24T19:00:00Z",
  "duration_minutes": 90,
  "status": "confirmed",
  "special_requests": "Window seat preferred",
  "notes": "Regular customer"
}
```

**Status update (PATCH)**
```json
{ "status": "confirmed" }
```

### Pagination response shape

All list endpoints return the same envelope (matches Spring's `PageResponse`):

```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3,
  "first": true,
  "last": false,
  "empty": false
}
```

### Reservation statuses

| Status      | Meaning                              |
|-------------|--------------------------------------|
| `pending`   | Created, awaiting confirmation       |
| `confirmed` | Confirmed by restaurant staff        |
| `cancelled` | Cancelled by guest or staff          |
| `completed` | Guests have dined and left           |

---

## Project Structure

```
restaurant-backend/
├── manage.py
├── requirements.txt
├── Dockerfile
├── .env.example
└── restaurant_backend/
    ├── config/
    │   ├── settings.py      # Django settings (MongoDB URI, CORS, DRF)
    │   ├── urls.py          # Root URL routing
    │   └── wsgi.py
    └── reservations/
        ├── apps.py          # AppConfig — connects MongoEngine on startup
        ├── models.py        # MongoEngine documents: Table, Reservation
        ├── serializers.py   # DRF serializers
        ├── views.py         # APIView classes (CRUD + search + status patch)
        ├── urls.py          # /api/tables and /api/reservations routes
        ├── pagination.py    # page_response() helper
        └── exceptions.py    # Custom DRF exception handler
```
