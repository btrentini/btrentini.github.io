#!/usr/bin/env python3
"""Generate the website timing-distribution audit figure.

The main tables intentionally omit inference-time metrics. This figure keeps
runtime visible as a cost audit, using the local tarchic styling stack.
"""

from __future__ import annotations

import csv
import math
import os
import sys
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp/neurips-final-tarchic-mpl")

ROOT = Path(__file__).resolve().parents[2]
TARCHIC_SRC = Path.home() / "Documents" / "code" / "tarchic" / "src"
if TARCHIC_SRC.exists():
    sys.path.insert(0, str(TARCHIC_SRC))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Patch

import tarchic as tx
from tarchic.style import apply_camera_ready_style
from tarchic.theme import load_theme


EDM_CSV = ROOT / "website" / "data" / "run40_edm_all_metrics.csv"
ALPHA_CSV = ROOT / "website" / "data" / "run41_alphaflow_all_metrics.csv"
RELATIVE_OUTPUT = Path("generated") / "inference_time_distributions_by_nfe_sampler_size"
OUTPUT_ROOTS = [ROOT / "tarchic-charts", ROOT / "website" / "tarchic-charts"]
NFE_ORDER = [5, 10, 25]
SIZE_ORDER = ["Short", "Medium", "Large"]
SAMPLER_LABELS = {"ode_heun": "ODE", "sde_heun": "SDE"}


def number(value: object) -> float | None:
    try:
        out = float(str(value).strip())
    except (TypeError, ValueError):
        return None
    return out if math.isfinite(out) else None


def read_edm_rows() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    with EDM_CSV.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            if row.get("entropy_mode") == "conditional_minus_marginal":
                continue
            nfe = number(row.get("n_steps"))
            seconds = number(row.get("infer_seconds"))
            sampler = row.get("mode")
            if nfe not in NFE_ORDER or seconds is None or sampler not in SAMPLER_LABELS:
                continue
            rows.append(
                {
                    "nfe": int(nfe),
                    "sampler": SAMPLER_LABELS[sampler],
                    "seconds": seconds,
                }
            )
    return rows


def read_alpha_rows() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    with ALPHA_CSV.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            nfe = number(row.get("n_steps"))
            seconds = number(row.get("infer_seconds_per_output"))
            size = row.get("size_group")
            scheduler = row.get("scheduler")
            if nfe not in NFE_ORDER or seconds is None or size not in SIZE_ORDER:
                continue
            if scheduler == "entropic_log1p":
                continue
            rows.append(
                {
                    "nfe": int(nfe),
                    "size": size,
                    "seconds": seconds,
                }
            )
    return rows


def grouped_values(rows: list[dict[str, object]], key: str, group: str, nfe: int) -> np.ndarray:
    values = [float(row["seconds"]) for row in rows if row.get(key) == group and row.get("nfe") == nfe]
    return np.asarray(values, dtype=float)


def draw_grouped_boxplot(
    ax,
    rows: list[dict[str, object]],
    *,
    group_key: str,
    groups: list[str],
    colors: list[str],
    ylabel: str,
    log_y: bool = False,
) -> None:
    centers = np.arange(1, len(NFE_ORDER) + 1, dtype=float)
    width = min(0.22, 0.74 / max(len(groups), 1))
    offsets = np.linspace(-0.28, 0.28, len(groups)) if len(groups) > 1 else np.array([0.0])
    rng = np.random.default_rng(17)

    for group_index, group in enumerate(groups):
        arrays = [grouped_values(rows, group_key, group, nfe) for nfe in NFE_ORDER]
        positions = centers + offsets[group_index]
        box = ax.boxplot(
            arrays,
            positions=positions,
            widths=width,
            showfliers=False,
            patch_artist=True,
            manage_ticks=False,
        )
        for patch in box["boxes"]:
            patch.set_facecolor(colors[group_index])
            patch.set_alpha(0.58)
            patch.set_edgecolor("#202124")
            patch.set_linewidth(0.8)
        for key in ("medians", "whiskers", "caps"):
            for artist in box[key]:
                artist.set_color("#202124")
                artist.set_linewidth(0.75)

        for x, values in zip(positions, arrays):
            if not len(values):
                continue
            if len(values) > 160:
                values = rng.choice(values, size=160, replace=False)
            jitter = rng.normal(0.0, width * 0.16, size=len(values))
            ax.scatter(
                np.full(len(values), x) + jitter,
                values,
                s=6,
                color=colors[group_index],
                alpha=0.22,
                linewidth=0,
                rasterized=True,
            )

    ax.set_xticks(centers)
    ax.set_xticklabels([str(nfe) for nfe in NFE_ORDER])
    ax.set_xlabel("NFE")
    ax.set_ylabel(ylabel)
    ax.set_xlim(0.5, len(NFE_ORDER) + 0.5)
    if log_y:
        ax.set_yscale("log")
    ax.margins(x=0.04)


def main() -> None:
    edm_rows = read_edm_rows()
    alpha_rows = read_alpha_rows()
    if not edm_rows or not alpha_rows:
        raise RuntimeError("Missing timing rows for EDM or AlphaFlow.")

    theme = load_theme(None)
    figure_width, _ = tx.figure_size("neurips26", width="full", aspect=0.78)
    fig, axes = plt.subplots(1, 2, figsize=(figure_width, 3.2), constrained_layout=False)
    fig.patch.set_facecolor(theme.background)

    sampler_colors = [theme.categorical[2], theme.categorical[5]]
    size_colors = [theme.categorical[0], theme.categorical[10], theme.categorical[11]]

    draw_grouped_boxplot(
        axes[0],
        edm_rows,
        group_key="sampler",
        groups=["ODE", "SDE"],
        colors=sampler_colors,
        ylabel="EDM seconds / 64 images",
    )
    draw_grouped_boxplot(
        axes[1],
        alpha_rows,
        group_key="size",
        groups=SIZE_ORDER,
        colors=size_colors,
        ylabel="AlphaFlow seconds / output",
        log_y=True,
    )

    for ax in axes:
        apply_camera_ready_style(ax, theme=theme, venue="neurips26", title=False, legend=False)

    handles = [
        Patch(facecolor=sampler_colors[0], edgecolor="#202124", alpha=0.58, label="EDM ODE"),
        Patch(facecolor=sampler_colors[1], edgecolor="#202124", alpha=0.58, label="EDM SDE"),
        Patch(facecolor=size_colors[0], edgecolor="#202124", alpha=0.58, label="AlphaFlow short"),
        Patch(facecolor=size_colors[1], edgecolor="#202124", alpha=0.58, label="AlphaFlow medium"),
        Patch(facecolor=size_colors[2], edgecolor="#202124", alpha=0.58, label="AlphaFlow large"),
    ]
    fig.legend(
        handles=handles,
        loc="lower center",
        bbox_to_anchor=(0.5, -0.01),
        ncol=5,
        frameon=False,
        fontsize=7.4,
    )
    fig.subplots_adjust(left=0.095, right=0.985, top=0.985, bottom=0.26, wspace=0.30)

    note = (
        "Timing audit. EDM excludes conditional-minus-marginal ablation rows; "
        "AlphaFlow excludes log1p supplemental variants. Boxes pool scheduler variants, "
        "seeds, datasets, and proteins within the displayed NFE/sampler/size stratum."
    )
    for output_root in OUTPUT_ROOTS:
        output_root.mkdir(parents=True, exist_ok=True)
        output_base = output_root / RELATIVE_OUTPUT
        output_base.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(output_base.with_suffix(".pdf"), dpi=600, bbox_inches="tight")
        fig.savefig(output_base.with_suffix(".png"), dpi=300, bbox_inches="tight")
        output_base.with_suffix(".txt").write_text(note + "\n", encoding="utf-8")

    print(f"Wrote {RELATIVE_OUTPUT.with_suffix('.pdf')}")


if __name__ == "__main__":
    main()
