#!/usr/bin/env bash
# Dev-only oracle: attach a FAT12 floppy image read-only on macOS, list its files, detach.
# Usage: tools/oracles/floppy_check.sh <image.img>
set -euo pipefail
img="${1:?usage: floppy_check.sh <image.img>}"
size=$(stat -f %z "$img")
echo "image: $img ($size bytes)"
case "$size" in
  368640|737280|1228800|1474560|2949120) ;;
  *) echo "warn: size is not a standard floppy size" ;;
esac
mnt="$(mktemp -d)"
dev=$(hdiutil attach -readonly -nomount -imagekey diskimage-class=CRawDiskImage "$img" | awk 'NR==1{print $1}')
cleanup() { umount "$mnt" 2>/dev/null || true; hdiutil detach "$dev" -quiet || true; rmdir "$mnt"; }
trap cleanup EXIT
echo "device: $dev"
fstyp "$dev" || { echo "fail: not a FAT filesystem"; exit 1; }
mount -t msdos -o rdonly "$dev" "$mnt"
echo "files:"
(cd "$mnt" && find . -type f ! -name '._*' -exec ls -l {} \; | awk '{printf "  %8s  %s\n", $5, substr($0, index($0,$9))}')
echo "ok"
