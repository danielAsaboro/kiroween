#!/usr/bin/env python3
"""Dev-only oracle: print a normalized JSON view of any embroidery file pyembroidery can read.

Usage: tools/oracles/.venv/bin/python tools/oracles/embroidery_dump.py <file>
"""
import json
import sys

import pyembroidery as pe

NAMES = {
    pe.STITCH: "stitch",
    pe.JUMP: "jump",
    pe.TRIM: "trim",
    pe.STOP: "stop",
    pe.END: "end",
    pe.COLOR_CHANGE: "color_change",
    pe.NEEDLE_SET: "needle_set",
    pe.SEQUIN_MODE: "sequin_mode",
    pe.SEQUIN_EJECT: "sequin_eject",
}


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    pattern = pe.read(sys.argv[1])
    if pattern is None:
        print(f"unreadable: {sys.argv[1]}", file=sys.stderr)
        return 1
    stitches = []
    for x, y, data in pattern.stitches:
        cmd = data & pe.COMMAND_MASK
        stitches.append([NAMES.get(cmd, f"cmd_{cmd}"), int(round(x)), int(round(y))])
    counts = {}
    for name, _, _ in stitches:
        counts[name] = counts.get(name, 0) + 1
    min_x, min_y, max_x, max_y = pattern.bounds() if stitches else (0, 0, 0, 0)
    out = {
        "file": sys.argv[1],
        "units": "0.1mm",
        "bounds": [int(min_x), int(min_y), int(max_x), int(max_y)],
        "counts": counts,
        "threads": [t.hex_color() for t in pattern.threadlist],
        "stitches": stitches,
    }
    # One stitch per line keeps diffs between two dumps readable.
    body = json.dumps({k: v for k, v in out.items() if k != "stitches"}, indent=1)[:-2]
    rows = ",\n  ".join(json.dumps(s) for s in stitches)
    print(f'{body},\n "stitches": [\n  {rows}\n ]\n}}')
    return 0


if __name__ == "__main__":
    sys.exit(main())
