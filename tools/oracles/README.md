# oracles

Dev-only tools that check what the product writes. Nothing here ships.

## Embroidery

```bash
tools/oracles/setup.sh
tools/oracles/.venv/bin/python -I tools/oracles/embroidery_dump.py fixtures/square.dst
```

Prints JSON: bounds, command counts, thread colours and one `[command, x, y]` row per stitch, in 0.1 mm absolute coordinates. A codec passes when the dump of the file it wrote matches the dump of the source, row for row.

## Floppy image

```bash
tools/oracles/floppy_check.sh path/to/image.img
```

Attaches the image read-only without mounting, checks the filesystem with `fstyp`, mounts it read-only in a temp folder, lists every file with its size, then unmounts and detaches.

## Booting an image under FreeDOS (manual, emulated)

`qemu-system-i386` is at `/opt/homebrew/bin`. Downloads are not automated; get the FreeDOS floppy edition yourself from freedos.org and check its published checksum.

```bash
qemu-system-i386 -m 16 -boot a \
  -drive file=FD-boot.img,if=floppy,index=0,format=raw \
  -drive file=path/to/image.img,if=floppy,index=1,format=raw,readonly=on
```

At the prompt run `DIR B:` and `TYPE B:\README.TXT` (or any text file). Label any footage from this as emulated.
