#!/usr/bin/env bash
# =============================================================================
# k8s/deploy.sh – deploy the whole restaurant app into the "restaurant"
# namespace of the cluster kubectl currently points to.
#
# Used both manually and by the GitHub Actions pipeline (deploy-k8s job).
#
#   DOCKER_USERNAME=myuser IMAGE_TAG=latest ./k8s/deploy.sh
#
# Environment variables
#   DOCKER_USERNAME      (required) DockerHub user that owns the images
#   IMAGE_TAG            image tag, default: latest
#   DJANGO_SECRET_KEY    optional – generated randomly if the Secret does not exist yet
#   MONGO_ROOT_PASSWORD  optional – generated randomly if the Secret does not exist yet
#
# If the Secret already exists and neither secret variable is given, it is kept
# as is (re-running the script never changes the database password).
# NOTE: the MongoDB password is fixed when the volume is first initialised;
# to change it later delete the PVC (mongo-data-mongo-0) as well.
# =============================================================================
set -euo pipefail

: "${DOCKER_USERNAME:?Set DOCKER_USERNAME to the DockerHub user that owns the images}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
NS="restaurant"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

command -v kubectl >/dev/null || { echo "kubectl not found" >&2; exit 1; }

# Replace the image placeholders without touching the files on disk
render() {
  sed -e "s|DOCKER_USERNAME|${DOCKER_USERNAME}|g" -e "s|IMAGE_TAG|${IMAGE_TAG}|g" "$1"
}

echo "==> Namespace"
kubectl apply -f "$DIR/00-namespace.yml"

echo "==> ConfigMaps"
kubectl apply -f "$DIR/01-configmaps.yml"

echo "==> Secret"
if [[ -n "${DJANGO_SECRET_KEY:-}" || -n "${MONGO_ROOT_PASSWORD:-}" ]] \
   || ! kubectl -n "$NS" get secret restaurant-secrets >/dev/null 2>&1; then
  if ! command -v openssl >/dev/null && { [[ -z "${DJANGO_SECRET_KEY:-}" ]] || [[ -z "${MONGO_ROOT_PASSWORD:-}" ]]; }; then
    echo "openssl is needed to generate random secrets (or set both variables)" >&2
    exit 1
  fi
  DJANGO_SECRET_KEY="${DJANGO_SECRET_KEY:-$(openssl rand -hex 32)}"
  MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD:-$(openssl rand -hex 16)}"
  kubectl create secret generic restaurant-secrets \
    --namespace="$NS" \
    --from-literal=django-secret-key="$DJANGO_SECRET_KEY" \
    --from-literal=mongo-root-username="admin" \
    --from-literal=mongo-root-password="$MONGO_ROOT_PASSWORD" \
    --dry-run=client -o yaml | kubectl apply -f -
else
  echo "Secret restaurant-secrets already exists – keeping it."
fi

echo "==> MongoDB (StatefulSet + headless Service)"
kubectl apply -f "$DIR/03-mongo-statefulset.yml"
kubectl -n "$NS" rollout status statefulset/mongo --timeout=240s

echo "==> Backend (image ${DOCKER_USERNAME}/restaurant-backend:${IMAGE_TAG})"
render "$DIR/04-backend-deployment.yml" | kubectl apply -f -
kubectl -n "$NS" rollout status deployment/backend --timeout=240s

echo "==> Frontend (image ${DOCKER_USERNAME}/restaurant-frontend:${IMAGE_TAG})"
render "$DIR/05-frontend-deployment.yml" | kubectl apply -f -
kubectl -n "$NS" rollout status deployment/frontend --timeout=240s

echo "==> Ingress"
kubectl apply -f "$DIR/06-ingress.yml"

echo
echo "================ Namespace: $NS ================"
kubectl -n "$NS" get pods,deployments,statefulsets,services,ingress,configmaps,secrets,pvc
echo
echo "Done. Find the address with:  kubectl -n $NS get ingress restaurant-ingress"
