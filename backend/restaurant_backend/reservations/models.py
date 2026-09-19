import mongoengine as me
from datetime import datetime


class Table(me.Document):
    """A physical table in the restaurant."""
    meta = {
        "collection": "tables",
        "indexes": ["number"],
    }

    number = me.IntField(required=True, unique=True)
    capacity = me.IntField(required=True, min_value=1)
    location = me.StringField(max_length=100)  # e.g. "window", "patio", "bar"
    is_active = me.BooleanField(default=True)
    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)


class Reservation(me.Document):
    """A restaurant reservation."""
    meta = {
        "collection": "reservations",
        "indexes": [
            "guest_name",
            "reservation_date",
            "status",
            ("table", "reservation_date"),
        ],
    }

    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_CANCELLED = "cancelled"
    STATUS_COMPLETED = "completed"
    STATUS_CHOICES = (
        STATUS_PENDING,
        STATUS_CONFIRMED,
        STATUS_CANCELLED,
        STATUS_COMPLETED,
    )

    guest_name = me.StringField(required=True, max_length=200)
    guest_email = me.EmailField(required=True)
    guest_phone = me.StringField(max_length=30)

    table = me.ReferenceField(Table, required=True)
    party_size = me.IntField(required=True, min_value=1)

    reservation_date = me.DateTimeField(required=True)
    duration_minutes = me.IntField(default=90, min_value=15)

    status = me.StringField(
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    special_requests = me.StringField(max_length=1000)
    notes = me.StringField(max_length=1000)  # internal staff notes

    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)
