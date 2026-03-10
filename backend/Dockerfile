FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY backend /app/backend
COPY data /app/data

# Environment variables
ENV PYTHONUNBUFFERED=1

CMD ["python", "-m", "backend.main"]
