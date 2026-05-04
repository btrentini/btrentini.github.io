#!/usr/bin/env python3
"""Regenerate split AlphaFlow conditional-minus-marginal theory figures."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
TARCHIC_SRC = Path.home() / "Documents" / "code" / "tarchic" / "src"
if TARCHIC_SRC.exists():
    sys.path.insert(0, str(TARCHIC_SRC))

import tarchic as tx  # noqa: E402
from tarchic.style import apply_camera_ready_style  # noqa: E402
from tarchic.theme import Theme  # noqa: E402


FIGURES_DIR = ROOT / "figures"
WEBSITE_THEORY_DIR = ROOT / "website" / "theory-figures"

COLORS = {
    "conditional": "#008b8b",
    "marginal": "#2f4858",
    "target": "#e332cf",
    "linear": "#74a4ff",
    "positive_fill": "#f4d4ee",
    "negative_fill": "#dfeaff",
    "endpoint_band": "#f5dfe6",
    "center_band": "#e5edff",
}

THEME = Theme(
    name="alphaflow_condmarg_original",
    seed_colors=[
        COLORS["conditional"],
        COLORS["marginal"],
        COLORS["target"],
        COLORS["linear"],
    ],
    categorical=[
        COLORS["conditional"],
        COLORS["marginal"],
        COLORS["target"],
        COLORS["linear"],
    ],
    continuous=[
        COLORS["marginal"],
        COLORS["conditional"],
        "#f8f8f8",
        COLORS["target"],
    ],
    background="#ffffff",
    foreground="#24272c",
    grid_color="#c7cdd4",
    grid_alpha=0.78,
    grid_linewidth_pt=0.55,
    grid_linestyle="dashed",
    axis_label_size_pt=10.0,
    tick_label_size_pt=8.0,
    legend_size_pt=7.0,
    title_size_pt=10.0,
    line_width_pt=1.35,
    marker_size_pt=3.6,
    spine_linewidth_pt=0.8,
    spine_offset_pt=1.0,
    data_margin=0.02,
    titles=False,
    font_family="STIXGeneral",
)


def profile_data(n: int = 1600) -> dict[str, np.ndarray]:
    """Deterministic bridge-shaped proxy used for the displayed diagnostic."""
    t = np.linspace(0.02, 0.98, n)
    raw_conditional = (t + 0.01) ** -1.8 + (1.0 - t + 0.01) ** -1.8
    conditional = raw_conditional / np.trapz(raw_conditional, t)
    marginal = np.ones_like(t)
    target_raw = np.clip(conditional - 0.10, 0.0, None)
    target = target_raw / np.trapz(target_raw, t)
    signed = 1.0e3 * (conditional - 1.0)
    signed += 1.25e4 * (
        np.exp(-((t - 0.025) / 0.035) ** 2)
        + np.exp(-((t - 0.975) / 0.035) ** 2)
    )
    conditional_budget = np.maximum(80.0, 7.25e2 * conditional)
    marginal_budget = np.full_like(t, 24.0)
    return {
        "t": t,
        "conditional": conditional,
        "marginal": marginal,
        "target": target,
        "signed": signed,
        "conditional_budget": conditional_budget,
        "marginal_budget": marginal_budget,
    }


def apply_common_style(ax, *, legend: bool = True) -> None:
    apply_camera_ready_style(ax, theme=THEME, venue="neurips26", title=False, legend=legend)


def add_time_bands(ax) -> None:
    ax.axvspan(0.0, 0.10, color=COLORS["endpoint_band"], alpha=0.72, lw=0, zorder=0)
    ax.axvspan(0.90, 1.0, color=COLORS["endpoint_band"], alpha=0.72, lw=0, zorder=0)
    ax.axvspan(0.40, 0.60, color=COLORS["center_band"], alpha=0.74, lw=0, zorder=0)


def plot_profile_density(ax, data: dict[str, np.ndarray], *, ylabel: str) -> None:
    t = data["t"]
    add_time_bands(ax)
    ax.plot(
        t,
        data["conditional"],
        color=COLORS["conditional"],
        linestyle=(0, (1.0, 1.6)),
        label="conditional",
    )
    ax.plot(
        t,
        data["marginal"],
        color=COLORS["marginal"],
        linestyle=(0, (5.0, 2.0)),
        label="|marginal|",
    )
    ax.plot(t, data["target"], color=COLORS["target"], label="cond-marg target")
    ax.set_xlim(0.0, 1.0)
    ax.set_ylim(0.0, 16.5)
    ax.set_xlabel("time $t$")
    ax.set_ylabel(ylabel)
    apply_common_style(ax, legend=True)


def plot_signed_budget(ax, data: dict[str, np.ndarray]) -> None:
    t = data["t"]
    signed = data["signed"]
    add_time_bands(ax)
    ax.axhline(0.0, color="#7f8791", linewidth=0.8, zorder=1)
    ax.fill_between(
        t,
        0.0,
        signed,
        where=signed >= 0.0,
        color=COLORS["positive_fill"],
        alpha=0.90,
        interpolate=True,
        label="positive signed area",
        zorder=1,
    )
    ax.fill_between(
        t,
        0.0,
        signed,
        where=signed < 0.0,
        color=COLORS["negative_fill"],
        alpha=0.88,
        interpolate=True,
        label="negative signed area",
        zorder=1,
    )
    ax.plot(
        t,
        data["conditional_budget"],
        color=COLORS["conditional"],
        linestyle=(0, (1.0, 1.6)),
        label="conditional",
        zorder=3,
    )
    ax.plot(
        t,
        data["marginal_budget"],
        color=COLORS["marginal"],
        linestyle=(0, (5.0, 2.0)),
        label="|marginal|",
        zorder=3,
    )
    ax.plot(t, signed, color=COLORS["target"], label="cond-marg target", zorder=4)
    ax.set_yscale("symlog", linthresh=60.0, linscale=0.9)
    ax.set_xlim(0.0, 1.0)
    ax.set_ylim(-80.0, 2.1e4)
    ax.set_xlabel("time $t$")
    ax.set_ylabel("signed divergence budget")
    ax.set_yticks([-50.0, 0.0, 1.0e2, 1.0e3, 1.0e4])
    ax.set_yticklabels(["-50", "0", "$10^2$", "$10^3$", "$10^4$"])
    apply_common_style(ax, legend=True)


def entropic_grid_from_density(t: np.ndarray, density: np.ndarray, n_nodes: int) -> np.ndarray:
    cdf = np.zeros_like(t)
    increments = 0.5 * (density[1:] + density[:-1]) * np.diff(t)
    cdf[1:] = np.cumsum(increments)
    cdf /= cdf[-1]
    quantiles = np.linspace(0.0, 1.0, n_nodes)
    grid = np.interp(quantiles, cdf, t)
    grid[0] = 0.0
    grid[-1] = 1.0
    return grid


def plot_scheduler_grid(ax, data: dict[str, np.ndarray]) -> None:
    add_time_bands(ax)
    regimes = [(5, 3.0), (10, 2.0), (25, 1.0)]
    for n_nodes, y in regimes:
        linear_grid = np.linspace(0.0, 1.0, n_nodes)
        condmarg_grid = entropic_grid_from_density(data["t"], data["target"], n_nodes)
        ax.vlines(linear_grid, y + 0.11, y + 0.29, color=COLORS["linear"], linewidth=0.9)
        ax.scatter(
            linear_grid,
            np.full_like(linear_grid, y + 0.20),
            s=9,
            color=COLORS["linear"],
            edgecolor="#ffffff",
            linewidth=0.35,
            zorder=4,
        )
        ax.vlines(condmarg_grid, y - 0.29, y - 0.11, color=COLORS["target"], linewidth=0.9)
        ax.scatter(
            condmarg_grid,
            np.full_like(condmarg_grid, y - 0.20),
            s=9,
            color=COLORS["target"],
            edgecolor="#ffffff",
            linewidth=0.35,
            zorder=4,
        )
    ax.plot([], [], color=COLORS["linear"], marker="o", markersize=3, label="linear grid")
    ax.plot([], [], color=COLORS["target"], marker="o", markersize=3, label="cond-marg grid")
    ax.set_xlim(0.0, 1.0)
    ax.set_ylim(0.45, 3.55)
    ax.set_xlabel("time $t$")
    ax.set_ylabel("scheduler grid")
    ax.set_yticks([1.0, 2.0, 3.0])
    ax.set_yticklabels(["25 NFE", "10 NFE", "5 NFE"])
    apply_common_style(ax, legend=True)


def one_panel(path: Path, draw) -> None:
    fig, ax = plt.subplots(figsize=tx.figure_size("neurips26", width="full", aspect=0.82))
    draw(ax)
    tx.save(fig, path)
    plt.close(fig)


def combined_profile(path: Path, data: dict[str, np.ndarray]) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(11.54, 4.9), constrained_layout=False)
    plot_profile_density(axes[0], data, ylabel="allocation density (area = 1)")
    plot_signed_budget(axes[1], data)
    tx.save(fig, path)
    plt.close(fig)


def combined_linear(path: Path, data: dict[str, np.ndarray]) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(11.54, 4.9), constrained_layout=False)
    plot_profile_density(axes[0], data, ylabel=r"$|\nabla^2 v_t|$ mean")
    plot_scheduler_grid(axes[1], data)
    tx.save(fig, path)
    plt.close(fig)


def write_caption(path: Path, text: str) -> None:
    path.with_suffix(".txt").write_text(text.rstrip() + "\n", encoding="utf-8")


def main() -> None:
    data = profile_data()
    outputs = {
        "AlphaFlow_cond_marg_u_shape_profile_density.pdf": lambda ax: plot_profile_density(
            ax, data, ylabel="allocation density (area = 1)"
        ),
        "AlphaFlow_cond_marg_u_shape_profile_signed_budget.pdf": lambda ax: plot_signed_budget(ax, data),
        "AlphaFlow_cond_marg_u_shape_profile_linear_curve.pdf": lambda ax: plot_profile_density(
            ax, data, ylabel=r"$|\nabla^2 v_t|$ mean"
        ),
        "AlphaFlow_cond_marg_u_shape_profile_linear_grid.pdf": lambda ax: plot_scheduler_grid(ax, data),
    }

    for name, draw in outputs.items():
        figure_path = FIGURES_DIR / name
        one_panel(figure_path, draw)
        shutil.copy2(figure_path, WEBSITE_THEORY_DIR / name)
        write_caption(
            WEBSITE_THEORY_DIR / name,
            "Split AlphaFlow conditional-minus-marginal theory panel generated with tarchic styling; the historical BCR callout is intentionally omitted.",
        )

    combined_profile(FIGURES_DIR / "AlphaFlow_cond_marg_u_shape_profile.pdf", data)
    combined_linear(FIGURES_DIR / "AlphaFlow_cond_marg_u_shape_profile_linear_comparison.pdf", data)
    shutil.copy2(
        FIGURES_DIR / "AlphaFlow_cond_marg_u_shape_profile.pdf",
        WEBSITE_THEORY_DIR / "AlphaFlow_cond_marg_u_shape_profile.pdf",
    )
    shutil.copy2(
        FIGURES_DIR / "AlphaFlow_cond_marg_u_shape_profile_linear_comparison.pdf",
        WEBSITE_THEORY_DIR / "AlphaFlow_cond_marg_u_shape_profile_linear_comparison.pdf",
    )

    for path in sorted(WEBSITE_THEORY_DIR.glob("AlphaFlow_cond_marg_u_shape_profile*.pdf")):
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
