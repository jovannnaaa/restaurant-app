from django.urls import path, include

urlpatterns = [
    path("api/", include("restaurant_backend.reservations.urls")),
]
