# Restaurant App 

Angular 18 (frontend) · Django 5 + DRF (backend) · MongoDB (database)  
Docker · Docker Compose · GitHub Actions CI/CD · Kubernetes

Three services: **frontend**, **backend**, **database** (MongoDB, seeded with 6 tables and 2 sample reservations).

---

## 1. Run with Docker Compose

```bash
docker compose up --build
```

| Service  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:4200     |
| Backend  | http://localhost:8080/api |
| MongoDB  | `127.0.0.1:27017` (host only, authentication enabled) |

Every setting has a working default; to override, copy `.env.example` to `.env`.

```bash
docker compose down        # stop
docker compose down -v     # stop AND delete the database volume (re-seeds on next start)
```

> Upgrading from an older version without MongoDB authentication? Run
> `docker compose down -v` once, because the credentials are only applied when the
> volume is created.

## 2. Local development (without Docker)

```bash
# Backend  (needs MongoDB on localhost:27017)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 8080

# Frontend
cd frontend
npm install
npm start                  # http://localhost:4200, proxies /api → :8080
```

## 3. Project structure

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

## 4. Publish to a public Git repository

```bash
git init
git add .
git commit -m "Restaurant app: docker, compose, CI/CD, kubernetes"
git branch -M main
git remote add origin https://github.com/<your-user>/restaurant-app.git
git push -u origin main
```

Create the repository on GitHub as **Public**. Never commit a `.env` file or real
secrets (`.gitignore` already excludes them).

## 5. CI/CD (GitHub Actions)

Workflow: `.github/workflows/cicd.yml` — runs on every push to `main`/`master`
(and on pull requests for the checks only).

| Job | What it does | When |
|-----|--------------|------|
| `ci` | flake8, Django import check, TypeScript check, `docker compose config` | every push / PR |
| `build-and-push` | builds both images (amd64 + arm64) and pushes them to **DockerHub** as `:latest` and `:<git-sha>` | push to `main`/`master` |
| `deploy-compose` | *(bonus, optional)* SSH to a VM → `docker compose pull && up -d` | repo variable `DEPLOY_COMPOSE=true` |
| `deploy-k8s` | *(bonus, optional)* runs `k8s/deploy.sh` against your cluster | repo variable `DEPLOY_K8S=true` |

### Setup (required part – CI)

1. Create a DockerHub access token (Account settings → Security → New Access Token).
2. In GitHub: **Settings → Secrets and variables → Actions → Secrets**, add  
   `DOCKER_USERNAME` and `DOCKER_TOKEN`.
3. Push to `main`. The images appear at
   `hub.docker.com/r/<user>/restaurant-backend` and `.../restaurant-frontend`.
   Keep the repositories **public** (DockerHub default) so servers/clusters can pull them
   without credentials.

### Setup (optional part – CD)

Add the secrets listed at the top of `cicd.yml` (`DJANGO_SECRET_KEY`,
`MONGO_ROOT_PASSWORD`, plus `SSH_*` for Compose or `KUBECONFIG_B64` for Kubernetes) and
set the matching repository **variable** (`DEPLOY_COMPOSE` / `DEPLOY_K8S`) to `true`.
Use hexadecimal/alphanumeric values for `MONGO_ROOT_PASSWORD` (`openssl rand -hex 16`).

## 6. Kubernetes

All resources live in the namespace **`restaurant`**.

| Requirement | File | Resources |
|-------------|------|-----------|
| Namespace | `00-namespace.yml` | `Namespace restaurant` |
| ConfigMaps / Secrets | `01-configmaps.yml`, `02-secrets.yml` | `backend-config`, `mongo-config`, `mongo-init-script`, `nginx-config`; Secret `restaurant-secrets` |
| Deployment (app) | `04-…`, `05-…` | `Deployment backend`, `Deployment frontend` (2 replicas, probes, rolling update) |
| Service (app) | `04-…`, `05-…` | `backend-svc`, `frontend-svc` (ClusterIP) |
| Ingress | `06-ingress.yml` | `restaurant-ingress` (nginx) |
| StatefulSet (DB) | `03-mongo-statefulset.yml` | `StatefulSet mongo` + `volumeClaimTemplates` (2 Gi) + headless `mongo-svc`, using the ConfigMaps and the Secret |

### Deploy

Prerequisites: a cluster (minikube, kind, k3s, a cloud cluster…), `kubectl` pointing
to it, an **NGINX Ingress Controller**, and the images on DockerHub (pushed by the
pipeline; for a first manual push:
`docker build -t <user>/restaurant-backend:latest backend && docker push …`, same for `frontend`).

```bash
# minikube example
minikube start
minikube addons enable ingress

DOCKER_USERNAME=<your-dockerhub-user> IMAGE_TAG=latest bash k8s/deploy.sh
```

`deploy.sh` applies the namespace, ConfigMaps, Secret (random values are generated on the
first run; existing ones are kept), the MongoDB StatefulSet, waits for it, then the backend,
frontend and Ingress, and finally prints every resource in the namespace.

### Demonstrate that it works

```bash
kubectl get all,ingress,configmap,secret,pvc -n restaurant     # everything Running / Ready
kubectl get pods -n restaurant -o wide

# open the app
minikube ip                       # → http://<that-ip>/        (frontend)
curl http://$(minikube ip)/api/tables                          # → JSON with 6 tables
# no ingress available? use a port-forward instead:
kubectl -n restaurant port-forward svc/frontend-svc 8081:80    # → http://localhost:8081

# data survives a database restart (StatefulSet + PVC)
kubectl -n restaurant delete pod mongo-0
kubectl -n restaurant get pods -w                              # mongo-0 comes back
curl http://$(minikube ip)/api/tables                          # still the same data
```

With the Docker driver on macOS/Windows keep `minikube tunnel` running and use
`http://127.0.0.1/` instead of the minikube IP.

Remove everything: `kubectl delete namespace restaurant`.

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
