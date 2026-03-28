import os
import json

import joblib

import train


def test_load_data_has_target_and_rows():
    df = train.load_data()
    assert not df.empty
    assert "PCOS" in df.columns


def test_training_main_generates_model_artifacts(tmp_path, monkeypatch):
    monkeypatch.setattr(train, "MODEL_DIR", str(tmp_path))
    monkeypatch.setattr(
        train, "METRICS_PATH", os.path.join(str(tmp_path), "metrics.json")
    )
    monkeypatch.setattr(
        train, "METADATA_PATH", os.path.join(str(tmp_path), "metadata.json")
    )

    train.main()

    model_path = os.path.join(tmp_path, "pcos_model.pkl")
    scaler_path = os.path.join(tmp_path, "scaler.pkl")
    features_path = os.path.join(tmp_path, "features.pkl")
    metrics_path = os.path.join(tmp_path, "metrics.json")
    metadata_path = os.path.join(tmp_path, "metadata.json")

    assert os.path.exists(model_path)
    assert os.path.exists(scaler_path)
    assert os.path.exists(features_path)
    assert os.path.exists(metrics_path)
    assert os.path.exists(metadata_path)

    features = joblib.load(features_path)
    assert isinstance(features, list)
    assert len(features) > 0

    with open(metrics_path, "r", encoding="utf-8") as metrics_file:
        metrics = json.load(metrics_file)
    assert "best_model" in metrics
    assert "best_metrics" in metrics
    assert "all_results" in metrics
    assert "roc_auc" in metrics["best_metrics"]

    with open(metadata_path, "r", encoding="utf-8") as metadata_file:
        metadata = json.load(metadata_file)
    assert "model_version" in metadata
    assert "trained_at_utc" in metadata
    assert metadata["feature_count"] == len(features)
