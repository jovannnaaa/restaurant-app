FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --system --no-create-home appuser
USER appuser

EXPOSE 8080

CMD ["gunicorn", "restaurant_backend.config.wsgi:application", \
     "--bind", "0.0.0.0:8080", \
     "--workers", "3", \
     "--timeout", "60", \
     "--access-logfile", "-"]
