#!/bin/bash
set -euo pipefail

# Config
PROJECT=mrmyhuang
SERVICE=mirroringtwchdatatos3
REGION=asia-east1

# Deploy Cloud Run and expose the secret as an env var `PARAMS_JSON`
gcloud run deploy "$SERVICE" \
		--project "$PROJECT" \
		--region "$REGION" \
		--source . \
		--platform managed \
		--memory=1Gi \
		--allow-unauthenticated
