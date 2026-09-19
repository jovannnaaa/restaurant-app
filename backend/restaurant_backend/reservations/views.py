import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Table, Reservation
from .serializers import TableSerializer, ReservationSerializer, ReservationStatusSerializer
from .pagination import page_response


class TableListView(APIView):
    """
    GET  /api/tables          List / search tables (paginated)
    POST /api/tables          Create a table
    """

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        page = int(request.query_params.get("page", 0))
        size = int(request.query_params.get("size", 20))

        qs = Table.objects.order_by("number")
        if q:
            qs = qs.filter(location__icontains=q)

        return Response(page_response(qs, page, size, TableSerializer))

    def post(self, request):
        serializer = TableSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        table = serializer.save()
        return Response(TableSerializer(table).data, status=status.HTTP_201_CREATED)


class TableDetailView(APIView):
    """
    GET    /api/tables/<id>   Retrieve a table
    PUT    /api/tables/<id>   Full update
    DELETE /api/tables/<id>   Delete
    """

    def _get_table(self, pk):
        try:
            return Table.objects.get(id=pk)
        except (Table.DoesNotExist, Exception):
            return None

    def get(self, request, pk):
        table = self._get_table(pk)
        if not table:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(TableSerializer(table).data)

    def put(self, request, pk):
        table = self._get_table(pk)
        if not table:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = TableSerializer(table, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        updated = serializer.save()
        return Response(TableSerializer(updated).data)

    def delete(self, request, pk):
        table = self._get_table(pk)
        if not table:
            return Response(status=status.HTTP_404_NOT_FOUND)
        table.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReservationListView(APIView):
    """
    GET  /api/reservations          List / search reservations (paginated)
    POST /api/reservations          Create a reservation
    """

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        status_filter = request.query_params.get("status", "").strip()
        date_filter = request.query_params.get("date", "").strip()
        page = int(request.query_params.get("page", 0))
        size = int(request.query_params.get("size", 20))

        qs = Reservation.objects.order_by("reservation_date")

        if q:
            qs = qs.filter(
                __raw__={
                    "$or": [
                        {"guest_name": {"$regex": re.escape(q), "$options": "i"}},
                        {"guest_email": {"$regex": re.escape(q), "$options": "i"}},
                        {"guest_phone": {"$regex": re.escape(q), "$options": "i"}},
                    ]
                }
            )

        if status_filter:
            qs = qs.filter(status=status_filter)

        if date_filter:
            # Filter by date prefix (YYYY-MM-DD)
            import datetime
            try:
                day = datetime.datetime.strptime(date_filter, "%Y-%m-%d")
                next_day = day.replace(
                    hour=23, minute=59, second=59, microsecond=999999
                )
                qs = qs.filter(
                    reservation_date__gte=day,
                    reservation_date__lte=next_day,
                )
            except ValueError:
                pass

        return Response(page_response(qs, page, size, ReservationSerializer))

    def post(self, request):
        serializer = ReservationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        reservation = serializer.save()
        return Response(ReservationSerializer(reservation).data, status=status.HTTP_201_CREATED)


class ReservationDetailView(APIView):
    """
    GET    /api/reservations/<id>   Retrieve a reservation
    PUT    /api/reservations/<id>   Full update
    DELETE /api/reservations/<id>   Delete
    """

    def _get_reservation(self, pk):
        try:
            return Reservation.objects.get(id=pk)
        except (Reservation.DoesNotExist, Exception):
            return None

    def get(self, request, pk):
        reservation = self._get_reservation(pk)
        if not reservation:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(ReservationSerializer(reservation).data)

    def put(self, request, pk):
        reservation = self._get_reservation(pk)
        if not reservation:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ReservationSerializer(reservation, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        updated = serializer.save()
        return Response(ReservationSerializer(updated).data)

    def delete(self, request, pk):
        reservation = self._get_reservation(pk)
        if not reservation:
            return Response(status=status.HTTP_404_NOT_FOUND)
        reservation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReservationStatusView(APIView):
    """
    PATCH /api/reservations/<id>/status   Update only the status field
    """

    def patch(self, request, pk):
        try:
            reservation = Reservation.objects.get(id=pk)
        except (Reservation.DoesNotExist, Exception):
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ReservationStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        reservation.status = serializer.validated_data["status"]
        reservation.save()
        return Response(ReservationSerializer(reservation).data)
