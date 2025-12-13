# FROM python:3.12-slim

# WORKDIR /app

# COPY requirements.txt .
# RUN pip install -r requirements.txt

# COPY . .

# EXPOSE 8501

# CMD ["streamlit", "run", "rag_core.py"]


FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

# MODIFIED STEP: Download NLTK 'punkt' resource inside the image layer
RUN python -c "import nltk; nltk.download('punkt')"

COPY . .

EXPOSE 8501

CMD ["uvicorn", "api_service:app", "--host", "0.0.0.0", "--port", "8501"]