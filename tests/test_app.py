import pytest

from app.backend.app import app, features


@pytest.fixture
def client():
    app.config.update(TESTING=True)
    with app.test_client() as test_client:
        yield test_client


def _valid_payload():
    defaults = {
        "Age": 28,
        "BMI": 24.5,
        "Cycle_Length": 30,
        "Follicle_No_L": 8,
        "Follicle_No_R": 9,
        "Avg_F_size_L": 14.0,
        "Avg_F_size_R": 13.5,
        "TSH": 2.5,
        "AMH": 4.2,
        "LH": 8.0,
        "FSH": 6.5,
        "FSH_LH_ratio": 0.8125,
        "Waist": 80,
        "Hip": 95,
        "Waist_Hip_Ratio": 0.8421,
        "Weight_Gain": 0,
        "Hair_Growth": 0,
        "Skin_Darkening": 0,
        "Hair_Loss": 0,
        "Pimples": 0,
        "Fast_Food": 0,
        "Reg_Exercise": 1,
    }
    return {feature: defaults[feature] for feature in features}


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_predict_requires_json_payload(client):
    response = client.post("/predict", json={})
    assert response.status_code == 400
    assert "No JSON payload received" in response.get_json()["error"]


def test_predict_missing_required_fields(client):
    payload = _valid_payload()
    payload.pop(features[0])

    response = client.post("/predict", json=payload)
    assert response.status_code == 400
    assert "Missing required fields" in response.get_json()["error"]


def test_predict_success(client):
    response = client.post("/predict", json=_valid_payload())
    assert response.status_code == 200

    data = response.get_json()
    assert set(data.keys()) == {"prediction", "probability", "risk", "model_version"}
    assert data["prediction"] in [0, 1]
    assert isinstance(data["probability"], float)
    assert data["risk"] in ["High Risk", "Low Risk"]
    assert isinstance(data["model_version"], str)


def test_predict_rejects_non_binary_binary_field(client):
    payload = _valid_payload()
    payload["Weight_Gain"] = 2

    response = client.post("/predict", json=payload)
    assert response.status_code == 400
    assert "must be 0 or 1" in response.get_json()["error"]


def test_predict_rejects_out_of_range_field(client):
    payload = _valid_payload()
    payload["Age"] = 500

    response = client.post("/predict", json=payload)
    assert response.status_code == 400
    assert "must be between" in response.get_json()["error"]


def test_model_info_endpoint(client):
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.get_json()

    assert "model_name" in data
    assert "model_version" in data
    assert "feature_count" in data
    assert "features" in data
    assert isinstance(data["feature_count"], int)
    assert isinstance(data["features"], list)
