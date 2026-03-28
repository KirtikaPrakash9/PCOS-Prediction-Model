import os

import joblib

import train


def test_load_data_has_target_and_rows():
    df = train.load_data()
    assert not df.empty
    assert "PCOS" in df.columns


def test_training_main_generates_model_artifacts(tmp_path, monkeypatch):
    monkeypatch.setattr(train, "MODEL_DIR", str(tmp_path))

    train.main()

    model_path = os.path.join(tmp_path, "pcos_model.pkl")
    scaler_path = os.path.join(tmp_path, "scaler.pkl")
    features_path = os.path.join(tmp_path, "features.pkl")

    assert os.path.exists(model_path)
    assert os.path.exists(scaler_path)
    assert os.path.exists(features_path)

    features = joblib.load(features_path)
    assert isinstance(features, list)
    assert len(features) > 0
