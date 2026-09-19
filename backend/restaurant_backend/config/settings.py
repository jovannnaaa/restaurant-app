import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key-change-in-production")
DEBUG = os.environ.get("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "corsheaders",
    "rest_framework",
    "restaurant_backend.reservations",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "restaurant_backend.config.urls"

WSGI_APPLICATION = "restaurant_backend.config.wsgi.application"

# ── MongoDB via pymongo (mongoengine) ──────────────────────────────────────────
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/restaurantdb")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "restaurantdb")
# Optional credentials. Passed separately from the URI so that passwords with
# special characters (@ : / ?) never need URL-encoding. Leave empty for a
# MongoDB without authentication (local development).
MONGO_USERNAME = os.environ.get("MONGO_USERNAME") or None
MONGO_PASSWORD = os.environ.get("MONGO_PASSWORD") or None
MONGO_AUTH_SOURCE = os.environ.get("MONGO_AUTH_SOURCE", "admin")

# ── DRF ───────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER": "restaurant_backend.reservations.exceptions.custom_exception_handler",
}

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
CORS_ALLOW_HEADERS = ["*"]

# ── Misc ──────────────────────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = False
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Dummy DB so Django doesn't complain (we use MongoDB directly via mongoengine)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.dummy",
    }
}
