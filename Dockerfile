# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install Poetry
RUN pip install --no-cache-dir poetry==1.8.3

# Copy dependency files first (layer cache: only re-runs if these change)
COPY pyproject.toml poetry.lock* ./

# Install production dependencies only (no dev tools in the final image)
RUN poetry config virtualenvs.in-project true \
    && poetry install --only main --no-interaction --no-ansi

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Copy the virtual environment built in stage 1
COPY --from=builder /app/.venv /app/.venv

# Copy application source
COPY app/ ./app/

# Activate the venv by prepending it to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Render / Cloud Run inject PORT at runtime; default to 8000 locally
ENV PORT=8000

EXPOSE ${PORT}

# Run with uvicorn; --host 0.0.0.0 is required inside a container
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
