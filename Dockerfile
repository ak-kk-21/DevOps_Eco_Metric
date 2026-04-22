FROM python:3.11-slim

WORKDIR /app

# install system deps (important for numpy, scipy, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# install poetry
RUN pip install --upgrade pip && \
    pip install --default-timeout=100 --retries=10 --no-cache-dir poetry==1.8.3

# copy dependency files first (for caching)
COPY pyproject.toml poetry.lock* ./

# install ONLY production dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-interaction --no-ansi --no-root

# copy app
COPY app ./app

# default port
ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]