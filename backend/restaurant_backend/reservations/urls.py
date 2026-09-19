from django.urls import path
from .views import (
    TableListView,
    TableDetailView,
    ReservationListView,
    ReservationDetailView,
    ReservationStatusView,
)

urlpatterns = [

    path("tables", TableListView.as_view(), name="table-list"),
    path("tables/<str:pk>", TableDetailView.as_view(), name="table-detail"),

    path("reservations", ReservationListView.as_view(), name="reservation-list"),
    path("reservations/<str:pk>", ReservationDetailView.as_view(), name="reservation-detail"),
    path("reservations/<str:pk>/status", ReservationStatusView.as_view(), name="reservation-status"),
]
