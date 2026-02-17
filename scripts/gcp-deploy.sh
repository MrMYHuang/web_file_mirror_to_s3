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
	--memory=1500Mi \
	--cpu=1 \
	--concurrency=80 \
	--timeout=300s \
	--max-instances=20 \
	--service-account=mrmyhuang@appspot.gserviceaccount.com \
	--annotations=run.googleapis.com/startup-cpu-boost=true,run.googleapis.com/build-enable-automatic-updates=false