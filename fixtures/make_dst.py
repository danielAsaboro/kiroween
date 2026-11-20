"""Writes fixtures/square.dst with pyembroidery: a 10 mm square, a colour change, one line.

Run: tools/oracles/.venv/bin/python -I fixtures/make_dst.py
"""
import os

import pyembroidery as pe

p = pe.EmbPattern()
p.add_thread(pe.EmbThread("#ff0000"))
p.add_thread(pe.EmbThread("#0000ff"))
for x, y in [(0, 0), (100, 0), (100, 100), (0, 100), (0, 0)]:
    p.add_stitch_absolute(pe.STITCH, x, y)
p.add_command(pe.COLOR_CHANGE)
for x, y in [(50, 50), (150, 50)]:
    p.add_stitch_absolute(pe.STITCH, x, y)
p.add_command(pe.END)
pe.write_dst(p, os.path.join(os.path.dirname(os.path.abspath(__file__)), "square.dst"))
