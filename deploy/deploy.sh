#!/usr/bin/env bash
#
# Push this project to an EC2 instance that has already been prepared with
# deploy/setup-ec2.sh.
#
# Run it from the project root on your own machine (macOS or Linux):
#
#   ./deploy/deploy.sh -h 54.12.34.56 -i ~/keys/webdev.pem
#
# What it does:
#   1. rsync the source to /opt/todo-app on the server (node_modules, .git and
#      your local data file are left behind).
#   2. Install production dependencies there.
#   3. Restart the systemd service.
#
# Options:
#   -h HOST   public IP or DNS name of the instance   (required)
#   -i KEY    path to your .pem private key           (optional if ssh-agent has it)
#   -u USER   SSH login user (default: ubuntu; use 'ec2-user' for Amazon Linux)
#   -d DIR    remote directory (default: /opt/todo-app)

set -euo pipefail

REMOTE_HOST=""
SSH_KEY=""
REMOTE_USER="ubuntu"
REMOTE_DIR="/opt/todo-app"
SERVICE="todo-app"

# Print the comment block at the top of this file as the help text.
usage() {
    awk 'NR>1 { if (/^#/) { sub(/^# ?/, ""); print } else { exit } }' "$0"
    exit 1
}

# getopts is built into every shell and behaves the same on macOS and Linux.
# (The `getopt` *command* does not -- macOS ships the old BSD version, so avoid it.)
while getopts ":h:i:u:d:" option; do
    case "$option" in
        h) REMOTE_HOST="$OPTARG" ;;
        i) SSH_KEY="$OPTARG" ;;
        u) REMOTE_USER="$OPTARG" ;;
        d) REMOTE_DIR="$OPTARG" ;;
        :) echo "ERROR: -$OPTARG needs a value" >&2; usage ;;
        \?) echo "ERROR: unknown option -$OPTARG" >&2; usage ;;
    esac
done

[ -n "$REMOTE_HOST" ] || { echo "ERROR: -h HOST is required" >&2; usage; }

# Run from the project root no matter where the script was called from.
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

[ -f package.json ] || { echo "ERROR: no package.json in $PROJECT_DIR" >&2; exit 1; }

# Build the ssh options once and reuse them for both ssh and rsync.
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [ -n "$SSH_KEY" ]; then
    [ -f "$SSH_KEY" ] || { echo "ERROR: key file not found: $SSH_KEY" >&2; exit 1; }
    SSH_OPTS+=(-i "$SSH_KEY")
fi

TARGET="${REMOTE_USER}@${REMOTE_HOST}"

echo "==> Running tests before deploying"
npm test

echo "==> Copying files to ${TARGET}:${REMOTE_DIR}"
# --delete removes files on the server that you deleted locally, so the server
# is an exact mirror of your source. The excludes keep local-only things out:
# node_modules is rebuilt on the server, and data/ belongs to the server.
rsync -az --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'data' \
    --exclude '.DS_Store' \
    --exclude '*.log' \
    -e "ssh ${SSH_OPTS[*]}" \
    ./ "${TARGET}:${REMOTE_DIR}/"

echo "==> Installing dependencies and restarting the service"
# 'ssh host command' runs one command remotely and comes straight back.
# npm ci installs exactly what package-lock.json pins; --omit=dev skips the
# test-only packages, which a server does not need.
ssh "${SSH_OPTS[@]}" "$TARGET" "
    set -e
    cd '${REMOTE_DIR}'
    npm ci --omit=dev
    sudo systemctl restart ${SERVICE}
    sleep 2
    sudo systemctl is-active --quiet ${SERVICE} && echo 'service is running'
"

echo "==> Checking the health endpoint"
if curl -fsS --max-time 10 "http://${REMOTE_HOST}/api/health"; then
    printf '\n\n==> Deployed. Open http://%s in your browser.\n' "$REMOTE_HOST"
else
    printf '\n'
    echo "WARNING: the health check did not answer." >&2
    echo "Check the EC2 security group (port 80 inbound) and the logs:" >&2
    echo "  ssh ${SSH_OPTS[*]} $TARGET 'journalctl -u ${SERVICE} -n 50'" >&2
    exit 1
fi
