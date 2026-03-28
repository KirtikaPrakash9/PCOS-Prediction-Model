# API Documentation

## Base URL
- Local development: `http://localhost:5000`

## Endpoints

### `GET /health`
Returns service health.

**Response**
```json
{"status": "ok"}
```

### `POST /predict`
Runs PCOS risk prediction.

**Request JSON**
Include all model features from `model/features.pkl` as numeric values.

**Response JSON**
```json
{
  "prediction": 1,
  "probability": 87.3,
  "risk": "High Risk",
  "model_version": "pcos-risk-20260328T104500Z-a1b2c3d4"
}
```

### `GET /model-info`
Returns model metadata and feature definitions.

**Response JSON**
```json
{
  "model_name": "GradientBoosting",
  "model_version": "pcos-risk-20260328T104500Z-a1b2c3d4",
  "trained_at_utc": "2026-03-28T10:45:00+00:00",
  "feature_count": 22,
  "features": ["Age", "BMI", "..."]
}
```

## Error Responses
- `400` for missing JSON payload
- `400` for missing required fields
- `400` for invalid field values
- Invalid field values include:
  - non-numeric or non-finite values
  - binary fields not in `{0,1}`
  - values outside accepted clinical ranges
