FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app/data
RUN python - <<'PY'
from pathlib import Path
from urllib.request import urlretrieve

target = Path("/app/data/hygdata_v42.csv.gz")
url = "https://astronexus.com/downloads/catalogs/hygdata_v42.csv.gz"
urlretrieve(url, target)
print(f"Downloaded {target}")
PY

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
