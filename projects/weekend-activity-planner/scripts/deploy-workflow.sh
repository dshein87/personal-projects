#!/bin/bash

# Deploy n8n Workflow: Weekly Activity Suggestions
# This script updates the existing workflow via n8n REST API

set -e  # Exit on error

PROJECT_ROOT="/Users/dshein/Personal Projects/projects/weekend-activity-planner"
cd "$PROJECT_ROOT"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=================================================="
echo "n8n Workflow Deployment: Weekly Activity Suggestions"
echo "=================================================="
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found${NC}"
    echo "Create .env file with:"
    echo "  N8N_API_KEY=your_api_key"
    echo "  N8N_HOST=https://dshein.app.n8n.cloud"
    exit 1
fi

source .env

# Validate required environment variables
if [ -z "$N8N_API_KEY" ]; then
    echo -e "${RED}ERROR: N8N_API_KEY not set in .env${NC}"
    exit 1
fi

if [ -z "$N8N_HOST" ]; then
    echo -e "${RED}ERROR: N8N_HOST not set in .env${NC}"
    exit 1
fi

# Workflow ID (existing workflow)
WORKFLOW_ID="wRRp1fTwNzOHr9rY"

# Check if payload file exists
PAYLOAD_FILE="building/workflow-payload.json"
if [ ! -f "$PAYLOAD_FILE" ]; then
    echo -e "${RED}ERROR: Workflow payload not found: $PAYLOAD_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Configuration:${NC}"
echo "  n8n Host: $N8N_HOST"
echo "  Workflow ID: $WORKFLOW_ID"
echo "  Payload: $PAYLOAD_FILE"
echo ""

# Validate JSON syntax
echo -e "${YELLOW}Validating JSON syntax...${NC}"
if ! python3 -m json.tool "$PAYLOAD_FILE" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Invalid JSON in $PAYLOAD_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ JSON is valid${NC}"
echo ""

# Count nodes in payload
NODE_COUNT=$(python3 -c "import json; data=json.load(open('$PAYLOAD_FILE')); print(len(data['nodes']))")
echo -e "${YELLOW}Workflow contains $NODE_COUNT nodes${NC}"
echo ""

# Backup existing workflow
echo -e "${YELLOW}Backing up existing workflow...${NC}"
BACKUP_DIR="building/workflow-backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/workflow-$(date +%Y%m%d-%H%M%S).json"

curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    "${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}" \
    -o "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup saved: $BACKUP_FILE${NC}"
else
    echo -e "${RED}WARNING: Could not backup workflow${NC}"
fi
echo ""

# Deploy workflow
echo -e "${YELLOW}Deploying workflow to n8n...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X PUT "${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"$PAYLOAD_FILE")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo ""
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Workflow deployed successfully!${NC}"
    echo ""

    # Parse and display workflow details
    echo -e "${YELLOW}Workflow Details:${NC}"
    echo "$BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f\"  Name: {data.get('name', 'N/A')}\")
    print(f\"  ID: {data.get('id', 'N/A')}\")
    print(f\"  Active: {data.get('active', False)}\")
    print(f\"  Nodes: {len(data.get('nodes', []))}\")
    print(f\"  Updated: {data.get('updatedAt', 'N/A')}\")
except:
    print('  Could not parse response')
"
    echo ""
    echo -e "${GREEN}✓ Deployment complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Open workflow: ${N8N_HOST}/workflow/${WORKFLOW_ID}"
    echo "  2. Test with Manual Trigger (replace Schedule Trigger temporarily)"
    echo "  3. Verify each node's output"
    echo "  4. Activate workflow when ready"

elif [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${RED}✗ Deployment failed: Bad Request (400)${NC}"
    echo ""
    echo "Error details:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    echo "Common causes:"
    echo "  - Invalid node type"
    echo "  - Missing required parameters"
    echo "  - Malformed JSON"
    exit 1

elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}✗ Deployment failed: Unauthorized (401)${NC}"
    echo ""
    echo "Check your N8N_API_KEY in .env"
    exit 1

elif [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${RED}✗ Deployment failed: Workflow not found (404)${NC}"
    echo ""
    echo "Workflow ID $WORKFLOW_ID does not exist"
    echo "Create it first or update WORKFLOW_ID in this script"
    exit 1

else
    echo -e "${RED}✗ Deployment failed: HTTP $HTTP_CODE${NC}"
    echo ""
    echo "Response:"
    echo "$BODY"
    exit 1
fi

echo ""
echo "=================================================="
