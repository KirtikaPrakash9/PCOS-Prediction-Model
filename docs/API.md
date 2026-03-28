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
  "risk": "High Risk"
}
```

## Error Responses
- `400` for missing JSON payload
- `400` for missing required fields
- `400` for invalid field values
