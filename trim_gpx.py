#!/usr/bin/env python3
"""
trim_gpx.py - Remove a time window from a GPX file and close the gap.

Deletes all trackpoints whose timestamps fall within [start, stop],
then shifts every subsequent trackpoint back by (stop - start) so the
activity appears continuous.

Usage:
    python trim_gpx.py INPUT OUTPUT --start TIME --stop TIME
    python trim_gpx.py ride.gpx ride_trimmed.gpx --start 2024-05-10T10:15:00Z --stop 2024-05-10T10:22:30Z

Times must be ISO 8601 (e.g. 2024-05-10T10:15:00Z or 2024-05-10T10:15:00+00:00).
Pass the same path for INPUT and OUTPUT to edit in place.
"""

import argparse
import sys
from datetime import datetime, timezone, timedelta
import xml.etree.ElementTree as ET


def parse_time(s: str) -> datetime:
    s = s.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def format_time(dt: datetime) -> str:
    # Always emit UTC in the compact Z form
    utc = dt.astimezone(timezone.utc)
    base = utc.strftime("%Y-%m-%dT%H:%M:%S")
    if utc.microsecond:
        base += f".{utc.microsecond // 1000:03d}"
    return base + "Z"


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Remove a time range from a GPX file and close the resulting gap."
    )
    ap.add_argument("input", help="Input GPX file path")
    ap.add_argument("output", help="Output GPX file path (same as input to overwrite)")
    ap.add_argument("--start", required=True, help="Start of range to cut (ISO 8601)")
    ap.add_argument("--stop", required=True, help="End of range to cut (ISO 8601)")
    args = ap.parse_args()

    try:
        t_start = parse_time(args.start)
        t_stop = parse_time(args.stop)
    except ValueError as exc:
        sys.exit(f"Error parsing time: {exc}")

    if t_stop <= t_start:
        sys.exit("Error: --stop must be after --start")

    gap: timedelta = t_stop - t_start

    # --- Parse ---
    try:
        tree = ET.parse(args.input)
    except (OSError, ET.ParseError) as exc:
        sys.exit(f"Error reading {args.input!r}: {exc}")

    root = tree.getroot()

    # Detect and register the GPX namespace so output keeps the default prefix
    ns_uri = ""
    if root.tag.startswith("{"):
        ns_uri = root.tag[1:].split("}")[0]
        ET.register_namespace("", ns_uri)

    def qtag(name: str) -> str:
        return f"{{{ns_uri}}}{name}" if ns_uri else name

    removed = 0
    shifted = 0
    skipped = 0  # trkpts without a parseable time — left untouched

    # --- Process track segments ---
    for trkseg in root.iter(qtag("trkseg")):
        to_remove = []
        for trkpt in trkseg.findall(qtag("trkpt")):
            time_el = trkpt.find(qtag("time"))
            if time_el is None or not time_el.text:
                skipped += 1
                continue
            try:
                t = parse_time(time_el.text)
            except ValueError:
                skipped += 1
                continue

            if t_start <= t <= t_stop:
                to_remove.append(trkpt)
            elif t > t_stop:
                time_el.text = format_time(t - gap)
                shifted += 1

        for pt in to_remove:
            trkseg.remove(pt)
            removed += 1

    # --- Shift metadata time if it falls after the cut window ---
    meta = root.find(qtag("metadata"))
    if meta is not None:
        meta_time = meta.find(qtag("time"))
        if meta_time is not None and meta_time.text:
            try:
                t = parse_time(meta_time.text)
                if t > t_stop:
                    meta_time.text = format_time(t - gap)
            except ValueError:
                pass

    # --- Write ---
    try:
        tree.write(args.output, encoding="unicode", xml_declaration=True)
    except OSError as exc:
        sys.exit(f"Error writing {args.output!r}: {exc}")

    cut_duration = gap
    h, rem = divmod(int(cut_duration.total_seconds()), 3600)
    m, s = divmod(rem, 60)
    print(f"Cut window : {args.start} → {args.stop}  ({h:02d}:{m:02d}:{s:02d})")
    print(f"Removed    : {removed} trackpoint(s)")
    print(f"Shifted    : {shifted} trackpoint(s)")
    if skipped:
        print(f"Skipped    : {skipped} trackpoint(s) with no parseable time (left in place)")
    print(f"Written to : {args.output}")


if __name__ == "__main__":
    main()
