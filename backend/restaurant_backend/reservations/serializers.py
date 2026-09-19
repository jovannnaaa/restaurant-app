from rest_framework import serializers
from .models import Table, Reservation


def _document_to_dict(doc, include_table=False):
    if doc is None:
        return None
    d = {
        "id": str(doc.id),
        "created_at": doc.created_at.isoformat() + "Z" if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() + "Z" if doc.updated_at else None,
    }
    return d


class TableSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    number = serializers.IntegerField(min_value=1)
    capacity = serializers.IntegerField(min_value=1)
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    is_active = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def validate_number(self, value):
        instance = self.instance
        qs = Table.objects(number=value)
        if instance:
            qs = qs.filter(id__ne=instance.id)
        if qs.count() > 0:
            raise serializers.ValidationError("A table with this number already exists.")
        return value

    def create(self, validated_data):
        table = Table(**validated_data)
        table.save()
        return table

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        if isinstance(instance, dict):
            return instance
        return {
            "id": str(instance.id),
            "number": instance.number,
            "capacity": instance.capacity,
            "location": instance.location,
            "is_active": instance.is_active,
            "created_at": instance.created_at.isoformat() + "Z" if instance.created_at else None,
            "updated_at": instance.updated_at.isoformat() + "Z" if instance.updated_at else None,
        }


class ReservationSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    guest_name = serializers.CharField(max_length=200)
    guest_email = serializers.EmailField()
    guest_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=30)
    table_id = serializers.CharField(write_only=True)
    table = serializers.SerializerMethodField(read_only=True)
    party_size = serializers.IntegerField(min_value=1)
    reservation_date = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField(default=90, min_value=15)
    status = serializers.ChoiceField(
        choices=Reservation.STATUS_CHOICES,
        default=Reservation.STATUS_PENDING,
    )
    special_requests = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=1000
    )
    notes = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=1000
    )
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_table(self, obj):
        if isinstance(obj, dict):
            return obj.get("table")
        try:
            t = obj.table
            if t:
                return TableSerializer(t).data
        except Exception:
            pass
        return None

    def validate_table_id(self, value):
        try:
            table = Table.objects.get(id=value)
        except (Table.DoesNotExist, Exception):
            raise serializers.ValidationError("Table not found.")
        if not table.is_active:
            raise serializers.ValidationError("Table is not active.")
        return value

    def validate(self, data):
        table_id = data.get("table_id")
        party_size = data.get("party_size")
        if table_id and party_size:
            try:
                table = Table.objects.get(id=table_id)
                if party_size > table.capacity:
                    raise serializers.ValidationError(
                        {"party_size": f"Party size exceeds table capacity ({table.capacity})."}
                    )
            except Table.DoesNotExist:
                pass
        return data

    def create(self, validated_data):
        table_id = validated_data.pop("table_id")
        table = Table.objects.get(id=table_id)
        reservation = Reservation(table=table, **validated_data)
        reservation.save()
        return reservation

    def update(self, instance, validated_data):
        table_id = validated_data.pop("table_id", None)
        if table_id:
            table = Table.objects.get(id=table_id)
            instance.table = table
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        if isinstance(instance, dict):
            return instance
        try:
            table_data = TableSerializer(instance.table).data if instance.table else None
        except Exception:
            table_data = None

        return {
            "id": str(instance.id),
            "guest_name": instance.guest_name,
            "guest_email": instance.guest_email,
            "guest_phone": instance.guest_phone,
            "table": table_data,
            "party_size": instance.party_size,
            "reservation_date": instance.reservation_date.isoformat() + "Z" if instance.reservation_date else None,
            "duration_minutes": instance.duration_minutes,
            "status": instance.status,
            "special_requests": instance.special_requests,
            "notes": instance.notes,
            "created_at": instance.created_at.isoformat() + "Z" if instance.created_at else None,
            "updated_at": instance.updated_at.isoformat() + "Z" if instance.updated_at else None,
        }


class ReservationStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Reservation.STATUS_CHOICES)
