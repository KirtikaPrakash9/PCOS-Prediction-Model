from flask import Flask, request, jsonify, send_from_directory
import joblib
import numpy as np
import os

app = Flask(__name__, static_folder='../frontend', static_url_path='')

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, '..', '..', 'model')

model = joblib.load(os.path.join(MODEL_DIR, 'pcos_model.pkl'))
scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
features = joblib.load(os.path.join(MODEL_DIR, 'features.pkl'))


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON payload received'}), 400

    missing = [f for f in features if f not in data]
    if missing:
        return jsonify({'error': f'Missing required fields: {missing}'}), 400

    try:
        input_values = [float(data[f]) for f in features]
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
    })


@app.route('/health')
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
