# Restaurant App 

Angular 18 (frontend) · Django 5 + DRF (backend) · MongoDB (database)  
Docker · Docker Compose · GitHub Actions CI/CD · Kubernetes

Three services: **frontend**, **backend**, **database** 
---

## Project structure

```
restaurant-app/
├── docker-compose.yml            ← frontend + backend + MongoDB
├── .env.example                  ← optional overrides for compose
├── mongo-init/init.js            ← seed data (first start only)
├── backend/                      ← Django + MongoEngine  (Dockerfile)
├── frontend/                     ← Angular 18 + nginx    (Dockerfile, nginx.conf)
├── k8s/
│   ├── 00-namespace.yml          ← Namespace "restaurant"
│   ├── 01-configmaps.yml         ← backend-config, mongo-config, mongo-init-script, nginx-config
│   ├── 02-secrets.yml            ← Secret TEMPLATE (real one is created by deploy.sh)
│   ├── 03-mongo-statefulset.yml  ← StatefulSet + PVC + headless Service
│   ├── 04-backend-deployment.yml ← Deployment + Service
│   ├── 05-frontend-deployment.yml← Deployment + Service
│   ├── 06-ingress.yml            ← Ingress (/ → frontend, /api → backend)
│   └── deploy.sh                 ← applies everything in the right order
└── .github/workflows/cicd.yml    ← CI/CD pipeline
```
### Notes

* The Secret is created from environment variables and is **not** stored in Git;
  `02-secrets.yml` is only a template showing its structure.
* `01-configmaps.yml` embeds the same seed script as `mongo-init/init.js`.
* The MongoDB password is fixed when the volume is first initialised. To change it later,
  delete the PVC (`kubectl -n restaurant delete pvc mongo-data-mongo-0`) after scaling down.
* `ALLOWED_HOSTS` is `*` in `01-configmaps.yml` so the app works behind any IP or
  domain; restrict it (and add `host:` to the Ingress) when you use a real domain.

## 7. API reference

### Tables `GET/POST /api/tables`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tables?q=&page=0&size=20` | Paginated list |
| POST | `/api/tables` | Create |
| GET | `/api/tables/<id>` | Get one |
| PUT | `/api/tables/<id>` | Update |
| DELETE | `/api/tables/<id>` | Delete |

### Reservations `GET/POST /api/reservations`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reservations?q=&status=&date=` | Paginated list |
| POST | `/api/reservations` | Create |
| GET | `/api/reservations/<id>` | Get one |
| PUT | `/api/reservations/<id>` | Update |
| DELETE | `/api/reservations/<id>` | Delete |
| PATCH | `/api/reservations/<id>/status` | Status only |

Reservation statuses: `pending` → `confirmed` → `completed` / `cancelled`
