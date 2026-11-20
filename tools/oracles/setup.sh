#!/usr/bin/env bash
# Dev-only: creates tools/oracles/.venv with pyembroidery (MIT) for test oracles.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
python3 -m venv "$here/.venv"
"$here/.venv/bin/pip" install --quiet --upgrade pip
"$here/.venv/bin/pip" install --quiet "pyembroidery==1.5.1"
echo "ok: $here/.venv/bin/python $here/embroidery_dump.py <file>"
