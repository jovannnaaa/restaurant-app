from django.apps import AppConfig


class ReservationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "restaurant_backend.reservations"

    def ready(self):
        import mongoengine
        from django.conf import settings

        options = {"host": settings.MONGO_URI}
        if settings.MONGO_USERNAME and settings.MONGO_PASSWORD:
            options.update(
                username=settings.MONGO_USERNAME,
                password=settings.MONGO_PASSWORD,
                authentication_source=settings.MONGO_AUTH_SOURCE,
            )
        mongoengine.connect(**options)
