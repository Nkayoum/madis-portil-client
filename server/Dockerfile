# pull official base image
FROM python:3.11-slim

# set working directory
WORKDIR /app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# create the app user
RUN addgroup --system appgroup && adduser --system --group appuser

# install python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt
RUN pip install gunicorn

# copy project
COPY . /app/

# create media and static directories and set ownership
RUN mkdir -p /app/media /app/staticfiles && \
    chown -R appuser:appgroup /app

# change to the app user
USER appuser

# Expose port
EXPOSE 8000

# Run entrypoint or gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "madis_portal.wsgi:application"]
