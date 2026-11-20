# fixtures

Test inputs for the oracles in `tools/oracles/`. Not part of the product.

| File | How it was made |
|---|---|
| `square.dst` | `tools/oracles/.venv/bin/python -I fixtures/make_dst.py` (pyembroidery 1.5.1 `write_dst`): a 10 mm square, one colour change, one 10 mm line. Tajima DST, 0.1 mm units. |
| `square.dst.json` | `tools/oracles/.venv/bin/python -I tools/oracles/embroidery_dump.py fixtures/square.dst > fixtures/square.dst.json`. The expected dump. DST stores no thread colours, so `threads` is empty. |

A FAT12 floppy fixture is not here yet. To make one by hand on macOS:

```bash
dd if=/dev/zero of=fixtures/blank-1440k.img bs=512 count=2880
newfs_msdos -F 12 -f 1440 -v KIROWEEN ./fixtures/blank-1440k.img
hdiutil attach -imagekey diskimage-class=CRawDiskImage fixtures/blank-1440k.img   # mounts /Volumes/KIROWEEN
cp fixtures/square.dst /Volumes/KIROWEEN/SQUARE.DST && hdiutil detach /Volumes/KIROWEEN
tools/oracles/floppy_check.sh fixtures/blank-1440k.img
```
