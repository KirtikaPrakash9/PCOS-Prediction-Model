# Contributing

## Setup
1. Create and activate a virtual environment.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Train or refresh model artifacts when needed:
   - `python train.py`

## Validation Before PR
- Run linting: `flake8 .`
- Run tests: `pytest`

## Code Guidelines
- Keep changes small and focused.
- Avoid unrelated refactors in the same PR.
- Maintain API compatibility for `/predict` and `/health`.
