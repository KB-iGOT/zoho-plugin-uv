FROM python:3.10-slim

# Copy requirements first for better caching
COPY requirements.txt /app/requirements.txt

# Set working directory
WORKDIR /app

# Install dependencies with exact versions
RUN pip install -r requirements.txt

# Copy application
COPY . /app

# Run the application
CMD ["/app/.venv/bin/fastapi", "run", "src/main.py", "--port", "8000", "--host", "0.0.0.0"]