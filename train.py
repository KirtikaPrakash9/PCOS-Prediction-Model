import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'pcos_data.csv')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')


def load_data():
    df = pd.read_csv(DATA_PATH)
    df = df.dropna()
    return df


def evaluate(name, clf, X_test, y_test):
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]
    metrics = {
        'accuracy':  round(accuracy_score(y_test, y_pred), 4),
        'precision': round(precision_score(y_test, y_pred), 4),
        'recall':    round(recall_score(y_test, y_pred), 4),
        'f1':        round(f1_score(y_test, y_pred), 4),
        'roc_auc':   round(roc_auc_score(y_test, y_proba), 4),
    }
    print(f"\n{'='*40}")
    print(f"Model: {name}")
    for k, v in metrics.items():
        print(f"  {k:<12}: {v}")
    return metrics


def main():
    df = load_data()
    feature_cols = [c for c in df.columns if c != 'PCOS']
    X = df[feature_cols].values
    y = df['PCOS'].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc = scaler.transform(X_test)

    candidates = {
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42),
        'RandomForest': RandomForestClassifier(n_estimators=200, random_state=42),
        'GradientBoosting': GradientBoostingClassifier(
            n_estimators=200, random_state=42
        ),
    }

    results = {}
    trained = {}
    for name, clf in candidates.items():
        clf.fit(X_train_sc, y_train)
        trained[name] = clf
        results[name] = evaluate(name, clf, X_test_sc, y_test)

    best_name = max(results, key=lambda n: results[n]['roc_auc'])
    print(f"\n{'='*40}")
    print(f"Best model: {best_name}  (ROC-AUC={results[best_name]['roc_auc']})")

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(trained[best_name], os.path.join(MODEL_DIR, 'pcos_model.pkl'))
    joblib.dump(scaler, os.path.join(MODEL_DIR, 'scaler.pkl'))
    joblib.dump(feature_cols, os.path.join(MODEL_DIR, 'features.pkl'))
    print("Saved: model/pcos_model.pkl, model/scaler.pkl, model/features.pkl")


if __name__ == '__main__':
    main()
