# Deployment Guide

## Prerequisites
- Python 3.9+
- Installed dependencies from `requirements.txt`
- Trained model artifacts in `/model`

## Local Run
```bash
python app/backend/app.py
```

## Production (Gunicorn)
```bash
cd app/backend
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

## Recommended Checks Before Deploy
```bash
flake8 .
pytest
```
