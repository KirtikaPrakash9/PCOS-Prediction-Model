# PCOS Prediction System

An end-to-end machine learning web application that predicts the risk of **Polycystic Ovary Syndrome (PCOS)** from clinical measurements and lifestyle factors.

![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3%2B-orange)
![Flask](https://img.shields.io/badge/Flask-2.3%2B-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

> **Medical Disclaimer**: This tool is for educational and informational purposes only. It does not constitute medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Dataset](#dataset)
- [Model Performance](#model-performance)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Tech Stack](#tech-stack)

---

## Overview

PCOS is one of the most common hormonal disorders affecting people with ovaries, impacting fertility, metabolism, and long-term health. This system uses a **Gradient Boosting Classifier** trained on clinical and hormonal features to predict PCOS risk with high accuracy.

---

## Features

- **Multi-model training** – evaluates Logistic Regression, Random Forest, and Gradient Boosting; auto-selects the best by ROC-AUC
- **Web interface** – modern, responsive HTML/CSS/JS frontend served via Flask
- **Animated results** – circular probability gauge with colour-coded risk level
- **Personalised recommendations** – actionable guidance based on prediction
- **Auto-computed ratios** – FSH/LH ratio and Waist-Hip Ratio calculated automatically in the form
- **REST API** – `/predict` endpoint for programmatic access
- **Model metadata** – `/model-info` endpoint and version included in prediction responses
- **Training traceability** – `model/metrics.json` and `model/metadata.json` generated on every training run

---

## Project Structure

```
PCOS-Prediction-Model/
├── data/
│   └── pcos_data.csv          # Synthetic dataset (541 rows)
├── model/
│   ├── pcos_model.pkl         # Trained Gradient Boosting model
│   ├── scaler.pkl             # Fitted StandardScaler
│   └── features.pkl           # Ordered feature list
│   ├── metrics.json           # Model comparison metrics and best model
│   └── metadata.json          # Model version, training timestamp, and config
├── app/
│   ├── backend/
│   │   └── app.py             # Flask application
│   └── frontend/
│       ├── index.html         # Main UI
│       ├── style.css          # Styling
│       └── script.js          # Client-side logic
├── train.py                   # Model training script
├── requirements.txt
└── README.md
```

---

## Dataset

The dataset contains **541 synthetic samples** with realistic correlations, generated to mirror the structure of the Kaggle PCOS dataset.

| Feature | Description |
|---|---|
| Age | Patient age (years) |
| BMI | Body Mass Index (kg/m²) |
| Cycle_Length | Menstrual cycle length (days) |
| Follicle_No_L / R | Antral follicle count per ovary |
| Avg_F_size_L / R | Average follicle diameter (mm) |
| TSH | Thyroid-stimulating hormone (mIU/L) |
| AMH | Anti-Müllerian hormone (ng/mL) |
| LH / FSH | Luteinizing / Follicle-stimulating hormone |
| FSH_LH_ratio | FSH ÷ LH |
| Waist, Hip, Waist_Hip_Ratio | Anthropometric measurements |
| Weight_Gain, Hair_Growth, Skin_Darkening, Hair_Loss, Pimples | Binary symptoms |
| Fast_Food, Reg_Exercise | Lifestyle factors |
| **PCOS** | Target variable (0 = No, 1 = Yes) |

PCOS prevalence in the dataset: **~35–43 %**

---

## Model Performance

Three classifiers are evaluated; the best (by ROC-AUC) is saved automatically.

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression | ~0.89 | ~0.91 | ~0.83 | ~0.87 | ~0.92 |
| Random Forest | ~0.74 | ~0.81 | ~0.53 | ~0.64 | ~0.87 |
| **Gradient Boosting** ✅ | ~0.82 | ~0.85 | ~0.70 | ~0.77 | **~0.94** |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/KirtikaPrakash9/PCOS-Prediction-Model.git
cd PCOS-Prediction-Model

# 2. Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Train the model (generates model/ artefacts)
python train.py
```

---

## Usage

### Start the web server

```bash
python app/backend/app.py
# → http://localhost:5000
```

### Production with Gunicorn

```bash
cd app/backend
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

### Retrain the model

```bash
python train.py
```

---

## API Reference

### `POST /predict`

**Request body** (JSON):
```json
{
  "Age": 28, "BMI": 24.5, "Cycle_Length": 32,
  "Follicle_No_L": 10, "Follicle_No_R": 11,
  "Avg_F_size_L": 14.0, "Avg_F_size_R": 13.5,
  "TSH": 2.5, "AMH": 6.2, "LH": 12.0, "FSH": 5.5,
  "FSH_LH_ratio": 0.458, "Waist": 82, "Hip": 96,
  "Waist_Hip_Ratio": 0.854,
  "Weight_Gain": 1, "Hair_Growth": 1, "Skin_Darkening": 0,
  "Hair_Loss": 0, "Pimples": 1, "Fast_Food": 1, "Reg_Exercise": 0
}
```

**Response**:
```json
{
  "prediction": 1,
  "probability": 87.3,
  "risk": "High Risk",
  "model_version": "pcos-risk-20260328T104500Z-a1b2c3d4"
}
```

### `GET /health`
Returns `{\"status\": \"ok\"}`.

### `GET /model-info`
Returns model metadata and feature list.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.9+ |
| ML | scikit-learn (GradientBoostingClassifier) |
| Data | pandas, NumPy |
| Backend | Flask |
| Production server | Gunicorn |
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES2020) |
| Serialisation | joblib |

---

## License

MIT License – see [LICENSE](LICENSE) for details.
