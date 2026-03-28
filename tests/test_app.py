import pytest

from app.backend.app import app, features


@pytest.fixture
def client():
    app.config.update(TESTING=True)
    with app.test_client() as test_client:
        yield test_client


def _valid_payload():
    data = {}
    for feature in features:
        if feature in {
            "Weight_Gain",
            "Hair_Growth",
            "Skin_Darkening",
            "Hair_Loss",
            "Pimples",
            "Fast_Food",
            "Reg_Exercise",
        }:
            data[feature] = 0
        else:
            data[feature] = 1.0
    return data


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
    assert set(data.keys()) == {"prediction", "probability", "risk"}
    assert data["prediction"] in [0, 1]
    assert isinstance(data["probability"], float)
    assert data["risk"] in ["High Risk", "Low Risk"]
