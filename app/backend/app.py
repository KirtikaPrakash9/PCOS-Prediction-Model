from flask import Flask, request, jsonify, send_from_directory
import joblib
import numpy as np
import os
import json

app = Flask(__name__, static_folder='../frontend', static_url_path='')

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, '..', '..', 'model')

model = joblib.load(os.path.join(MODEL_DIR, 'pcos_model.pkl'))
scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
features = joblib.load(os.path.join(MODEL_DIR, 'features.pkl'))
METADATA_PATH = os.path.join(MODEL_DIR, 'metadata.json')
metadata = {}
if os.path.exists(METADATA_PATH):
    with open(METADATA_PATH, 'r', encoding='utf-8') as metadata_file:
        metadata = json.load(metadata_file)

BINARY_FEATURES = {
    'Weight_Gain',
    'Hair_Growth',
    'Skin_Darkening',
    'Hair_Loss',
    'Pimples',
    'Fast_Food',
    'Reg_Exercise',
}

RANGE_BOUNDS = {
    'Age': (10, 70),
    'BMI': (10, 70),
    'Cycle_Length': (15, 120),
    'Follicle_No_L': (0, 50),
    'Follicle_No_R': (0, 50),
    'Avg_F_size_L': (0, 50),
    'Avg_F_size_R': (0, 50),
    'TSH': (0, 30),
    'AMH': (0, 40),
    'LH': (0, 80),
    'FSH': (0, 80),
    'FSH_LH_ratio': (0, 50),
    'Waist': (30, 200),
    'Hip': (30, 220),
    'Waist_Hip_Ratio': (0, 5),
}


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'No JSON payload received'}), 400

    missing = [f for f in features if f not in data]
    if missing:
        return jsonify({'error': f'Missing required fields: {missing}'}), 400

    try:
        parsed_values = {}
        for feature in features:
            value = float(data[feature])
            if not np.isfinite(value):
                raise ValueError(f'{feature} must be a finite number')

            if feature in BINARY_FEATURES and value not in {0.0, 1.0}:
                raise ValueError(f'{feature} must be 0 or 1')

            bounds = RANGE_BOUNDS.get(feature)
            if bounds is not None and not (bounds[0] <= value <= bounds[1]):
                raise ValueError(
                    f'{feature} must be between {bounds[0]} and {bounds[1]}'
                )

            parsed_values[feature] = value

        input_values = [parsed_values[f] for f in features]
    except (TypeError, ValueError) as exc:
        return jsonify({'error': f'Invalid value in request: {exc}'}), 400
    input_array = np.array(input_values).reshape(1, -1)
    input_scaled = scaler.transform(input_array)

    prediction = int(model.predict(input_scaled)[0])
    proba = float(model.predict_proba(input_scaled)[0][1])

    return jsonify({
        'prediction': prediction,
        'probability': round(proba * 100, 1),
        'risk': 'High Risk' if prediction == 1 else 'Low Risk',
        'model_version': metadata.get('model_version', 'unknown'),
    })


@app.route('/health')
def health():
    return jsonify({'status': 'ok'})


@app.route('/model-info')
def model_info():
    return jsonify(
        {
            'model_name': metadata.get('model_name', type(model).__name__),
            'model_version': metadata.get('model_version', 'unknown'),
            'trained_at_utc': metadata.get('trained_at_utc'),
            'feature_count': len(features),
            'features': features,
        }
    )


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
