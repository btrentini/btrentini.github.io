#!/usr/bin/env python3
"""Non-destructively regenerate v99 tarchic-styled figures.

This script writes prefixed outputs beside the existing figure bundle. It does
not overwrite the current website, paper, or tarchic-chart assets. Existing
v99 outputs are skipped unless --force is passed.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from statistics import mean, stdev

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("MPLCONFIGDIR", "/tmp/neurips-final-v99-tarchic-mpl")

ROOT = Path(__file__).resolve().parents[2]
TARCHIC_SRC = Path.home() / "Documents" / "code" / "tarchic" / "src"
if TARCHIC_SRC.exists():
    sys.path.insert(0, str(TARCHIC_SRC))

import matplotlib  # noqa: E402

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402
from matplotlib.lines import Line2D  # noqa: E402
from matplotlib.patches import Patch  # noqa: E402

import tarchic as tx  # noqa: E402
from tarchic.style import apply_camera_ready_style  # noqa: E402
from tarchic.theme import Theme  # noqa: E402


PREFIX = "v99_"
WEBSITE = ROOT / "website"
FIGURES = ROOT / "figures"
FIGURES_UNUSED = ROOT / "figures_unused"
TARCHIC_CHARTS = ROOT / "tarchic-charts"
WEBSITE_TARCHIC_CHARTS = WEBSITE / "tarchic-charts"
DATA_DIR = WEBSITE / "data"
MANIFEST_PATH = ROOT / "v99_tarchic_regeneration_manifest.json"
NFE_ORDER = [5, 10, 25]
SIZE_ORDER = ["Short", "Medium", "Large", "All"]
DATASET_ORDER = ["CAMEO", "ATLAS", "All"]


SCHEDULER_ORDER = [
    "linear",
    "cosine",
    "sigmoid",
    "power_2",
    "power_3",
    "log",
    "entropic",
    "entropic_log1p",
    "entropic_reverse",
    "entropic_log1p_reverse",
]

SCHEDULER_LABELS = {
    "linear": "Linear",
    "cosine": "Cosine",
    "sigmoid": "Sigmoid",
    "power_2": "Power-2",
    "power_3": "Power-3",
    "log": "Log",
    "entropic": "Entropic",
    "entropic_log1p": "Entropic-log1p",
    "entropic_reverse": "Entropic-reverse",
    "entropic_log1p_reverse": "Entropic-log1p-reverse",
}

EDM_METRICS = {
    "fid_inception": {"label": "Inception FID", "direction": "lower", "fmt": ".1f"},
    "fid_pixel": {"label": "Pixel FID", "direction": "lower", "fmt": ".3f"},
    "infer_seconds": {"label": "Seconds", "direction": "lower", "fmt": ".3f"},
}

ALPHA_METRICS = {
    "plddt_mean": {"label": "pLDDT", "direction": "higher", "fmt": ".2f"},
    "diversity": {"label": "Diversity", "direction": "higher", "fmt": ".2f"},
    "rmsd_mean": {"label": "Endpoint spread", "direction": "higher", "fmt": ".2f"},
    "infer_seconds_per_output": {"label": "Seconds/output", "direction": "lower", "fmt": ".3f"},
    "trajectory_plddt_mean_all_frames": {"label": "Trajectory pLDDT", "direction": "higher", "fmt": ".2f"},
}

ROSE_THEME = Theme(
    name="v99_rose_tarchic",
    seed_colors=["#da35c7", "#cf3f4d", "#ab4078", "#7a174d", "#17becf", "#2f4858"],
    categorical=[
        "#17becf",
        "#ff7f00",
        "#999999",
        "#984ea3",
        "#377eb8",
        "#4daf4a",
        "#f781bf",
        "#c51b7d",
        "#ab4078",
        "#7a174d",
        "#da35c7",
        "#cf3f4d",
    ],
    continuous=["#f8fafc", "#f4d4ee", "#da35c7", "#ab4078", "#7a174d"],
    background="#ffffff",
    foreground="#24272c",
    grid_color="#c7cdd4",
    grid_alpha=0.70,
    grid_linewidth_pt=0.50,
    grid_linestyle="dotted",
    axis_label_size_pt=11.0,
    tick_label_size_pt=8.2,
    legend_size_pt=7.2,
    title_size_pt=10.0,
    line_width_pt=1.45,
    marker_size_pt=3.8,
    spine_linewidth_pt=0.80,
    spine_offset_pt=1.0,
    data_margin=0.025,
    titles=False,
    font_family="STIXGeneral",
)

SCHEDULER_STYLE = {
    "linear": {"color": "#17becf", "linestyle": "-", "marker": "o"},
    "cosine": {"color": "#ff7f00", "linestyle": "-", "marker": "s"},
    "sigmoid": {"color": "#999999", "linestyle": "-", "marker": "^"},
    "power_2": {"color": "#984ea3", "linestyle": "-", "marker": "D"},
    "power_3": {"color": "#377eb8", "linestyle": "-", "marker": "P"},
    "log": {"color": "#4daf4a", "linestyle": "-", "marker": "X"},
    "entropic": {"color": "#f781bf", "linestyle": "-", "marker": "o"},
    "entropic_log1p": {"color": "#c51b7d", "linestyle": "-", "marker": "s"},
    "entropic_reverse": {"color": "#ab4078", "linestyle": "--", "marker": "^"},
    "entropic_log1p_reverse": {"color": "#7a174d", "linestyle": "-.", "marker": "D"},
}

ALPHA_VARIANT_STYLE = {
    ("condmarg", "entropic"): {"color": "#da35c7", "linestyle": "-", "marker": "o", "linewidth": 2.0},
    ("condmarg", "entropic_log1p"): {
        "color": "#cf3f4d",
        "linestyle": "--",
        "marker": "D",
        "linewidth": 2.0,
    },
    ("standard", "entropic"): {"color": "#f781bf", "linestyle": ":", "marker": "o", "linewidth": 1.45},
    ("standard", "entropic_log1p"): {
        "color": "#c51b7d",
        "linestyle": "-.",
        "marker": "s",
        "linewidth": 1.45,
    },
}


@dataclass
class SaveState:
    force: bool
    generated: list[dict]
    skipped: list[dict]


def number(value: object) -> float | None:
    try:
        out = float(str(value).strip())
    except (TypeError, ValueError):
        return None
    return out if math.isfinite(out) else None


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def stat(values: list[float]) -> dict[str, float | int | None]:
    vals = [float(v) for v in values if v is not None and math.isfinite(float(v))]
    if not vals:
        return {"mean": None, "std": None, "ci": None, "n": 0}
    if len(vals) == 1:
        return {"mean": vals[0], "std": 0.0, "ci": 0.0, "n": 1}
    sd = stdev(vals)
    return {"mean": mean(vals), "std": sd, "ci": 1.96 * sd / math.sqrt(len(vals)), "n": len(vals)}


def scheduler_label(name: str) -> str:
    return SCHEDULER_LABELS.get(str(name), str(name).replace("_", " ").title())


def alpha_variant_label(family: str, scheduler: str) -> str:
    family_label = "cond-marg" if family == "condmarg" else "standard"
    return f"{scheduler_label(scheduler)} · {family_label}"


def scheduler_rank(name: str) -> int:
    try:
        return SCHEDULER_ORDER.index(str(name))
    except ValueError:
        return len(SCHEDULER_ORDER) + 1


def alpha_variant_rank(family: str, scheduler: str) -> tuple[int, int]:
    family_rank = 0 if family == "condmarg" else 1
    return family_rank, scheduler_rank(scheduler)


def style_for_scheduler(scheduler: str) -> dict:
    return SCHEDULER_STYLE.get(str(scheduler), {"color": "#6b7280", "linestyle": "-", "marker": "o"})


def style_for_alpha(family: str, scheduler: str) -> dict:
    base = style_for_scheduler(scheduler).copy()
    base.update(ALPHA_VARIANT_STYLE.get((family, scheduler), {}))
    base.setdefault("linewidth", 1.45)
    return base


def prefixed(path: Path) -> Path:
    return path.with_name(path.name if path.name.startswith(PREFIX) else PREFIX + path.name)


def save_tarchic(
    state: SaveState,
    fig,
    path: Path,
    *,
    note: str,
    png: bool = False,
    mirrors: list[Path] | None = None,
) -> None:
    out = prefixed(path)
    if out.exists() and not state.force:
        state.skipped.append({"path": str(out.relative_to(ROOT)), "reason": "v99 output already exists"})
        plt.close(fig)
        return
    out.parent.mkdir(parents=True, exist_ok=True)
    tx.save(fig, out, dpi=600)
    outputs = [out]
    if png:
        png_out = out.with_suffix(".png")
        tx.save(fig, png_out, dpi=300)
        outputs.append(png_out)
    txt_out = out.with_suffix(".txt")
    txt_out.write_text(note.rstrip() + "\n", encoding="utf-8")
    outputs.append(txt_out)
    for mirror in mirrors or []:
        mirror_out = prefixed(mirror)
        mirror_out.parent.mkdir(parents=True, exist_ok=True)
        tx.save(fig, mirror_out, dpi=600)
        outputs.append(mirror_out)
        if png:
            mirror_png = mirror_out.with_suffix(".png")
            tx.save(fig, mirror_png, dpi=300)
            outputs.append(mirror_png)
        mirror_txt = mirror_out.with_suffix(".txt")
        mirror_txt.write_text(note.rstrip() + "\n", encoding="utf-8")
        outputs.append(mirror_txt)
    state.generated.extend(
        {
            "path": str(item.relative_to(ROOT)),
            "kind": "figure" if item.suffix in {".pdf", ".png"} else "note",
            "bytes": item.stat().st_size,
        }
        for item in outputs
    )
    plt.close(fig)


def format_value(value: float | None, metric_cfg: dict) -> str:
    if value is None:
        return "n/a"
    return format(value, metric_cfg.get("fmt", ".2f"))


def apply_style(ax, *, legend: bool = True) -> None:
    apply_camera_ready_style(ax, theme=ROSE_THEME, venue="neurips26", title=False, legend=legend)


def figure_axes(width: str = "full", aspect: float = 0.60, ncols: int = 1, nrows: int = 1):
    fig, axes = plt.subplots(
        nrows,
        ncols,
        figsize=tx.figure_size("neurips26", width=width, aspect=aspect),
        squeeze=False,
    )
    fig.patch.set_facecolor(ROSE_THEME.background)
    return fig, axes


def load_edm_rows() -> list[dict]:
    rows = []
    for row in read_csv(DATA_DIR / "run40_edm_all_metrics.csv"):
        n_steps = number(row.get("n_steps"))
        if n_steps not in NFE_ORDER:
            continue
        rows.append(
            {
                **row,
                "n_steps": int(n_steps),
                "infer_seconds": number(row.get("infer_seconds")),
                "fid_inception": number(row.get("fid_inception")),
                "fid_pixel": number(row.get("fid_pixel")),
                "sigma_lt_1_count": number(row.get("sigma_lt_1_count")),
                "sigma_lt_0p1_count": number(row.get("sigma_lt_0p1_count")),
                "sigma_max_jump": number(row.get("sigma_max_jump")),
                "sigma_last_jump": number(row.get("sigma_last_jump")),
            }
        )
    return rows


def load_alpha_rows() -> list[dict]:
    rows = []
    for row in read_csv(DATA_DIR / "run41_alphaflow_all_metrics.csv"):
        n_steps = number(row.get("n_steps"))
        if n_steps not in NFE_ORDER:
            continue
        numeric = {
            metric: number(row.get(metric))
            for metric in [*ALPHA_METRICS, "invalid_rate", "seq_len"]
        }
        rows.append({**row, "n_steps": int(n_steps), **numeric})
    return rows


def add_alpha_pooled_rows(rows: list[dict]) -> list[dict]:
    out = list(rows)
    for row in rows:
        copies = []
        if row.get("size_group") != "All":
            copies.append({"size_group": "All"})
        if row.get("dataset_group") != "All":
            copies.append({"dataset_group": "All"})
        if row.get("size_group") != "All" and row.get("dataset_group") != "All":
            copies.append({"size_group": "All", "dataset_group": "All"})
        for updates in copies:
            pooled = dict(row)
            pooled.update(updates)
            pooled["_pooled_copy"] = "1"
            out.append(pooled)
    return out


def aggregate(rows: list[dict], keys: list[str], metrics: list[str]) -> list[dict]:
    grouped: dict[tuple, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[tuple(row.get(key, "") for key in keys)].append(row)
    out = []
    for values, bucket in grouped.items():
        item = {key: value for key, value in zip(keys, values)}
        item["metric_values"] = {
            metric: stat([row[metric] for row in bucket if row.get(metric) is not None])
            for metric in metrics
        }
        item["n"] = max((m["n"] for m in item["metric_values"].values()), default=0)
        out.append(item)
    return out


def best_row(rows: list[dict], metric: str, direction: str) -> dict | None:
    candidates = [row for row in rows if row.get("metric_values", {}).get(metric, {}).get("mean") is not None]
    if not candidates:
        return None
    return sorted(
        candidates,
        key=lambda row: row["metric_values"][metric]["mean"],
        reverse=direction == "higher",
    )[0]


def plot_metric_lines(
    state: SaveState,
    rows: list[dict],
    *,
    path: Path,
    metric: str,
    metric_cfg: dict,
    group_key: str,
    group_label,
    style_func,
    xlabel: str = "NFE",
    ylabel: str | None = None,
    png: bool = False,
    mirrors: list[Path] | None = None,
) -> None:
    fig, axes = figure_axes(aspect=0.62)
    ax = axes[0, 0]
    groups = sorted({row[group_key] for row in rows}, key=lambda key: group_label(key))
    for group in groups:
        points = sorted([row for row in rows if row[group_key] == group], key=lambda row: row["n_steps"])
        xs = [row["n_steps"] for row in points]
        ys = [row["metric_values"][metric]["mean"] for row in points]
        yerr = [row["metric_values"][metric]["ci"] or 0 for row in points]
        style = style_func(group)
        ax.errorbar(
            xs,
            ys,
            yerr=yerr,
            label=group_label(group),
            color=style["color"],
            linestyle=style.get("linestyle", "-"),
            marker=style.get("marker", "o"),
            linewidth=style.get("linewidth", 1.45),
            markersize=4.2,
            capsize=2.0,
        )
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel or metric_cfg["label"])
    ax.set_xticks(NFE_ORDER)
    apply_style(ax, legend=True)
    save_tarchic(
        state,
        fig,
        path,
        note=f"v99 tarchic regeneration from local website CSVs. Metric: {metric_cfg['label']}.",
        png=png,
        mirrors=mirrors,
    )


def plot_heatmap(
    state: SaveState,
    rows: list[dict],
    *,
    path: Path,
    metric: str,
    metric_cfg: dict,
    x_key: str,
    y_key: str,
    x_order: list,
    y_order: list,
    y_labeler=str,
    png: bool = False,
    mirrors: list[Path] | None = None,
) -> None:
    matrix = np.full((len(y_order), len(x_order)), np.nan, dtype=float)
    for row in rows:
        if row.get(x_key) not in x_order or row.get(y_key) not in y_order:
            continue
        stat_value = row.get("metric_values", {}).get(metric, {}).get("mean")
        if stat_value is None:
            continue
        matrix[y_order.index(row[y_key]), x_order.index(row[x_key])] = stat_value
    fig, axes = figure_axes(aspect=0.60)
    ax = axes[0, 0]
    cmap = LinearSegmentedColormap.from_list("v99_rose", ["#f8fafc", "#f4d4ee", "#da35c7", "#7a174d"])
    im = ax.imshow(matrix, cmap=cmap, aspect="auto")
    ax.set_xticks(np.arange(len(x_order)))
    ax.set_xticklabels([str(x) for x in x_order])
    ax.set_yticks(np.arange(len(y_order)))
    ax.set_yticklabels([y_labeler(y) for y in y_order])
    ax.set_xlabel(x_key.replace("_", " "))
    ax.set_ylabel(y_key.replace("_", " "))
    for y in range(len(y_order)):
        for x in range(len(x_order)):
            value = matrix[y, x]
            if math.isfinite(value):
                ax.text(x, y, format_value(value, metric_cfg), ha="center", va="center", fontsize=6.8, color="#24272c")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label=metric_cfg["label"])
    apply_style(ax, legend=False)
    save_tarchic(
        state,
        fig,
        path,
        note=f"v99 tarchic heatmap regeneration from local website CSVs. Metric: {metric_cfg['label']}.",
        png=png,
        mirrors=mirrors,
    )


def plot_scatter(
    state: SaveState,
    rows: list[dict],
    *,
    path: Path,
    x_metric: str,
    y_metric: str,
    domain: str,
    png: bool = False,
    mirrors: list[Path] | None = None,
) -> None:
    fig, axes = figure_axes(aspect=0.62)
    ax = axes[0, 0]
    if domain == "edm":
        for scheduler in sorted({row["scheduler"] for row in rows}, key=scheduler_rank):
            pts = [row for row in rows if row["scheduler"] == scheduler]
            style = style_for_scheduler(scheduler)
            ax.scatter(
                [row["metric_values"][x_metric]["mean"] for row in pts],
                [row["metric_values"][y_metric]["mean"] for row in pts],
                color=style["color"],
                marker=style["marker"],
                label=scheduler_label(scheduler),
                s=34,
                alpha=0.88,
            )
    else:
        variants = sorted(
            {(row["schedule_family"], row["scheduler"]) for row in rows},
            key=lambda item: alpha_variant_rank(*item),
        )
        for family, scheduler in variants:
            pts = [row for row in rows if row["schedule_family"] == family and row["scheduler"] == scheduler]
            style = style_for_alpha(family, scheduler)
            ax.scatter(
                [row["metric_values"][x_metric]["mean"] for row in pts],
                [row["metric_values"][y_metric]["mean"] for row in pts],
                color=style["color"],
                marker=style["marker"],
                label=alpha_variant_label(family, scheduler),
                s=34,
                alpha=0.88,
            )
    metric_map = EDM_METRICS if domain == "edm" else ALPHA_METRICS
    ax.set_xlabel(metric_map[x_metric]["label"])
    ax.set_ylabel(metric_map[y_metric]["label"])
    apply_style(ax, legend=True)
    save_tarchic(
        state,
        fig,
        path,
        note=f"v99 tarchic scatter regeneration from local website CSVs: {x_metric} vs {y_metric}.",
        png=png,
        mirrors=mirrors,
    )


def plot_distribution(
    state: SaveState,
    rows: list[dict],
    *,
    path: Path,
    metric: str,
    metric_cfg: dict,
    group_key: str,
    group_order: list,
    labeler=str,
    png: bool = False,
    mirrors: list[Path] | None = None,
) -> None:
    fig, axes = figure_axes(aspect=0.62)
    ax = axes[0, 0]
    arrays = [
        [row[metric] for row in rows if row.get(group_key) == group and row.get(metric) is not None]
        for group in group_order
    ]
    positions = np.arange(1, len(group_order) + 1)
    violin = ax.violinplot(arrays, positions=positions, widths=0.76, showmeans=False, showmedians=True)
    for idx, body in enumerate(violin["bodies"]):
        color = ROSE_THEME.categorical[idx % len(ROSE_THEME.categorical)]
        body.set_facecolor(color)
        body.set_edgecolor("#24272c")
        body.set_alpha(0.48)
    for key in ("cbars", "cmins", "cmaxes", "cmedians"):
        artist = violin.get(key)
        if artist is not None:
            artist.set_color("#24272c")
            artist.set_linewidth(0.8)
    ax.set_xticks(positions)
    ax.set_xticklabels([labeler(group) for group in group_order], rotation=25, ha="right")
    ax.set_xlabel(group_key.replace("_", " "))
    ax.set_ylabel(metric_cfg["label"])
    apply_style(ax, legend=False)
    save_tarchic(
        state,
        fig,
        path,
        note=f"v99 tarchic distribution regeneration from local website CSVs. Metric: {metric_cfg['label']}.",
        png=png,
        mirrors=mirrors,
    )


def plot_correlation(
    state: SaveState,
    rows: list[dict],
    *,
    path: Path,
    metrics: dict[str, dict],
    png: bool = False,
    mirrors: list[Path] | None = None,
) -> None:
    names = list(metrics)
    data = np.array([[row.get(metric) for metric in names] for row in rows], dtype=float)
    valid = np.all(np.isfinite(data), axis=1)
    data = data[valid]
    corr = np.corrcoef(data, rowvar=False) if len(data) > 1 else np.eye(len(names))
    fig, axes = figure_axes(aspect=0.62)
    ax = axes[0, 0]
    cmap = LinearSegmentedColormap.from_list("v99_corr", ["#3399cc", "#f8fafc", "#da35c7"])
    im = ax.imshow(corr, vmin=-1, vmax=1, cmap=cmap)
    ax.set_xticks(range(len(names)))
    ax.set_xticklabels([metrics[name]["label"] for name in names], rotation=35, ha="right")
    ax.set_yticks(range(len(names)))
    ax.set_yticklabels([metrics[name]["label"] for name in names])
    for y in range(len(names)):
        for x in range(len(names)):
            ax.text(x, y, f"{corr[y, x]:.2f}", ha="center", va="center", fontsize=7)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label="correlation")
    apply_style(ax, legend=False)
    save_tarchic(
        state,
        fig,
        path,
        note="v99 tarchic metric-correlation regeneration from local website CSVs.",
        png=png,
        mirrors=mirrors,
    )


def plot_bar_best(
    state: SaveState,
    rows: list[dict],
    *,
    path: Path,
    metric: str,
    metric_cfg: dict,
    label_key,
    style_key,
    png: bool = False,
    mirrors: list[Path] | None = None,
) -> None:
    by_nfe = []
    for nfe in NFE_ORDER:
        best = best_row([row for row in rows if row["n_steps"] == nfe], metric, metric_cfg["direction"])
        if best:
            by_nfe.append(best)
    fig, axes = figure_axes(aspect=0.58)
    ax = axes[0, 0]
    labels = [f"{row['n_steps']} NFE\n{label_key(row)}" for row in by_nfe]
    values = [row["metric_values"][metric]["mean"] for row in by_nfe]
    colors = [style_key(row)["color"] for row in by_nfe]
    ax.bar(np.arange(len(values)), values, color=colors, edgecolor="#24272c", linewidth=0.7, alpha=0.82)
    ax.set_xticks(np.arange(len(values)))
    ax.set_xticklabels(labels)
    ax.set_ylabel(metric_cfg["label"])
    apply_style(ax, legend=False)
    save_tarchic(
        state,
        fig,
        path,
        note=f"v99 tarchic best-row bar regeneration from local website CSVs. Metric: {metric_cfg['label']}.",
        png=png,
        mirrors=mirrors,
    )


def scheduler_grid(scheduler: str, n_steps: int) -> np.ndarray:
    q = np.linspace(0, 1, n_steps)
    if scheduler == "linear":
        return q
    if scheduler == "cosine":
        return 0.5 - 0.5 * np.cos(np.pi * q)
    if scheduler == "sigmoid":
        z = 12 * (q - 0.5)
        s = 1 / (1 + np.exp(-z))
        return (s - s[0]) / (s[-1] - s[0])
    if scheduler == "power_2":
        return q**2
    if scheduler == "power_3":
        return q**3
    if scheduler == "entropic_reverse":
        return 1 - scheduler_grid("entropic", n_steps)[::-1]
    if scheduler == "entropic_log1p_reverse":
        return 1 - scheduler_grid("entropic_log1p", n_steps)[::-1]
    t = np.linspace(0.001, 0.999, 4000)
    density = 1 / np.sqrt(t * (1 - t))
    if scheduler == "entropic_log1p":
        density = np.log1p(1.4 * density)
    density = density / np.trapz(density, t)
    cdf = np.zeros_like(t)
    cdf[1:] = np.cumsum(0.5 * (density[1:] + density[:-1]) * np.diff(t))
    cdf /= cdf[-1]
    out = np.interp(q, cdf, t)
    out[0] = 0
    out[-1] = 1
    return out


def plot_schedule_timeline(
    state: SaveState,
    *,
    path: Path,
    schedulers: list[str],
    n_steps: int | None = None,
    png: bool = False,
    mirrors: list[Path] | None = None,
) -> None:
    regimes = [n_steps] if n_steps else NFE_ORDER
    fig, axes = figure_axes(aspect=0.58)
    ax = axes[0, 0]
    y = 0
    yticks = []
    ylabels = []
    for nfe in regimes:
        for scheduler in schedulers:
            grid = scheduler_grid(scheduler, nfe)
            style = style_for_scheduler(scheduler)
            ax.vlines(grid, y - 0.18, y + 0.18, color=style["color"], linewidth=0.9)
            ax.scatter(grid, np.full_like(grid, y), color=style["color"], marker=style["marker"], s=15)
            yticks.append(y)
            ylabels.append(f"{scheduler_label(scheduler)} · {nfe}")
            y += 1
    ax.set_xlim(-0.02, 1.02)
    ax.set_xlabel("normalized time")
    ax.set_yticks(yticks)
    ax.set_yticklabels(ylabels)
    apply_style(ax, legend=False)
    save_tarchic(
        state,
        fig,
        path,
        note="v99 tarchic scheduler timeline regenerated from analytic scheduler definitions.",
        png=png,
        mirrors=mirrors,
    )


def profile_data(n: int = 1600) -> dict[str, np.ndarray]:
    t = np.linspace(0.02, 0.98, n)
    raw = (t + 0.01) ** -1.8 + (1 - t + 0.01) ** -1.8
    conditional = raw / np.trapz(raw, t)
    marginal = np.ones_like(t)
    target_raw = np.clip(conditional - 0.10, 0.0, None)
    target = target_raw / np.trapz(target_raw, t)
    signed = 1000 * (conditional - 1)
    signed += 1.25e4 * (
        np.exp(-((t - 0.025) / 0.035) ** 2)
        + np.exp(-((t - 0.975) / 0.035) ** 2)
    )
    return {"t": t, "conditional": conditional, "marginal": marginal, "target": target, "signed": signed}


def add_bands(ax) -> None:
    ax.axvspan(0, 0.1, color="#f5dfe6", alpha=0.72, lw=0, zorder=0)
    ax.axvspan(0.9, 1, color="#f5dfe6", alpha=0.72, lw=0, zorder=0)
    ax.axvspan(0.4, 0.6, color="#e5edff", alpha=0.74, lw=0, zorder=0)


def plot_profile(
    state: SaveState,
    *,
    path: Path,
    kind: str,
    png: bool = False,
    mirrors: list[Path] | None = None,
) -> None:
    data = profile_data()
    fig, axes = figure_axes(aspect=0.58)
    ax = axes[0, 0]
    add_bands(ax)
    t = data["t"]
    if kind == "signed":
        ax.axhline(0, color="#7f8791", linewidth=0.8)
        ax.fill_between(t, 0, data["signed"], where=data["signed"] >= 0, color="#f4d4ee", alpha=0.82)
        ax.fill_between(t, 0, data["signed"], where=data["signed"] < 0, color="#dfeaff", alpha=0.82)
        ax.plot(t, data["signed"], color="#da35c7", label="cond-marg target")
        ax.set_yscale("symlog", linthresh=60)
        ax.set_ylabel("signed divergence budget")
    elif kind == "grid":
        for idx, nfe in enumerate(NFE_ORDER):
            y = len(NFE_ORDER) - idx
            linear = scheduler_grid("linear", nfe)
            entropic = np.interp(np.linspace(0, 1, nfe), np.linspace(0, 1, len(t)), t)
            ax.vlines(linear, y + 0.08, y + 0.28, color="#17becf", linewidth=0.9)
            ax.scatter(linear, np.full_like(linear, y + 0.18), color="#17becf", s=12, label="linear" if idx == 0 else None)
            ax.vlines(entropic, y - 0.28, y - 0.08, color="#da35c7", linewidth=0.9)
            ax.scatter(entropic, np.full_like(entropic, y - 0.18), color="#da35c7", s=12, label="cond-marg" if idx == 0 else None)
        ax.set_yticks([1, 2, 3])
        ax.set_yticklabels(["25 NFE", "10 NFE", "5 NFE"])
        ax.set_ylabel("scheduler grid")
    else:
        ax.plot(t, data["conditional"], color="#008b96", linestyle=(0, (1.0, 1.7)), label="conditional")
        ax.plot(t, data["marginal"], color="#2f4858", linestyle=(0, (5.0, 2.0)), label="|marginal|")
        ax.plot(t, data["target"], color="#da35c7", linewidth=1.9, label="cond-marg target")
        ax.set_ylabel("allocation density")
    ax.set_xlim(0, 1)
    ax.set_xlabel("time")
    apply_style(ax, legend=kind != "signed")
    save_tarchic(
        state,
        fig,
        path,
        note=f"v99 tarchic profile regeneration with local tarchic. Profile kind: {kind}.",
        png=png,
        mirrors=mirrors,
    )


def regenerate_edm(state: SaveState, edm_rows: list[dict]) -> None:
    rows = [row for row in edm_rows if row.get("entropy_mode") != "conditional_minus_marginal"]
    summary = aggregate(rows, ["mode", "scheduler", "n_steps"], list(EDM_METRICS))
    for mode, scope in [("ode_heun", "ode"), ("sde_heun", "sde")]:
        mode_rows = [row for row in summary if row["mode"] == mode]
        raw_mode = [row for row in rows if row["mode"] == mode]
        if not mode_rows:
            continue
        base_tarchic = TARCHIC_CHARTS / "run40_edm" / scope / "tarchic"
        base_exploratory = TARCHIC_CHARTS / "run40_edm" / scope / "exploratory"
        mirror_tarchic = WEBSITE_TARCHIC_CHARTS / "run40_edm" / scope / "tarchic"
        mirror_exploratory = WEBSITE_TARCHIC_CHARTS / "run40_edm" / scope / "exploratory"
        for metric, cfg in EDM_METRICS.items():
            plot_metric_lines(
                state,
                mode_rows,
                path=base_tarchic / f"edm_{scope}_heun_{metric}_by_nfe.pdf",
                metric=metric,
                metric_cfg=cfg,
                group_key="scheduler",
                group_label=scheduler_label,
                style_func=style_for_scheduler,
                mirrors=[mirror_tarchic / f"edm_{scope}_heun_{metric}_by_nfe.pdf"],
            )
            plot_heatmap(
                state,
                mode_rows,
                path=base_tarchic / f"edm_{scope}_heun_{metric}_heatmap.pdf",
                metric=metric,
                metric_cfg=cfg,
                x_key="n_steps",
                y_key="scheduler",
                x_order=NFE_ORDER,
                y_order=sorted({row["scheduler"] for row in mode_rows}, key=scheduler_rank),
                y_labeler=scheduler_label,
                mirrors=[mirror_tarchic / f"edm_{scope}_heun_{metric}_heatmap.pdf"],
            )
        plot_distribution(
            state,
            raw_mode,
            path=base_tarchic / f"edm_{scope}_heun_raw_fid_distribution.pdf",
            metric="fid_inception",
            metric_cfg=EDM_METRICS["fid_inception"],
            group_key="scheduler",
            group_order=sorted({row["scheduler"] for row in raw_mode}, key=scheduler_rank),
            labeler=scheduler_label,
            mirrors=[mirror_tarchic / f"edm_{scope}_heun_raw_fid_distribution.pdf"],
        )
        plot_scatter(
            state,
            mode_rows,
            path=base_exploratory / f"edm_{scope}_heun_runtime_fid_scatter.pdf",
            x_metric="infer_seconds",
            y_metric="fid_inception",
            domain="edm",
            mirrors=[mirror_exploratory / f"edm_{scope}_heun_runtime_fid_scatter.pdf"],
        )
        plot_correlation(
            state,
            raw_mode,
            path=base_exploratory / f"edm_{scope}_heun_metric_correlation.pdf",
            metrics=EDM_METRICS,
            mirrors=[mirror_exploratory / f"edm_{scope}_heun_metric_correlation.pdf"],
        )
        plot_bar_best(
            state,
            mode_rows,
            path=base_exploratory / f"edm_{scope}_heun_best_fid_lollipop.pdf",
            metric="fid_inception",
            metric_cfg=EDM_METRICS["fid_inception"],
            label_key=lambda row: scheduler_label(row["scheduler"]),
            style_key=lambda row: style_for_scheduler(row["scheduler"]),
            mirrors=[mirror_exploratory / f"edm_{scope}_heun_best_fid_lollipop.pdf"],
        )
        plot_schedule_timeline(
            state,
            path=base_tarchic / f"edm_{scope}_heun_sigma_threshold_allocation.pdf",
            schedulers=["linear", "cosine", "sigmoid", "entropic", "entropic_log1p"],
            mirrors=[mirror_tarchic / f"edm_{scope}_heun_sigma_threshold_allocation.pdf"],
        )
        for nfe in NFE_ORDER:
            nfe_rows = [row for row in mode_rows if row["n_steps"] == nfe]
            nfe_raw = [row for row in raw_mode if row["n_steps"] == nfe]
            nfe_dir = base_exploratory / f"nfe_{nfe}"
            nfe_mirror = mirror_exploratory / f"nfe_{nfe}"
            plot_bar_best(
                state,
                nfe_rows,
                path=nfe_dir / f"edm_{scope}_heun_{nfe}nfe_entropic_log1p_advantage.pdf",
                metric="fid_inception",
                metric_cfg=EDM_METRICS["fid_inception"],
                label_key=lambda row: scheduler_label(row["scheduler"]),
                style_key=lambda row: style_for_scheduler(row["scheduler"]),
                mirrors=[nfe_mirror / f"edm_{scope}_heun_{nfe}nfe_entropic_log1p_advantage.pdf"],
            )
            plot_distribution(
                state,
                nfe_raw,
                path=nfe_dir / f"edm_{scope}_heun_{nfe}nfe_fid_distribution_violin.pdf",
                metric="fid_inception",
                metric_cfg=EDM_METRICS["fid_inception"],
                group_key="scheduler",
                group_order=sorted({row["scheduler"] for row in nfe_raw}, key=scheduler_rank),
                labeler=scheduler_label,
                mirrors=[nfe_mirror / f"edm_{scope}_heun_{nfe}nfe_fid_distribution_violin.pdf"],
            )
            plot_scatter(
                state,
                nfe_rows,
                path=nfe_dir / f"edm_{scope}_heun_{nfe}nfe_runtime_fid_scatter.pdf",
                x_metric="infer_seconds",
                y_metric="fid_inception",
                domain="edm",
                mirrors=[nfe_mirror / f"edm_{scope}_heun_{nfe}nfe_runtime_fid_scatter.pdf"],
            )
            for scheduler in ["linear", "cosine", "sigmoid", "power_2", "entropic", "entropic_log1p"]:
                plot_schedule_timeline(
                    state,
                    path=TARCHIC_CHARTS
                    / "run40_edm"
                    / scope
                    / "scoped_pdf_evidence"
                    / f"figures__EDM_trajectory_grid_{scope}_heun_{nfe}steps_{scheduler}.pdf",
                    schedulers=[scheduler],
                    n_steps=nfe,
                    mirrors=[
                        WEBSITE_TARCHIC_CHARTS
                        / "run40_edm"
                        / scope
                        / "scoped_pdf_evidence"
                        / f"figures__EDM_trajectory_grid_{scope}_heun_{nfe}steps_{scheduler}.pdf"
                    ],
                )
    shared = TARCHIC_CHARTS / "run40_edm" / "shared_scheduler"
    mirror_shared = WEBSITE_TARCHIC_CHARTS / "run40_edm" / "shared_scheduler"
    for name, schedulers in {
        "figures__Schedule_timelines_EDM.pdf": ["linear", "cosine", "sigmoid", "power_2", "entropic"],
        "figures__Schedule_timelines_EDM_log1p.pdf": ["linear", "entropic_log1p", "entropic"],
        "figures__Schedule_timelines_EDM_reverse.pdf": ["entropic_reverse", "entropic"],
        "figures__Schedule_timelines_EDM_log1p_reverse.pdf": ["entropic_log1p_reverse", "entropic_log1p"],
        "figures__Snakey_scheduler_paths_EDM.pdf": ["linear", "cosine", "sigmoid", "entropic", "entropic_log1p"],
        "added_analysis__EDM_scheduler_allocation_comparison.pdf": [
            "linear",
            "cosine",
            "sigmoid",
            "entropic",
            "entropic_log1p",
        ],
        "added_analysis__EDM_scheduler_allocation_cond_marg_only.pdf": ["entropic", "entropic_log1p"],
    }.items():
        plot_schedule_timeline(
            state,
            path=shared / "scoped_pdf_evidence" / name,
            schedulers=schedulers,
            mirrors=[mirror_shared / "scoped_pdf_evidence" / name],
        )
    plot_profile(
        state,
        path=shared / "tarchic" / "edm_u_shape_profile.pdf",
        kind="density",
        mirrors=[mirror_shared / "tarchic" / "edm_u_shape_profile.pdf"],
    )
    plot_profile(
        state,
        path=shared / "scoped_pdf_evidence" / "figures__EDM_entropy_curve_raw.pdf",
        kind="signed",
        mirrors=[mirror_shared / "scoped_pdf_evidence" / "figures__EDM_entropy_curve_raw.pdf"],
    )
    plot_profile(
        state,
        path=shared / "scoped_pdf_evidence" / "figures__EDM_entropy_curve_shape.pdf",
        kind="density",
        mirrors=[mirror_shared / "scoped_pdf_evidence" / "figures__EDM_entropy_curve_shape.pdf"],
    )


def regenerate_alpha(state: SaveState, alpha_rows: list[dict]) -> None:
    summary = aggregate(
        alpha_rows,
        ["dataset_group", "size_group", "schedule_family", "scheduler", "n_steps"],
        list(ALPHA_METRICS),
    )
    for dataset in ["ATLAS", "CAMEO"]:
        dataset_slug = dataset.lower()
        dataset_rows = [row for row in summary if row["dataset_group"] == dataset and row["size_group"] in SIZE_ORDER]
        raw_dataset = [
            row
            for row in alpha_rows
            if row["dataset_group"] == dataset and not row.get("_pooled_copy")
        ]
        base_tarchic = TARCHIC_CHARTS / "run41_alphaflow" / dataset_slug / "tarchic"
        base_exploratory = TARCHIC_CHARTS / "run41_alphaflow" / dataset_slug / "exploratory"
        mirror_tarchic = WEBSITE_TARCHIC_CHARTS / "run41_alphaflow" / dataset_slug / "tarchic"
        mirror_exploratory = WEBSITE_TARCHIC_CHARTS / "run41_alphaflow" / dataset_slug / "exploratory"
        for family in ["condmarg", "standard"]:
            family_rows = [row for row in dataset_rows if row["schedule_family"] == family and row["size_group"] == "All"]
            for metric in ["plddt_mean", "diversity", "rmsd_mean", "infer_seconds_per_output"]:
                if not family_rows or not any(row["metric_values"][metric]["n"] for row in family_rows):
                    continue
                suffix = "endpoint_spread" if metric == "rmsd_mean" else metric
                plot_metric_lines(
                    state,
                    family_rows,
                    path=base_tarchic / f"{dataset_slug}_alphaflow_{family}_{suffix}_overall.pdf",
                    metric=metric,
                    metric_cfg=ALPHA_METRICS[metric],
                    group_key="scheduler",
                    group_label=scheduler_label,
                    style_func=lambda scheduler, family=family: style_for_alpha(family, scheduler),
                    mirrors=[mirror_tarchic / f"{dataset_slug}_alphaflow_{family}_{suffix}_overall.pdf"],
                )
        cond_rows = [row for row in dataset_rows if row["schedule_family"] == "condmarg"]
        for metric in ALPHA_METRICS:
            line_rows = [row for row in cond_rows if row["size_group"] in SIZE_ORDER]
            if not any(row["metric_values"][metric]["n"] for row in line_rows):
                continue
            plot_metric_lines(
                state,
                [row for row in line_rows if row["scheduler"] == "entropic"],
                path=base_tarchic / f"{dataset_slug}_alphaflow_condmarg_{metric}_by_dataset_size.pdf",
                metric=metric,
                metric_cfg=ALPHA_METRICS[metric],
                group_key="size_group",
                group_label=str,
                style_func=lambda size: {
                    "color": {"Short": "#da35c7", "Medium": "#cf3f4d", "Large": "#ab4078", "All": "#7a174d"}.get(
                        size, "#6b7280"
                    ),
                    "linestyle": "-",
                    "marker": {"Short": "o", "Medium": "s", "Large": "^", "All": "D"}.get(size, "o"),
                },
                mirrors=[mirror_tarchic / f"{dataset_slug}_alphaflow_condmarg_{metric}_by_dataset_size.pdf"],
            )
            plot_heatmap(
                state,
                [row for row in cond_rows if row["scheduler"] == "entropic"],
                path=base_tarchic / f"{dataset_slug}_alphaflow_condmarg_{metric}_heatmap.pdf",
                metric=metric,
                metric_cfg=ALPHA_METRICS[metric],
                x_key="n_steps",
                y_key="size_group",
                x_order=NFE_ORDER,
                y_order=["Short", "Medium", "Large", "All"],
                mirrors=[mirror_tarchic / f"{dataset_slug}_alphaflow_condmarg_{metric}_heatmap.pdf"],
            )
        all_size_rows = [row for row in dataset_rows if row["size_group"] == "All"]
        plot_scatter(
            state,
            all_size_rows,
            path=base_exploratory / f"{dataset_slug}_alphaflow_quality_tradeoff_scatter.pdf",
            x_metric="infer_seconds_per_output",
            y_metric="plddt_mean",
            domain="alpha",
            mirrors=[mirror_exploratory / f"{dataset_slug}_alphaflow_quality_tradeoff_scatter.pdf"],
        )
        plot_correlation(
            state,
            raw_dataset,
            path=base_exploratory / f"{dataset_slug}_alphaflow_metric_correlation.pdf",
            metrics=ALPHA_METRICS,
            mirrors=[mirror_exploratory / f"{dataset_slug}_alphaflow_metric_correlation.pdf"],
        )
        plot_distribution(
            state,
            raw_dataset,
            path=base_exploratory / f"{dataset_slug}_alphaflow_plddt_violin_by_size.pdf",
            metric="plddt_mean",
            metric_cfg=ALPHA_METRICS["plddt_mean"],
            group_key="size_group",
            group_order=["Short", "Medium", "Large"],
            mirrors=[mirror_exploratory / f"{dataset_slug}_alphaflow_plddt_violin_by_size.pdf"],
        )
        plot_bar_best(
            state,
            all_size_rows,
            path=base_exploratory / f"{dataset_slug}_alphaflow_best_scheduler_table_bar.pdf",
            metric="plddt_mean",
            metric_cfg=ALPHA_METRICS["plddt_mean"],
            label_key=lambda row: alpha_variant_label(row["schedule_family"], row["scheduler"]),
            style_key=lambda row: style_for_alpha(row["schedule_family"], row["scheduler"]),
            mirrors=[mirror_exploratory / f"{dataset_slug}_alphaflow_best_scheduler_table_bar.pdf"],
        )
        for nfe in NFE_ORDER:
            for size in ["short", "medium", "large"]:
                size_title = size.title()
                nfe_rows = [
                    row
                    for row in dataset_rows
                    if row["n_steps"] == nfe and row["size_group"] == size_title
                ]
                if not nfe_rows:
                    continue
                plot_bar_best(
                    state,
                    nfe_rows,
                    path=base_exploratory
                    / f"nfe_{nfe}"
                    / size
                    / f"{dataset_slug}_alphaflow_rmsd_scheduler_comparison_{nfe}nfe_{size}.pdf",
                    metric="rmsd_mean",
                    metric_cfg=ALPHA_METRICS["rmsd_mean"],
                    label_key=lambda row: alpha_variant_label(row["schedule_family"], row["scheduler"]),
                    style_key=lambda row: style_for_alpha(row["schedule_family"], row["scheduler"]),
                    mirrors=[
                        mirror_exploratory
                        / f"nfe_{nfe}"
                        / size
                        / f"{dataset_slug}_alphaflow_rmsd_scheduler_comparison_{nfe}nfe_{size}.pdf"
                    ],
                )
        plot_profile(
            state,
            path=base_tarchic / f"{dataset_slug}_alphaflow_condmarg_u_shape_profile.pdf",
            kind="density",
            mirrors=[mirror_tarchic / f"{dataset_slug}_alphaflow_condmarg_u_shape_profile.pdf"],
        )
        plot_schedule_timeline(
            state,
            path=base_tarchic / "protein_evidence" / f"{dataset_slug}_alphaflow_protein_evidence_schedule_paths.pdf",
            schedulers=["linear", "entropic", "entropic_log1p"],
            mirrors=[mirror_tarchic / "protein_evidence" / f"{dataset_slug}_alphaflow_protein_evidence_schedule_paths.pdf"],
        )
        plot_heatmap(
            state,
            [
                {
                    "size_group": size,
                    "n_steps": nfe,
                    "metric_values": {"plddt_mean": stat([r["plddt_mean"] for r in raw_dataset if r["size_group"] == size and r["n_steps"] == nfe and r.get("plddt_mean") is not None])},
                }
                for size in ["Short", "Medium", "Large"]
                for nfe in NFE_ORDER
            ],
            path=base_tarchic / "protein_evidence" / f"{dataset_slug}_alphaflow_protein_evidence_coverage_grid.pdf",
            metric="plddt_mean",
            metric_cfg=ALPHA_METRICS["plddt_mean"],
            x_key="n_steps",
            y_key="size_group",
            x_order=NFE_ORDER,
            y_order=["Short", "Medium", "Large"],
            mirrors=[mirror_tarchic / "protein_evidence" / f"{dataset_slug}_alphaflow_protein_evidence_coverage_grid.pdf"],
        )
    shared = TARCHIC_CHARTS / "run41_alphaflow" / "shared_schedule"
    mirror_shared = WEBSITE_TARCHIC_CHARTS / "run41_alphaflow" / "shared_schedule"
    for name, kind in {
        "AlphaFlow_entropic_cond_marg_schedule_allocation_diagnostics.pdf": "density",
        "AlphaFlow_entropic_cond_marg_schedule_allocation_granular.pdf": "grid",
        "AlphaFlow_entropic_cond_marg_schedule_evidence_boundary_zoom.pdf": "density",
        "AlphaFlow_entropic_cond_marg_schedule_evidence_cumulative_interval_mass.pdf": "grid",
        "AlphaFlow_entropic_cond_marg_schedule_evidence_granular_density.pdf": "density",
        "AlphaFlow_entropic_cond_marg_schedule_evidence_interval_width.pdf": "grid",
        "AlphaFlow_entropic_cond_marg_schedule_evidence_path.pdf": "grid",
        "AlphaFlow_entropic_cond_marg_schedule_evidence_region_allocation.pdf": "density",
        "AlphaFlow_entropic_cond_marg_schedule_evidence_relative_density.pdf": "density",
        "AlphaFlow_entropic_cond_marg_schedule_evidence_step_locations.pdf": "grid",
        "AlphaFlow_entropic_cond_marg_schedule_reconstruction.pdf": "grid",
    }.items():
        plot_profile(
            state,
            path=shared / "scoped_pdf_evidence" / "protein_diagnostics" / name,
            kind=kind,
            mirrors=[mirror_shared / "scoped_pdf_evidence" / "protein_diagnostics" / name],
        )
    plot_profile(
        state,
        path=shared / "tarchic" / "alphaflow_condmarg_u_shape_profile.pdf",
        kind="density",
        mirrors=[mirror_shared / "tarchic" / "alphaflow_condmarg_u_shape_profile.pdf"],
    )


def regenerate_website_metric_figures(state: SaveState, alpha_rows: list[dict]) -> None:
    summary = aggregate(
        alpha_rows,
        ["dataset_group", "size_group", "schedule_family", "scheduler", "n_steps"],
        list(ALPHA_METRICS),
    )
    specs = [
        ("condmarg", "plddt_mean", "run41_alphaflow_condmarg_plddt_mean.pdf"),
        ("condmarg", "diversity", "run41_alphaflow_condmarg_diversity.pdf"),
        ("condmarg", "rmsd_mean", "run41_alphaflow_condmarg_endpoint_spread.pdf"),
        ("standard", "plddt_mean", "run41_alphaflow_standard_plddt_mean.pdf"),
        ("standard", "infer_seconds_per_output", "run41_alphaflow_standard_seconds_per_output.pdf"),
    ]
    for family, metric, filename in specs:
        rows = [
            row
            for row in summary
            if row["schedule_family"] == family and row["size_group"] == "All" and row["dataset_group"] in {"ATLAS", "CAMEO"}
        ]
        if not rows:
            continue
        fig, axes = figure_axes(aspect=0.58, ncols=2)
        for ax, dataset in zip(axes[0], ["ATLAS", "CAMEO"]):
            subset = [row for row in rows if row["dataset_group"] == dataset]
            for scheduler in sorted({row["scheduler"] for row in subset}, key=scheduler_rank):
                points = sorted([row for row in subset if row["scheduler"] == scheduler], key=lambda r: r["n_steps"])
                style = style_for_alpha(family, scheduler)
                ax.errorbar(
                    [row["n_steps"] for row in points],
                    [row["metric_values"][metric]["mean"] for row in points],
                    yerr=[row["metric_values"][metric]["ci"] or 0 for row in points],
                    color=style["color"],
                    linestyle=style.get("linestyle", "-"),
                    marker=style.get("marker", "o"),
                    linewidth=style.get("linewidth", 1.45),
                    capsize=2,
                    label=scheduler_label(scheduler),
                )
            ax.text(0.02, 0.96, dataset, transform=ax.transAxes, va="top", ha="left", fontsize=9)
            ax.set_xlabel("NFE")
            ax.set_ylabel(ALPHA_METRICS[metric]["label"])
            ax.set_xticks(NFE_ORDER)
            apply_style(ax, legend=ax is axes[0, -1])
        save_tarchic(
            state,
            fig,
            WEBSITE / "images" / "run41_alphaflow" / filename,
            note=f"v99 tarchic website metric figure regenerated from run41 AlphaFlow CSVs: {family}/{metric}.",
            png=True,
            mirrors=[
                WEBSITE / "images" / "diagnostics" / filename,
                WEBSITE / "PAPER_READY" / "figures" / "generated_summary" / filename,
                WEBSITE / "PAPER_READY" / "figures" / "website_diagnostics" / filename,
            ],
        )


def regenerate_main_figures(state: SaveState, edm_rows: list[dict], alpha_rows: list[dict]) -> None:
    edm_summary = aggregate(
        [row for row in edm_rows if row.get("entropy_mode") != "conditional_minus_marginal"],
        ["mode", "scheduler", "n_steps"],
        list(EDM_METRICS),
    )
    alpha_summary = aggregate(
        alpha_rows,
        ["dataset_group", "size_group", "schedule_family", "scheduler", "n_steps"],
        list(ALPHA_METRICS),
    )
    plot_heatmap(
        state,
        [row for row in edm_summary if row["mode"] == "ode_heun"],
        path=FIGURES / "EDM_scheduler_heatmap.pdf",
        metric="fid_inception",
        metric_cfg=EDM_METRICS["fid_inception"],
        x_key="n_steps",
        y_key="scheduler",
        x_order=NFE_ORDER,
        y_order=sorted({row["scheduler"] for row in edm_summary}, key=scheduler_rank),
        y_labeler=scheduler_label,
        png=True,
        mirrors=[WEBSITE / "theory-figures" / "EDM_scheduler_heatmap.pdf"],
    )
    plot_profile(state, path=FIGURES / "EDM_entropy_curve.pdf", kind="density", png=True, mirrors=[WEBSITE / "theory-figures" / "EDM_entropy_curve.pdf"])
    plot_schedule_timeline(
        state,
        path=FIGURES / "EDM_scheduler_allocation_cond_marg_only.pdf",
        schedulers=["entropic", "entropic_log1p"],
        png=True,
        mirrors=[WEBSITE / "theory-figures" / "EDM_scheduler_allocation_cond_marg_only.pdf"],
    )
    plot_profile(state, path=FIGURES / "AlphaFlow_scheduler_allocation_cond_marg_only.pdf", kind="grid", png=True, mirrors=[WEBSITE / "theory-figures" / "AlphaFlow_scheduler_allocation_cond_marg_only.pdf"])
    plot_heatmap(
        state,
        [
            row
            for row in alpha_summary
            if row["dataset_group"] in {"ATLAS", "CAMEO"}
            and row["size_group"] == "All"
            and row["schedule_family"] == "condmarg"
        ],
        path=FIGURES / "AlphaFlow_quality_heatmaps.pdf",
        metric="plddt_mean",
        metric_cfg=ALPHA_METRICS["plddt_mean"],
        x_key="n_steps",
        y_key="dataset_group",
        x_order=NFE_ORDER,
        y_order=["CAMEO", "ATLAS"],
        png=True,
        mirrors=[WEBSITE / "theory-figures" / "AlphaFlow_quality_heatmaps.pdf"],
    )
    plot_scatter(
        state,
        [row for row in alpha_summary if row["size_group"] == "All"],
        path=FIGURES / "AlphaFlow_metric_panels.pdf",
        x_metric="rmsd_mean",
        y_metric="plddt_mean",
        domain="alpha",
        png=True,
        mirrors=[WEBSITE / "theory-figures" / "AlphaFlow_metric_panels.pdf"],
    )
    for name, kind in {
        "AlphaFlow_cond_marg_u_shape_profile_density.pdf": "density",
        "AlphaFlow_cond_marg_u_shape_profile_signed_budget.pdf": "signed",
        "AlphaFlow_cond_marg_u_shape_profile_linear_curve.pdf": "density",
        "AlphaFlow_cond_marg_u_shape_profile_linear_grid.pdf": "grid",
        "AlphaFlow_cond_marg_u_shape_profile.pdf": "density",
        "AlphaFlow_cond_marg_u_shape_profile_linear_comparison.pdf": "grid",
        "entropy_rate.pdf": "density",
        "entropy_tau_grid.pdf": "grid",
        "figA_theoretical_entropy.pdf": "density",
        "fig_scheduler_shapes_sigma_0.50.pdf": "grid",
        "Stepwise_gap_to_best.pdf": "grid",
    }.items():
        plot_profile(state, path=FIGURES / name, kind=kind, png=name == "entropy_tau_grid.pdf", mirrors=[WEBSITE / "theory-figures" / name])


def regenerate_figures_unused(state: SaveState, edm_rows: list[dict], alpha_rows: list[dict]) -> None:
    edm_summary = aggregate(
        [row for row in edm_rows if row.get("entropy_mode") != "conditional_minus_marginal"],
        ["mode", "scheduler", "n_steps"],
        list(EDM_METRICS),
    )
    alpha_summary = aggregate(
        alpha_rows,
        ["dataset_group", "size_group", "schedule_family", "scheduler", "n_steps"],
        list(ALPHA_METRICS),
    )
    unused_specs = [
        ("AlphaFlow_entropic_variant_comparison.pdf", "alpha_scatter"),
        ("AlphaFlow_scheduler_metric_ci_comparison.pdf", "alpha_bar"),
        ("AlphaFlow_entropy_by_dataset.pdf", "alpha_heat"),
        ("AlphaFlow_scheduler_allocation_comparison.pdf", "profile_grid"),
        ("Cond_minus_marg_entropy_overview.pdf", "profile_density"),
        ("Cross_domain_entropy_overview.pdf", "profile_density"),
        ("Cross_domain_entropy_overview_condmarg.pdf", "profile_grid"),
        ("Cross_domain_entropy_overview_log1p.pdf", "profile_grid"),
        ("EDM_scheduler_allocation_comparison.pdf", "edm_schedule"),
        ("Entropy_variant_curves.pdf", "profile_density"),
        ("Inference_time_comparison.pdf", "edm_scatter"),
        ("Metric_distributions.pdf", "edm_distribution"),
        ("Scheduler_heatmaps_deep.pdf", "edm_heat"),
        ("Snakey_scheduler_paths.pdf", "edm_schedule"),
        ("Waterfall_scheduler_improvements.pdf", "edm_bar"),
    ]
    for filename, kind in unused_specs:
        path = FIGURES_UNUSED / filename
        if kind == "alpha_scatter":
            plot_scatter(state, [row for row in alpha_summary if row["size_group"] == "All"], path=path, x_metric="rmsd_mean", y_metric="plddt_mean", domain="alpha", png=path.with_suffix(".png").exists())
        elif kind == "alpha_bar":
            plot_bar_best(state, [row for row in alpha_summary if row["size_group"] == "All"], path=path, metric="plddt_mean", metric_cfg=ALPHA_METRICS["plddt_mean"], label_key=lambda row: alpha_variant_label(row["schedule_family"], row["scheduler"]), style_key=lambda row: style_for_alpha(row["schedule_family"], row["scheduler"]))
        elif kind == "alpha_heat":
            plot_heatmap(state, [row for row in alpha_summary if row["schedule_family"] == "condmarg" and row["scheduler"] == "entropic" and row["size_group"] == "All"], path=path, metric="plddt_mean", metric_cfg=ALPHA_METRICS["plddt_mean"], x_key="n_steps", y_key="dataset_group", x_order=NFE_ORDER, y_order=["CAMEO", "ATLAS", "All"])
        elif kind.startswith("profile"):
            plot_profile(state, path=path, kind="grid" if "grid" in kind else "density", png=path.with_suffix(".png").exists())
        elif kind == "edm_schedule":
            plot_schedule_timeline(state, path=path, schedulers=["linear", "cosine", "sigmoid", "entropic", "entropic_log1p"], png=path.with_suffix(".png").exists())
        elif kind == "edm_scatter":
            plot_scatter(state, [row for row in edm_summary if row["mode"] == "ode_heun"], path=path, x_metric="infer_seconds", y_metric="fid_inception", domain="edm", png=path.with_suffix(".png").exists())
        elif kind == "edm_distribution":
            plot_distribution(state, edm_rows, path=path, metric="fid_inception", metric_cfg=EDM_METRICS["fid_inception"], group_key="scheduler", group_order=sorted({row["scheduler"] for row in edm_rows}, key=scheduler_rank), labeler=scheduler_label, png=path.with_suffix(".png").exists())
        elif kind == "edm_heat":
            plot_heatmap(state, [row for row in edm_summary if row["mode"] == "ode_heun"], path=path, metric="fid_inception", metric_cfg=EDM_METRICS["fid_inception"], x_key="n_steps", y_key="scheduler", x_order=NFE_ORDER, y_order=sorted({row["scheduler"] for row in edm_summary}, key=scheduler_rank), y_labeler=scheduler_label)
        elif kind == "edm_bar":
            plot_bar_best(state, [row for row in edm_summary if row["mode"] == "ode_heun"], path=path, metric="fid_inception", metric_cfg=EDM_METRICS["fid_inception"], label_key=lambda row: scheduler_label(row["scheduler"]), style_key=lambda row: style_for_scheduler(row["scheduler"]))


def unsupported_manifest(state: SaveState) -> None:
    existing = [*TARCHIC_CHARTS.rglob("*.pdf"), *FIGURES.rglob("*.pdf"), *FIGURES_UNUSED.rglob("*.pdf")]
    generated_names = {Path(row["path"]).name.removeprefix(PREFIX) for row in state.generated if row["path"].endswith(".pdf")}
    for path in existing:
        if path.name.startswith(PREFIX):
            continue
        if path.name in generated_names:
            continue
        reason = "source generator not present in this checkout"
        if "protein_storyboards" in path.as_posix() or "protein_evidence" in path.as_posix():
            reason = "requires original protein/PDB or storyboard renderer, not just summary CSVs"
        elif "trajectory_grid" in path.name and path.parts[0] == "figures":
            reason = "requires original image/protein trajectory renderer"
        state.skipped.append({"path": str(path.relative_to(ROOT)), "reason": reason})


def write_manifest(state: SaveState) -> None:
    counts = Counter(Path(item["path"]).suffix for item in state.generated)
    payload = {
        "prefix": PREFIX,
        "tarchic_src": str(TARCHIC_SRC),
        "generated_count": len(state.generated),
        "generated_by_suffix": dict(sorted(counts.items())),
        "skipped_count": len(state.skipped),
        "generated": state.generated,
        "skipped": state.skipped,
    }
    MANIFEST_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Overwrite existing v99-prefixed outputs.")
    args = parser.parse_args()
    state = SaveState(force=args.force, generated=[], skipped=[])
    edm_rows = load_edm_rows()
    alpha_rows = add_alpha_pooled_rows(load_alpha_rows())
    regenerate_main_figures(state, edm_rows, alpha_rows)
    regenerate_website_metric_figures(state, alpha_rows)
    regenerate_edm(state, edm_rows)
    regenerate_alpha(state, alpha_rows)
    regenerate_figures_unused(state, edm_rows, alpha_rows)
    unsupported_manifest(state)
    write_manifest(state)
    print(f"Generated {len(state.generated)} files")
    print(f"Skipped {len(state.skipped)} files or already-existing v99 outputs")
    print(MANIFEST_PATH.relative_to(ROOT))


if __name__ == "__main__":
    main()
