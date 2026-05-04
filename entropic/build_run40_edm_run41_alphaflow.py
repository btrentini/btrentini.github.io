#!/usr/bin/env python3
"""Rebuild the website with the scoped evidence contract.

Contract:
- EDM evidence comes only from results/run40_rebuttal.
- AlphaFlow evidence comes only from results/run41_rebuttal.
- The website copy, tables, and figures summarize only these scoped sources.
"""

from __future__ import annotations

import csv
import json
import math
import os
import re
import shutil
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from statistics import mean, stdev

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).resolve().parent / ".mplconfig"))

try:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
except Exception:  # pragma: no cover - the data bundle is still useful without figures.
    plt = None


ROOT = Path(__file__).resolve().parents[2]
WEBSITE = ROOT / "results" / "website"
RUN40 = ROOT / "results" / "run40_rebuttal"
RUN41 = ROOT / "results" / "run41_rebuttal"
RUN41_PROTEIN_EVIDENCE = (
    RUN41 / "summary" / "entropic_neurips_evidence" / "protein_evidences"
)

DATA_DIR = WEBSITE / "data"
IMAGES_DIR = WEBSITE / "images"
PAPER_READY = WEBSITE / "PAPER_READY"

SCHEDULER_ORDER = [
    "linear",
    "entropic",
    "entropic_log1p",
    "entropic_reverse",
    "entropic_log1p_reverse",
    "cosine",
    "sigmoid",
    "log",
    "power_2",
    "power_3",
]

SCHEDULER_LABELS = {
    "linear": "Linear",
    "cosine": "Cosine",
    "power_2": "Power-2",
    "power_3": "Power-3",
    "sigmoid": "Sigmoid",
    "log": "Log",
    "entropic": "Entropic",
    "entropic_log1p": "Entropic-log1p",
    "entropic_reverse": "Entropic-reverse",
    "entropic_log1p_reverse": "Entropic-log1p-reverse",
}

SCHEDULER_COLORS = {
    "linear": "#17becf",
    "cosine": "#ff7f00",
    "power_2": "#984ea3",
    "power_3": "#377eb8",
    "sigmoid": "#999999",
    "log": "#4daf4a",
    "entropic": "#f781bf",
    "entropic_log1p": "#e35d9d",
    "entropic_reverse": "#c51b7d",
    "entropic_log1p_reverse": "#a60f64",
}

EDM_METRICS = {
    "fid_inception": {"label": "Inception FID", "direction": "lower", "fmt": ".1f"},
    "fid_pixel": {"label": "Pixel FID", "direction": "lower", "fmt": ".3f"},
    "fid": {"label": "FID", "direction": "lower", "fmt": ".1f"},
    "infer_seconds": {"label": "Seconds", "direction": "lower", "fmt": ".3f"},
}

ALPHA_METRICS = {
    "plddt_mean": {"label": "pLDDT", "direction": "higher", "fmt": ".2f"},
    "diversity": {"label": "Diversity", "direction": "higher", "fmt": ".2f"},
    "rmsd_mean": {"label": "Endpoint spread", "direction": "higher", "fmt": ".2f"},
    "invalid_rate": {"label": "Invalid rate", "direction": "lower", "fmt": ".3f"},
    "infer_seconds_per_output": {"label": "Seconds/output", "direction": "lower", "fmt": ".3f"},
    "trajectory_plddt_mean_all_frames": {
        "label": "Trajectory pLDDT",
        "direction": "higher",
        "fmt": ".2f",
    },
}


def clean_build_dirs() -> None:
    for path in [
        DATA_DIR,
        IMAGES_DIR,
        PAPER_READY,
    ]:
        if path.exists():
            shutil.rmtree(path)
    for path in WEBSITE.glob("run*_evidence"):
        if path.is_dir():
            shutil.rmtree(path)
    for path in [
        DATA_DIR,
        IMAGES_DIR / "run40_edm_atlas",
        IMAGES_DIR / "run41_alphaflow",
        IMAGES_DIR / "run41_alphaflow_protein_evidence" / "gif",
        IMAGES_DIR / "run41_alphaflow_protein_evidence" / "html",
        IMAGES_DIR / "run41_alphaflow_protein_evidence" / "pdf",
        IMAGES_DIR / "run41_alphaflow_protein_evidence" / "png",
        IMAGES_DIR / "run41_alphaflow_protein_evidence" / "diagnostics",
        IMAGES_DIR / "edm_examples",
        IMAGES_DIR / "diagnostics",
        IMAGES_DIR / "key_evidence",
        IMAGES_DIR / "run_evidence" / "run40_rebuttal",
        IMAGES_DIR / "run_evidence" / "run41_rebuttal",
        PAPER_READY / "tables",
        PAPER_READY / "latex",
        PAPER_READY / "figures" / "generated_summary",
        PAPER_READY / "figures" / "key_evidence",
        PAPER_READY / "figures" / "run41_protein_evidence",
        PAPER_READY / "figures" / "website_diagnostics",
        PAPER_READY / "interactive" / "run41_protein_evidence",
        PAPER_READY / "interpretations",
    ]:
        path.mkdir(parents=True, exist_ok=True)


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict], columns: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if columns is None:
        columns = []
        for row in rows:
            for key in row:
                if key not in columns:
                    columns.append(key)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in columns})


def number(value: object) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "null"}:
        return None
    try:
        out = float(text)
    except ValueError:
        return None
    if not math.isfinite(out):
        return None
    return out


def stat(values: list[float]) -> dict[str, float | int | None]:
    vals = [float(v) for v in values if v is not None and math.isfinite(float(v))]
    if not vals:
        return {"mean": None, "std": None, "ci": None, "n": 0}
    if len(vals) == 1:
        return {"mean": vals[0], "std": 0.0, "ci": 0.0, "n": 1}
    sd = stdev(vals)
    return {"mean": mean(vals), "std": sd, "ci": 1.96 * sd / math.sqrt(len(vals)), "n": len(vals)}


def metric_values(rows: list[dict], metrics: list[str]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for metric in metrics:
        vals = [number(row.get(metric)) for row in rows]
        out[metric] = stat([v for v in vals if v is not None])
    return out


def fmt(value: object, digits: int = 3) -> str:
    value_num = number(value)
    if value_num is None:
        return ""
    if abs(value_num) >= 100:
        return f"{value_num:.1f}"
    if abs(value_num) >= 10:
        return f"{value_num:.2f}"
    return f"{value_num:.{digits}f}"


def scheduler_label(name: str) -> str:
    return SCHEDULER_LABELS.get(name, name.replace("_", " ").title())


def alpha_family_label(family: str) -> str:
    return "cond-marg" if family == "condmarg" else "standard"


def alpha_variant_label(family: str, scheduler: str) -> str:
    return f"{scheduler_label(scheduler)} · {alpha_family_label(family)}"


def scheduler_rank(name: str) -> int:
    try:
        return SCHEDULER_ORDER.index(name)
    except ValueError:
        return len(SCHEDULER_ORDER) + 1


def dataset_group_from_name(dataset: str) -> str:
    return "ATLAS" if dataset.startswith("atlas") else "CAMEO"


def size_group_from_bin(value: str) -> str:
    if "short" in value:
        return "Short"
    if "medium" in value:
        return "Medium"
    if "long" in value or "large" in value:
        return "Large"
    return "All"


def dataset_key(dataset_group: str, size_group: str) -> str:
    prefix = "atlas" if dataset_group == "ATLAS" else "cameo"
    return f"{prefix}_{size_group.lower()}"


def normalize_edm_rows() -> list[dict]:
    source = RUN40 / "summary" / "edm_all_metrics.csv"
    rows = read_csv(source)
    website_rows = [dict(row) for row in rows]
    for row in website_rows:
        # The run40 EDM condmarg CSV records extra entropy-rate provenance.
        # Keep website data scoped to EDM metrics; source CSVs remain untouched.
        row["entropy_rate_source"] = ""
    write_csv(DATA_DIR / "run40_edm_all_metrics.csv", website_rows)
    out = []
    for row in rows:
        out.append(
            {
                "mode": row.get("mode", ""),
                "scheduler": row.get("scheduler", ""),
                "n_steps": int(float(row.get("n_steps", 0) or 0)),
                "seed": int(float(row.get("seed", 0) or 0)),
                "fid_inception": number(row.get("fid_inception")),
                "fid_pixel": number(row.get("fid_pixel")),
                "fid": number(row.get("fid")),
                "infer_seconds": number(row.get("infer_seconds")),
                "sampling_seconds": number(row.get("sampling_seconds")),
                "sigma_lt_1_count": number(row.get("sigma_lt_1_count")),
                "sigma_lt_0p1_count": number(row.get("sigma_lt_0p1_count")),
                "entropy_mode": row.get("entropy_mode", ""),
                "entropy_variant": row.get("entropy_variant", ""),
                "experiment_path": row.get("experiment_path", ""),
                "source_run": "run40_rebuttal",
            }
        )
    return out


def is_main_edm_row(row: dict) -> bool:
    return row.get("entropy_mode") != "conditional_minus_marginal"


def is_main_alpha_row(row: dict) -> bool:
    return True


def normalize_alphaflow_rows() -> list[dict]:
    rows: list[dict] = []
    for path in sorted(RUN41.glob("exp_05_alphaflow_*/metrics.rank*.csv")):
        exp = path.parent.name
        family = "condmarg" if exp.endswith("_condmarg") else "standard"
        with path.open(newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                n_endpoint = number(row.get("n_endpoint_outputs"))
                n_outputs = number(row.get("n_outputs"))
                invalid = number(row.get("invalid_structures")) or 0.0
                denom = n_endpoint or n_outputs or 1.0
                dataset = row.get("dataset", "")
                size = size_group_from_bin(row.get("protein_size_bin", ""))
                dataset_group = dataset_group_from_name(dataset)
                rows.append(
                    {
                        "source_run": "run41_rebuttal",
                        "source_file": str(path.relative_to(ROOT)),
                        "schedule_family": family,
                        "dataset_group": dataset_group,
                        "size_group": size,
                        "dataset": dataset,
                        "sample_name": row.get("sample_name", ""),
                        "sample_index": int(float(row.get("sample_index", row.get("batch_index", 0)) or 0)),
                        "seq_len": int(float(row.get("seq_len", 0) or 0)),
                        "scheduler": row.get("scheduler", ""),
                        "n_steps": int(float(row.get("n_steps", 0) or 0)),
                        "seed": int(float(row.get("seed", 0) or 0)),
                        "requested_entropy_mode": row.get("requested_entropy_mode", ""),
                        "plddt_mean": number(row.get("plddt_mean")),
                        "diversity": number(row.get("diversity")),
                        "rmsd_mean": number(row.get("rmsd_mean")),
                        "invalid_rate": invalid / denom,
                        "invalid_structures": invalid,
                        "infer_seconds_per_output": number(row.get("infer_seconds_per_output")),
                        "infer_seconds_per_model_output": number(row.get("infer_seconds_per_model_output")),
                        "trajectory_plddt_mean_all_frames": number(row.get("trajectory_plddt_mean_all_frames")),
                        "n_outputs": n_outputs,
                        "n_endpoint_outputs": n_endpoint,
                    }
                )
    write_csv(DATA_DIR / "run41_alphaflow_all_metrics.csv", rows)
    return rows


def grouped_summary(
    rows: list[dict],
    key_fields: list[str],
    metrics: list[str],
    scheduler_field: str = "scheduler",
) -> list[dict]:
    grouped: dict[tuple, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[tuple(row.get(field, "") for field in key_fields)].append(row)
    out = []
    for key, subset in grouped.items():
        record = dict(zip(key_fields, key))
        if "n_steps" in record:
            record["n_steps"] = int(record["n_steps"])
        scheduler = str(record.get(scheduler_field, ""))
        record["scheduler_label"] = scheduler_label(scheduler)
        if "schedule_family" in record:
            record["scheduler_variant_label"] = alpha_variant_label(str(record.get("schedule_family", "")), scheduler)
        record["metric_values"] = metric_values(subset, metrics)
        out.append(record)
    out.sort(
        key=lambda row: (
            str(row.get("mode", "")),
            str(row.get("schedule_family", "")),
            str(row.get("dataset_group", "")),
            str(row.get("size_group", "")),
            int(row.get("n_steps", 0)),
            scheduler_rank(str(row.get("scheduler", ""))),
        )
    )
    return out


def alpha_summary(rows: list[dict]) -> list[dict]:
    expanded = []
    for row in rows:
        for dataset_group in ["All", row["dataset_group"]]:
            for size_group in ["All", row["size_group"]]:
                item = dict(row)
                item["dataset_group"] = dataset_group
                item["size_group"] = size_group
                expanded.append(item)
    return grouped_summary(
        expanded,
        ["schedule_family", "scheduler", "n_steps", "dataset_group", "size_group"],
        list(ALPHA_METRICS),
    )


def make_matrix_records(
    edm_baseline_summary: list[dict],
    alpha_rows: list[dict],
) -> list[dict]:
    records: list[dict] = []
    for row in edm_baseline_summary:
        for evidence_set in ["primary", "run40_rebuttal"]:
            records.append(
                {
                    "evidence_set": evidence_set,
                    "domain": "edm",
                    "dataset_key": "edm",
                    "n_steps": row["n_steps"],
                    "edm_mode": row["mode"],
                    "alpha_family": "any",
                    "scheduler": row["scheduler"],
                    "metric_values": {
                        metric: row["metric_values"][metric]
                        for metric in ["fid_inception", "fid_pixel", "infer_seconds"]
                    },
                }
            )

    for row in alpha_rows:
        if row["dataset_group"] == "All":
            continue
        key = dataset_key(row["dataset_group"], row["size_group"])
        for evidence_set in ["primary", "run41_rebuttal"]:
            records.append(
                {
                    "evidence_set": evidence_set,
                    "domain": "alphaflow",
                    "dataset_key": key,
                    "n_steps": row["n_steps"],
                    "edm_mode": "any",
                    "alpha_family": row["schedule_family"],
                    "scheduler": row["scheduler"],
                    "metric_values": {
                        metric: row["metric_values"][metric]
                        for metric in [
                            "plddt_mean",
                            "diversity",
                            "rmsd_mean",
                            "invalid_rate",
                            "infer_seconds_per_output",
                        ]
                    },
                }
            )
    return records


def leaderboard_rows(summary_edm: list[dict], summary_alpha: list[dict]) -> list[dict]:
    out: list[dict] = []

    def add_group(domain: str, source_run: str, context_group: str, context: str, rows: list[dict], metrics: dict):
        for metric, cfg in metrics.items():
            candidates = []
            for row in rows:
                stat_obj = row.get("metric_values", {}).get(metric, {})
                if stat_obj.get("n", 0) > 0 and stat_obj.get("mean") is not None:
                    candidates.append((row, stat_obj))
            if not candidates:
                continue
            reverse = cfg["direction"] == "higher"
            candidates.sort(key=lambda item: item[1]["mean"], reverse=reverse)
            winner, winner_stat = candidates[0]
            runner, runner_stat = candidates[1] if len(candidates) > 1 else ({}, {})
            advantage = None
            if runner_stat:
                if reverse:
                    advantage = winner_stat["mean"] - runner_stat["mean"]
                    separated = winner_stat["mean"] - (winner_stat.get("ci") or 0) > runner_stat["mean"] + (runner_stat.get("ci") or 0)
                else:
                    advantage = runner_stat["mean"] - winner_stat["mean"]
                    separated = winner_stat["mean"] + (winner_stat.get("ci") or 0) < runner_stat["mean"] - (runner_stat.get("ci") or 0)
            else:
                separated = False
            out.append(
                {
                    "domain": domain,
                    "source_run": source_run,
                    "context_group": context_group,
                    "context": context,
                    "metric": metric,
                    "metric_label": cfg["label"],
                    "metric_fmt": cfg["fmt"],
                    "direction": cfg["direction"],
                    "winner": winner["scheduler"],
                    "winner_label": scheduler_label(winner["scheduler"]),
                    "winner_value": winner_stat["mean"],
                    "winner_ci": winner_stat.get("ci"),
                    "winner_n": winner_stat.get("n"),
                    "winner_is_entropic": str(winner["scheduler"]).startswith("entropic"),
                    "runner_up": runner.get("scheduler") if runner else None,
                    "runner_up_label": scheduler_label(runner.get("scheduler", "")) if runner else None,
                    "runner_up_value": runner_stat.get("mean") if runner_stat else None,
                    "runner_up_ci": runner_stat.get("ci") if runner_stat else None,
                    "advantage": advantage,
                    "ci_separates_runner_up": separated,
                }
            )

    for mode in sorted({row["mode"] for row in summary_edm}):
        for n_steps in sorted({row["n_steps"] for row in summary_edm}):
            rows = [row for row in summary_edm if row["mode"] == mode and row["n_steps"] == n_steps]
            add_group("EDM", "run40_rebuttal", mode, f"{mode} / {n_steps} NFE", rows, EDM_METRICS)

    for family in ["condmarg", "standard"]:
        for dataset in ["All", "ATLAS", "CAMEO"]:
            for size in ["All", "Short", "Medium", "Large"]:
                for n_steps in [5, 10, 25]:
                    rows = [
                        row
                        for row in summary_alpha
                        if row["schedule_family"] == family
                        and row["dataset_group"] == dataset
                        and row["size_group"] == size
                        and row["n_steps"] == n_steps
                    ]
                    if rows:
                        add_group(
                            "AlphaFlow",
                            "run41_rebuttal",
                            family,
                            f"{family} / {dataset} / {size} / {n_steps} NFE",
                            rows,
                            ALPHA_METRICS,
                        )
    return out


def paired_deltas_edm(edm_rows: list[dict]) -> list[dict]:
    out: list[dict] = []
    for mode in sorted({row["mode"] for row in edm_rows}):
        for n_steps in [5, 10, 25]:
            base = {
                row["seed"]: row
                for row in edm_rows
                if row["mode"] == mode
                and row["n_steps"] == n_steps
                and row["scheduler"] == "linear"
                and row["entropy_mode"] != "conditional_minus_marginal"
            }
            schedulers = sorted(
                {
                    row["scheduler"]
                    for row in edm_rows
                    if row["mode"] == mode and row["n_steps"] == n_steps and row["scheduler"] != "linear"
                },
                key=scheduler_rank,
            )
            for scheduler in schedulers:
                subset = [
                    row
                    for row in edm_rows
                    if row["mode"] == mode and row["n_steps"] == n_steps and row["scheduler"] == scheduler
                ]
                for metric, cfg in EDM_METRICS.items():
                    deltas = []
                    wins = 0
                    for row in subset:
                        baseline = base.get(row["seed"])
                        if not baseline:
                            continue
                        a = number(row.get(metric))
                        b = number(baseline.get(metric))
                        if a is None or b is None:
                            continue
                        delta = (a - b) if cfg["direction"] == "higher" else (b - a)
                        deltas.append(delta)
                        wins += int(delta > 0)
                    if deltas:
                        out.append(
                            {
                                "domain": "EDM",
                                "mode": mode,
                                "n_steps": n_steps,
                                "metric": metric,
                                "metric_label": cfg["label"],
                                "scheduler": scheduler,
                                "scheduler_label": scheduler_label(scheduler),
                                "delta_good": stat(deltas),
                                "win_rate": wins / len(deltas),
                            }
                        )
    return out


def paired_deltas_alpha(rows: list[dict]) -> list[dict]:
    standard = [row for row in rows if row["schedule_family"] == "standard"]
    out: list[dict] = []
    for dataset in ["ATLAS", "CAMEO"]:
        for size in ["Short", "Medium", "Large"]:
            for n_steps in [5, 10, 25]:
                base = {
                    (row["sample_name"], row["seed"]): row
                    for row in standard
                    if row["dataset_group"] == dataset
                    and row["size_group"] == size
                    and row["n_steps"] == n_steps
                    and row["scheduler"] == "linear"
                }
                schedulers = sorted(
                    {
                        row["scheduler"]
                        for row in standard
                        if row["dataset_group"] == dataset
                        and row["size_group"] == size
                        and row["n_steps"] == n_steps
                        and row["scheduler"] != "linear"
                    },
                    key=scheduler_rank,
                )
                for scheduler in schedulers:
                    subset = [
                        row
                        for row in standard
                        if row["dataset_group"] == dataset
                        and row["size_group"] == size
                        and row["n_steps"] == n_steps
                        and row["scheduler"] == scheduler
                    ]
                    for metric, cfg in ALPHA_METRICS.items():
                        deltas = []
                        wins = 0
                        for row in subset:
                            baseline = base.get((row["sample_name"], row["seed"]))
                            if not baseline:
                                continue
                            a = number(row.get(metric))
                            b = number(baseline.get(metric))
                            if a is None or b is None:
                                continue
                            delta = (a - b) if cfg["direction"] == "higher" else (b - a)
                            deltas.append(delta)
                            wins += int(delta > 0)
                        if deltas:
                            out.append(
                                {
                                    "domain": "AlphaFlow",
                                    "schedule_family": "standard",
                                    "dataset_group": dataset,
                                    "size_group": size,
                                    "n_steps": n_steps,
                                    "metric": metric,
                                    "metric_label": cfg["label"],
                                    "scheduler": scheduler,
                                    "scheduler_label": scheduler_label(scheduler),
                                    "delta_good": stat(deltas),
                                    "win_rate": wins / len(deltas),
                                }
                            )
    return out


def table_rows_from_summary(summary_rows: list[dict], metrics: dict) -> list[dict]:
    out = []
    for row in summary_rows:
        base = {k: row[k] for k in row if k != "metric_values"}
        for metric, cfg in metrics.items():
            stat_obj = row.get("metric_values", {}).get(metric, {})
            if stat_obj.get("n", 0):
                item = dict(base)
                item.update(
                    {
                        "metric": metric,
                        "metric_label": cfg["label"],
                        "direction": cfg["direction"],
                        "mean": stat_obj.get("mean"),
                        "ci95": stat_obj.get("ci"),
                        "n": stat_obj.get("n"),
                    }
                )
                out.append(item)
    return out


def completion_audit() -> list[dict]:
    rows = []
    for exp in sorted(RUN41.glob("exp_05_alphaflow_*")):
        if not exp.is_dir():
            continue
        rank_files = sorted(exp.glob("metrics.rank*.csv"))
        rank_rows = sum(max(0, len(read_csv(path))) for path in rank_files)
        metrics = exp / "metrics.csv"
        expected = ""
        if "large_std" in exp.name:
            expected = "990" if "atlas" in exp.name else "1710"
        rows.append(
            {
                "experiment": exp.name,
                "family": "condmarg" if exp.name.endswith("_condmarg") else "standard",
                "dataset": "ATLAS" if "atlas" in exp.name else "CAMEO",
                "size": "Large" if "large" in exp.name else ("Medium" if "medium" in exp.name else "Short"),
                "rank_csv_count": len(rank_files),
                "rank_rows": rank_rows,
                "has_metrics_csv": metrics.exists(),
                "metrics_csv_rows": len(read_csv(metrics)) if metrics.exists() else 0,
                "expected_full_rows": expected,
                "status": "complete" if metrics.exists() else "partial_rank_csv_only",
                "source_run": "run41_rebuttal",
            }
        )
    return rows


def safe_title(path: Path) -> str:
    title = path.stem
    title = re.sub(r"^(figures__|added_analysis__)", "", title)
    return title.replace("_", " ")


def plot_type_for_name(name: str) -> str:
    lower = name.lower()
    if "trajectory" in lower or "example" in lower:
        return "trajectory/sample"
    if "entropy" in lower or "allocation" in lower or "schedule" in lower:
        return "schedule/entropy"
    if "time" in lower or "infer" in lower:
        return "runtime"
    if "fid" in lower or "metric" in lower or "heatmap" in lower:
        return "metric"
    return "diagnostic"


def copy_edm_figures() -> tuple[list[dict], list[dict]]:
    atlas: list[dict] = []
    examples: list[dict] = []
    source_dirs = [RUN40 / "summary" / "figures", RUN40 / "summary" / "added_analysis"]
    dest = IMAGES_DIR / "run40_edm_atlas"
    for source_dir in source_dirs:
        if not source_dir.exists():
            continue
        for png in sorted(source_dir.glob("*.png")):
            if "edm" not in png.name.lower():
                continue
            prefix = source_dir.name
            out_name = f"{prefix}__{png.name}"
            out_png = dest / out_name
            shutil.copy2(png, out_png)
            pdf_src = png.with_suffix(".pdf")
            pdf_rel = None
            if pdf_src.exists():
                out_pdf = dest / f"{prefix}__{pdf_src.name}"
                shutil.copy2(pdf_src, out_pdf)
                pdf_rel = str(out_pdf.relative_to(WEBSITE))
            is_condmarg_ablation = any(
                token in png.name.lower()
                for token in ("cond_marg", "cond-marg", "cond marg")
            )
            analysis = "Run40 EDM diagnostic generated from the accepted EDM source run."
            conclusion = "Use this as EDM mechanism or visual support alongside the run40 FID and runtime tables."
            tags = ["Run40", "EDM", plot_type_for_name(png.name)]
            if is_condmarg_ablation:
                tags.append("Supplemental EDM ablation")
                analysis = (
                    "Supplemental Run40 EDM conditional-minus-marginal ablation diagnostic. "
                    "It is shown as historical visual context only; these rows are excluded "
                    "from the main EDM summaries, tables, and charts."
                )
                conclusion = (
                    "Do not use this panel as main EDM evidence. Main EDM evidence uses "
                    "the standard/log1p run40 rows after excluding conditional-minus-marginal EDM ablations."
                )
            item = {
                "run": "run40_rebuttal",
                "domain": "EDM",
                "title": safe_title(out_png),
                "src": str(out_png.relative_to(WEBSITE)),
                "pdf_src": pdf_rel,
                "source": str(png.relative_to(ROOT)),
                "source_dir": str(source_dir.relative_to(ROOT)),
                "plot_type": plot_type_for_name(png.name),
                "tags": tags,
                "dataset_focus": ["EDM"],
                "analysis": analysis,
                "conclusion": conclusion,
            }
            atlas.append(item)

    example_dir = RUN40 / "summary" / "edm_seed_examples"
    if example_dir.exists():
        for png in sorted(example_dir.glob("*.png")):
            out_png = IMAGES_DIR / "edm_examples" / png.name
            shutil.copy2(png, out_png)
            item = {
                "title": safe_title(png),
                "src": str(out_png.relative_to(WEBSITE)),
                "mode": "ode_heun" if "ode" in png.name else "",
                "n_steps": 25 if "25" in png.name else "",
                "seed": "",
                "source": str(png.relative_to(ROOT)),
                "dataset_focus": ["EDM"],
                "plot_type": "trajectory/sample",
                "analysis": "Generated EDM sample evidence copied from run40 only.",
                "conclusion": "Use it as visual support for the run40 EDM metric tables.",
            }
            examples.append(item)
    return atlas, examples


def plot_alpha_metric(summary_alpha: list[dict], family: str, metric: str, out_name: str, title: str) -> dict | None:
    if plt is None:
        return None
    rows = [
        row
        for row in summary_alpha
        if row["schedule_family"] == family and row["dataset_group"] in {"ATLAS", "CAMEO"} and row["size_group"] == "All"
    ]
    if not rows:
        return None
    fig, axes = plt.subplots(1, 2, figsize=(11, 4), sharey=False)
    for ax, dataset in zip(axes, ["ATLAS", "CAMEO"]):
        subset = [row for row in rows if row["dataset_group"] == dataset]
        for scheduler in sorted({row["scheduler"] for row in subset}, key=scheduler_rank):
            points = sorted([row for row in subset if row["scheduler"] == scheduler], key=lambda r: r["n_steps"])
            xs = [row["n_steps"] for row in points]
            ys = [row["metric_values"][metric]["mean"] for row in points]
            ax.plot(xs, ys, marker="o", label=scheduler_label(scheduler), color=SCHEDULER_COLORS.get(scheduler))
        ax.set_title(dataset)
        ax.set_xlabel("NFE")
        ax.grid(True, alpha=0.25)
    axes[0].set_ylabel(ALPHA_METRICS[metric]["label"])
    axes[-1].legend(fontsize=8, frameon=False, loc="best")
    fig.suptitle(title)
    fig.tight_layout()
    out_png = IMAGES_DIR / "run41_alphaflow" / out_name
    out_pdf = out_png.with_suffix(".pdf")
    fig.savefig(out_png, dpi=180)
    fig.savefig(out_pdf)
    plt.close(fig)
    for extra_dir in [
        IMAGES_DIR / "diagnostics",
        PAPER_READY / "figures" / "generated_summary",
        PAPER_READY / "figures" / "website_diagnostics",
    ]:
        shutil.copy2(out_png, extra_dir / out_png.name)
        shutil.copy2(out_pdf, extra_dir / out_pdf.name)
    return {
        "title": title,
        "src": str(out_png.relative_to(WEBSITE)),
        "pdf_src": str(out_pdf.relative_to(WEBSITE)),
        "source": "results/run41_rebuttal/exp_05_alphaflow_*/metrics.rank*.csv",
        "tags": ["Run41", "AlphaFlow", family, plot_type_for_name(out_name)],
        "dataset_focus": ["ATLAS", "CAMEO"],
        "plot_type": "metric",
        "analysis": f"Run41 AlphaFlow {family} {ALPHA_METRICS[metric]['label']} summarized from rank CSV rows.",
        "conclusion": "This is an AlphaFlow figure derived from run41 rank CSV metrics.",
    }


def generate_alpha_figures(summary_alpha: list[dict]) -> list[dict]:
    specs = [
        ("condmarg", "plddt_mean", "run41_alphaflow_condmarg_plddt_mean.png", "Run41 AlphaFlow cond-marg pLDDT"),
        ("condmarg", "diversity", "run41_alphaflow_condmarg_diversity.png", "Run41 AlphaFlow cond-marg diversity"),
        ("condmarg", "rmsd_mean", "run41_alphaflow_condmarg_endpoint_spread.png", "Run41 AlphaFlow cond-marg endpoint spread"),
        ("standard", "plddt_mean", "run41_alphaflow_standard_plddt_mean.png", "Run41 AlphaFlow standard pLDDT"),
        ("standard", "infer_seconds_per_output", "run41_alphaflow_standard_seconds_per_output.png", "Run41 AlphaFlow standard seconds/output"),
    ]
    out = []
    for family, metric, filename, title in specs:
        item = plot_alpha_metric(summary_alpha, family, metric, filename, title)
        if item:
            out.append(item)
    for item in out[:3]:
        src = WEBSITE / item["src"]
        shutil.copy2(src, IMAGES_DIR / "key_evidence" / src.name)
    return out


def rel(path: Path) -> str:
    return path.relative_to(WEBSITE).as_posix()


def copy_asset(src: Path, dest_dir: Path) -> str | None:
    if not src.exists():
        return None
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / src.name
    shutil.copy2(src, dest)
    return rel(dest)


def protein_step_and_sample(path: Path) -> tuple[int, str] | None:
    match = re.search(r"_(\d+)steps_(.+?)_construction\.gif$", path.name)
    if not match:
        return None
    return int(match.group(1)), match.group(2)


def protein_sample_metadata(root: Path) -> dict[str, dict[str, str]]:
    path = root / "AlphaFlow_variant_suite_protein_evolution_metadata.csv"
    if not path.exists():
        return {}
    metadata: dict[str, dict[str, str]] = {}
    for row in read_csv(path):
        sample = row.get("sample_name", "")
        if sample and sample not in metadata:
            metadata[sample] = row
    return metadata


def path_text_relative_to_root(value: str) -> str:
    if not value:
        return value
    path = Path(value)
    if not path.is_absolute():
        return value
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return value


def dataset_focus_from_metadata(row: dict[str, str]) -> str:
    dataset = row.get("dataset", "")
    if dataset.startswith("atlas"):
        return "ATLAS"
    if dataset.startswith("cameo"):
        return "CAMEO"
    return "AlphaFlow"


def copy_run41_protein_evidence() -> tuple[list[dict], list[dict], dict[str, int]]:
    root = RUN41_PROTEIN_EVIDENCE
    if not root.exists():
        return [], [], {"gif": 0, "html": 0, "pdf": 0, "png": 0}

    source_control = root / "cond-marg" / "control"
    source_diagnostics = root / "cond-marg" / "diagnostics"
    dest_root = IMAGES_DIR / "run41_alphaflow_protein_evidence"
    run_dest = IMAGES_DIR / "run_evidence" / "run41_rebuttal"
    paper_dest = PAPER_READY / "figures" / "run41_protein_evidence"
    interactive_dest = PAPER_READY / "interactive" / "run41_protein_evidence"

    sample_meta: dict[str, dict[str, str]] = {}
    if (root / "AlphaFlow_variant_suite_protein_evolution_metadata.csv").exists():
        metadata_rows = read_csv(root / "AlphaFlow_variant_suite_protein_evolution_metadata.csv")
        for row in metadata_rows:
            row["pdb_path"] = path_text_relative_to_root(row.get("pdb_path", ""))
            if row.get("structure_source") == "standard_saved_structure_with_cond_marg_schedule_times":
                row["structure_source"] = "run41_condmarg_saved_structure_with_cond_marg_schedule_times"
            sample = row.get("sample_name", "")
            if sample and sample not in sample_meta:
                sample_meta[sample] = row
        write_csv(DATA_DIR / "run41_protein_evidence_metadata.csv", metadata_rows)
    if (root / "AlphaFlow_variant_suite_protein_evolution_manifest.json").exists():
        manifest = json.loads((root / "AlphaFlow_variant_suite_protein_evolution_manifest.json").read_text(encoding="utf-8"))
        manifest["run_dir"] = "results/run41_rebuttal"
        manifest["cond_marg_structure_note"] = (
            "Run41 protein evidence uses saved run41 conditional-minus-marginal AlphaFlow structures."
        )
        manifest.pop("visual_inspiration", None)
        manifest["evidence_style_note"] = (
            "The copied website assets are rendered from run41 saved structure frames and use a consistent storyboard/GIF presentation."
        )
        manifest["outputs"] = [
            str(Path(path).resolve().relative_to(ROOT)) if Path(path).is_absolute() else path
            for path in manifest.get("outputs", [])
        ]
        (DATA_DIR / "run41_protein_evidence_manifest.json").write_text(
            json.dumps(manifest, indent=2) + "\n",
            encoding="utf-8",
        )

    counts = {"gif": 0, "html": 0, "pdf": 0, "png": 0}
    for kind in counts:
        for src in sorted((source_control / kind).glob(f"*.{kind}")):
            copy_asset(src, dest_root / kind)
            counts[kind] += 1
            if kind in {"gif", "png", "pdf"}:
                copy_asset(src, paper_dest / kind)
            if kind == "html":
                copy_asset(src, interactive_dest / kind)

    protein_items: list[dict] = []
    for gif in sorted((source_control / "gif").glob("*.gif")):
        parsed = protein_step_and_sample(gif)
        if not parsed:
            continue
        n_steps, sample = parsed
        base = f"AlphaFlow_entropic_cond_marg_protein_evolution_{n_steps}steps"
        meta = sample_meta.get(sample, {})
        focus = dataset_focus_from_metadata(meta)
        protein_size = meta.get("protein_size", "")
        gif_src = copy_asset(gif, dest_root / "gif")
        run_src = copy_asset(gif, run_dest)
        if not gif_src:
            continue
        pdf_2d = copy_asset(source_control / "pdf" / f"{base}_2d_{sample}.pdf", dest_root / "pdf")
        pdf_3d = copy_asset(source_control / "pdf" / f"{base}_3d_{sample}.pdf", dest_root / "pdf")
        png_2d = copy_asset(source_control / "png" / f"{base}_2d_{sample}.png", dest_root / "png")
        png_3d = copy_asset(source_control / "png" / f"{base}_3d_{sample}.png", dest_root / "png")
        html_src = copy_asset(source_control / "html" / f"{base}_3d.html", dest_root / "html")
        item = {
            "run": "run41_rebuttal",
            "domain": "AlphaFlow",
            "title": f"Run41 AlphaFlow cond-marg construction {n_steps} steps: {focus} {protein_size} {sample}",
            "src": gif_src,
            "run_evidence_src": run_src or gif_src,
            "html_src": html_src,
            "pdf_2d_src": pdf_2d,
            "pdf_3d_src": pdf_3d,
            "png_2d_src": png_2d,
            "png_3d_src": png_3d,
            "source": str(gif.relative_to(ROOT)),
            "plot_type": "protein construction GIF",
            "tags": ["Run41", "AlphaFlow", "condmarg", "protein", "GIF", focus, protein_size],
            "dataset_focus": [focus],
            "sample_name": sample,
            "n_steps": n_steps,
            "seq_len": meta.get("seq_len", ""),
            "protein_size": protein_size,
            "analysis": (
                f"Run41 cond-marg control trajectory for {sample}, rendered from saved run41 PDB frames "
                f"with the run41 storyboard/GIF evidence style."
            ),
            "conclusion": (
                "This is run41 AlphaFlow evidence generated from run41 saved PDB frames."
            ),
            "why": "Run41 AlphaFlow protein-construction evidence generated from cond-marg saved PDB frames.",
        }
        protein_items.append(item)

    diagnostic_items: list[dict] = []
    for png in sorted(source_diagnostics.glob("*.png")):
        png_src = copy_asset(png, dest_root / "diagnostics")
        run_src = copy_asset(png, run_dest)
        if not png_src:
            continue
        pdf_src = copy_asset(png.with_suffix(".pdf"), dest_root / "diagnostics")
        title = safe_title(png).replace("AlphaFlow entropic cond marg ", "Run41 AlphaFlow cond-marg ")
        diagnostic_items.append(
            {
                "run": "run41_rebuttal",
                "domain": "AlphaFlow",
                "title": title,
                "src": png_src,
                "run_evidence_src": run_src or png_src,
                "pdf_src": pdf_src,
                "source": str(png.relative_to(ROOT)),
                "plot_type": "protein schedule diagnostic",
                "tags": ["Run41", "AlphaFlow", "condmarg", "protein", "schedule/entropy"],
                "dataset_focus": ["ATLAS", "CAMEO"],
                "analysis": "Run41 cond-marg schedule diagnostic emitted by the protein-evidence renderer.",
                "conclusion": "Use this alongside the run41 protein GIFs and HTML viewers to inspect schedule placement.",
            }
        )

    return protein_items, diagnostic_items, counts


def table_html(rows: list[dict], columns: list[str], max_rows: int = 30) -> str:
    body = []
    for row in rows[:max_rows]:
        body.append("<tr>" + "".join(f"<td>{row.get(col, '')}</td>" for col in columns) + "</tr>")
    return "<table><thead><tr>" + "".join(f"<th>{col}</th>" for col in columns) + "</tr></thead><tbody>" + "".join(body) + "</tbody></table>"


def latex_table(path: Path, title: str, rows: list[dict], columns: list[str], max_rows: int = 12) -> dict:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "% Auto-generated by build_run40_edm_run41_alphaflow.py",
        "\\begin{tabular}{" + "l" * len(columns) + "}",
        "\\toprule",
        " & ".join(columns).replace("_", "\\_") + r" \\",
        "\\midrule",
    ]
    for row in rows[:max_rows]:
        values = [str(row.get(col, "")).replace("_", "\\_") for col in columns]
        lines.append(" & ".join(values) + r" \\")
    lines += ["\\bottomrule", "\\end{tabular}", ""]
    latex = "\n".join(lines)
    path.write_text(latex, encoding="utf-8")
    return {
        "filename": path.name,
        "path": str(path.relative_to(WEBSITE)),
        "title": title,
        "group": "Run40 EDM" if "edm" in path.name else ("Run41 AlphaFlow" if "alphaflow" in path.name else "Source policy"),
        "suggested_placement": "Manuscript evidence appendix",
        "data_source": "run40 EDM only" if "edm" in path.name else ("run41 AlphaFlow only" if "alphaflow" in path.name else "scoped provenance ledger"),
        "interpretation": "Generated under the run40-EDM/run41-AlphaFlow evidence contract.",
        "caption": title,
        "label": path.stem,
        "rendered_html": table_html(rows, columns),
        "latex": latex,
    }


def build_paper_ready(
    edm_summary_table: list[dict],
    alpha_summary_table: list[dict],
    completion_rows: list[dict],
) -> list[dict]:
    tables_dir = PAPER_READY / "tables"
    latex_dir = PAPER_READY / "latex"

    write_csv(tables_dir / "edm_run40_metric_summary.csv", edm_summary_table)
    write_csv(tables_dir / "alphaflow_run41_metric_summary.csv", alpha_summary_table)
    write_csv(tables_dir / "run41_alphaflow_completion_audit.csv", completion_rows)
    policy_rows = [
        {"domain": "EDM", "ground_truth_run": "run40_rebuttal", "allowed_source": "results/run40_rebuttal/summary/edm_all_metrics.csv", "main_filter": "entropy_mode != conditional_minus_marginal"},
        {"domain": "AlphaFlow", "ground_truth_run": "run41_rebuttal", "allowed_source": "results/run41_rebuttal/exp_05_alphaflow_*/metrics.rank*.csv", "main_filter": "all run41 AlphaFlow scheduler variants included"},
    ]
    write_csv(tables_dir / "source_policy.csv", policy_rows)

    edm_ode = [r for r in edm_summary_table if r.get("mode") == "ode_heun" and r.get("metric") == "fid_inception"]
    edm_sde = [r for r in edm_summary_table if r.get("mode") == "sde_heun" and r.get("metric") == "fid_inception"]
    alpha_plddt = [
        r
        for r in alpha_summary_table
        if r.get("metric") == "plddt_mean"
        and r.get("dataset_group") in {"ATLAS", "CAMEO"}
        and r.get("size_group") == "All"
    ]
    alpha_size = [
        r
        for r in alpha_summary_table
        if r.get("metric") == "plddt_mean"
        and r.get("dataset_group") in {"ATLAS", "CAMEO"}
        and r.get("size_group") in {"Short", "Medium", "Large"}
        and r.get("n_steps") == 25
    ]

    for rows in [edm_ode, edm_sde, alpha_plddt, alpha_size]:
        for row in rows:
            row["mean_ci"] = f"{fmt(row.get('mean'))} +/- {fmt(row.get('ci95'))}"

    paper_tables = [
        latex_table(
            latex_dir / "table_edm_run40_ode_fid.tex",
            "Run40 EDM ODE FID summary",
            edm_ode,
            ["mode", "scheduler", "n_steps", "mean_ci", "n"],
        ),
        latex_table(
            latex_dir / "table_edm_run40_sde_fid.tex",
            "Run40 EDM SDE FID summary",
            edm_sde,
            ["mode", "scheduler", "n_steps", "mean_ci", "n"],
        ),
        latex_table(
            latex_dir / "table_alphaflow_run41_endpoint_scorecard.tex",
            "Run41 AlphaFlow endpoint pLDDT scorecard",
            alpha_plddt,
            ["schedule_family", "dataset_group", "scheduler_variant_label", "n_steps", "mean_ci", "n"],
        ),
        latex_table(
            latex_dir / "table_alphaflow_run41_size_plddt.tex",
            "Run41 AlphaFlow pLDDT by protein size",
            alpha_size,
            ["schedule_family", "dataset_group", "size_group", "scheduler_variant_label", "mean_ci", "n"],
        ),
        latex_table(
            latex_dir / "table_source_policy.tex",
            "Scoped source policy",
            policy_rows,
            ["domain", "ground_truth_run", "allowed_source", "main_filter"],
        ),
    ]
    (latex_dir / "README_tables.tex").write_text(
        "% Auto-generated scoped table bundle.\n"
        "% EDM rows are sourced only from run40_rebuttal; AlphaFlow rows are sourced only from run41_rebuttal.\n",
        encoding="utf-8",
    )
    (PAPER_READY / "README.txt").write_text(
        "PAPER_READY evidence pack\n"
        f"Generated: {datetime.now().isoformat(timespec='seconds')}\n\n"
        "Primary data convention:\n"
        "- EDM numeric evidence: results/run40_rebuttal/summary/edm_all_metrics.csv\n"
        "- AlphaFlow numeric evidence: results/run41_rebuttal/exp_05_alphaflow_* metrics.rank*.csv\n"
        "- Website analysis scope: run40 EDM and run41 AlphaFlow.\n\n"
        "Important files:\n"
        "- tables/edm_run40_metric_summary.csv\n"
        "- tables/alphaflow_run41_metric_summary.csv\n"
        "- tables/run41_alphaflow_completion_audit.csv\n"
        "- tables/source_policy.csv\n"
        "- latex/*.tex\n"
        "- figures/run41_protein_evidence/{gif,png,pdf}/*\n"
        "- interactive/run41_protein_evidence/html/*.html\n",
        encoding="utf-8",
    )
    (PAPER_READY / "interpretations" / "figure_interpretations.txt").write_text(
        "All website figures obey the scoped source policy: run40 for EDM, run41 for AlphaFlow.\n"
        "AlphaFlow figures are regenerated from run41 rank CSV metrics.\n"
        "Run41 protein-construction GIFs/HTML/PDFs are newly rendered from run41 cond-marg saved PDB frames.\n",
        encoding="utf-8",
    )
    return paper_tables


def evidence_tables(edm_table: list[dict], alpha_table: list[dict], completion_rows: list[dict]) -> list[dict]:
    def pack(title: str, group: str, run: str, note: str, source: str, rows: list[dict], limit: int = 400) -> dict:
        columns = []
        for row in rows:
            for key in row:
                if key not in columns:
                    columns.append(key)
        return {
            "title": title,
            "group": group,
            "run": run,
            "note": note,
            "source": source,
            "columns": columns,
            "row_count": len(rows),
            "visible_row_count": min(len(rows), limit),
            "rows": rows[:limit],
        }

    policy_rows = [
        {"domain": "EDM", "ground_truth_run": "run40_rebuttal", "included_source": "results/run40_rebuttal/summary/edm_all_metrics.csv", "main_filter": "entropy_mode != conditional_minus_marginal"},
        {"domain": "AlphaFlow", "ground_truth_run": "run41_rebuttal", "included_source": "results/run41_rebuttal/exp_05_alphaflow_*/metrics.rank*.csv", "main_filter": "all run41 AlphaFlow scheduler variants included"},
    ]
    return [
        pack("Run40 EDM metric summary", "Run40 EDM", "Run40", "Grouped FID/runtime summary.", "results/website/PAPER_READY/tables/edm_run40_metric_summary.csv", edm_table),
        pack("Run41 AlphaFlow metric summary", "Run41 AlphaFlow", "Run41", "Grouped endpoint summary from run41 rank CSVs.", "results/website/PAPER_READY/tables/alphaflow_run41_metric_summary.csv", alpha_table),
        pack("Run41 AlphaFlow completion audit", "Run41 AlphaFlow", "Run41", "Rank CSV and merged metrics coverage by experiment.", "results/website/PAPER_READY/tables/run41_alphaflow_completion_audit.csv", completion_rows),
        pack("Scoped source policy", "Source policy", "Run40/Run41", "Ground-truth source ledger.", "results/website/PAPER_READY/tables/source_policy.csv", policy_rows),
    ]


def run_counts(run: Path, domain: str, copied_figures: list[dict]) -> dict:
    if domain == "EDM":
        rank_files = sorted(run.glob("exp_02*_edm*/metrics.rank*.csv"))
        metric_files = sorted(run.glob("exp_02*_edm*/metrics.csv"))
        summary_csv_files = sorted((run / "summary").glob("*edm*.csv")) if (run / "summary").exists() else []
    else:
        rank_files = sorted(run.glob("exp_05_alphaflow_*/metrics.rank*.csv"))
        metric_files = sorted(run.glob("exp_05_alphaflow_*/metrics.csv"))
        summary_csv_files = sorted((run / "summary").glob("*alphaflow*.csv")) if (run / "summary").exists() else []
    rank_rows = sum(max(0, len(read_csv(path))) for path in rank_files)
    pdf_assets = {
        fig.get(key)
        for fig in copied_figures
        for key in ["pdf_src", "pdf_2d_src", "pdf_3d_src"]
        if fig.get(key)
    }
    html_assets = {fig.get("html_src") for fig in copied_figures if fig.get("html_src")}
    return {
        "rank_csv_files": len(rank_files),
        "rank_csv_rows": rank_rows,
        "experiment_metric_csv_files": len(metric_files),
        "summary_csv_files": len(summary_csv_files),
        "summary_csv_rows": 0,
        "png_figures": sum(1 for fig in copied_figures if fig.get("src", "").endswith(".png")),
        "gif_figures": sum(1 for fig in copied_figures if fig.get("src", "").endswith(".gif")),
        "pdf_figures": len(pdf_assets),
        "html_files": len(html_assets),
        "text_or_json_evidence_files": len(list(run.glob("*.json"))) + len(list(run.glob("*.txt"))),
        "submitted_job_rows": len(read_csv(run / "submitted_job_ids.tsv")) if (run / "submitted_job_ids.tsv").exists() else 0,
    }


def experiment_in_domain(name: str, experiment: dict, domain: str) -> bool:
    text = " ".join(str(experiment.get(key, "")) for key in ["name", "path", "experiment_path"])
    text = f"{name} {text}".lower()
    if domain == "EDM":
        return "edm" in text
    return "alphaflow" in text


def manifest_summary(run: Path, domain: str) -> dict:
    path = run / "run_manifest.json"
    if not path.exists():
        return {"available": False}
    data = json.loads(path.read_text(encoding="utf-8"))
    experiments = {
        name: exp
        for name, exp in data.get("experiments", {}).items()
        if isinstance(exp, dict) and experiment_in_domain(name, exp, domain)
    }
    statuses = Counter(exp.get("status", "unknown") for exp in experiments.values())
    rows = sum(int(exp.get("rows") or 0) for exp in experiments.values())
    return {
        "available": True,
        "scope": domain,
        "created_at": data.get("created_at"),
        "experiment_count": len(experiments),
        "status_counts": dict(statuses),
        "manifest_metric_rows": rows,
        "corrections": data.get("corrections", []),
    }


def build_site_data() -> dict:
    clean_build_dirs()
    edm_rows = normalize_edm_rows()
    alpha_rows = normalize_alphaflow_rows()

    edm_main_rows = [row for row in edm_rows if is_main_edm_row(row)]
    alpha_main_rows = [row for row in alpha_rows if is_main_alpha_row(row)]
    edm_summary_main = grouped_summary(edm_main_rows, ["mode", "scheduler", "n_steps"], list(EDM_METRICS))
    alpha_summary_rows = alpha_summary(alpha_main_rows)

    edm_summary_table = table_rows_from_summary(edm_summary_main, EDM_METRICS)
    alpha_summary_table = table_rows_from_summary(alpha_summary_rows, ALPHA_METRICS)
    completion_rows = completion_audit()
    write_csv(DATA_DIR / "run40_edm_summary.csv", edm_summary_table)
    write_csv(DATA_DIR / "run41_alphaflow_summary.csv", alpha_summary_table)
    write_csv(DATA_DIR / "run41_alphaflow_completion_audit.csv", completion_rows)

    edm_atlas, edm_examples = copy_edm_figures()
    alpha_figures = generate_alpha_figures(alpha_summary_rows)
    protein_figures, protein_diagnostics, protein_counts = copy_run41_protein_evidence()
    diagnostics = edm_atlas + alpha_figures + protein_figures + protein_diagnostics
    key_figures = []
    for item in alpha_figures[:3]:
        copied = dict(item)
        src = Path(item["src"])
        copied["src"] = str((Path("images") / "key_evidence" / src.name).as_posix())
        copied["priority"] = "featured"
        copied["why"] = "Run41 AlphaFlow key metric diagnostic generated from run41 rank CSV rows."
        key_figures.append(copied)
    for item in [fig for fig in protein_figures if fig.get("n_steps") == 25][:2]:
        copied = dict(item)
        copied["priority"] = "featured"
        copied["why"] = "Run41 AlphaFlow cond-marg construction GIF generated from saved run41 PDB frames."
        key_figures.append(copied)
    key_figures.extend(edm_atlas[:2])

    for item in edm_atlas:
        src = WEBSITE / item["src"]
        shutil.copy2(src, IMAGES_DIR / "diagnostics" / src.name)
        if item.get("pdf_src"):
            pdf = WEBSITE / item["pdf_src"]
            shutil.copy2(pdf, IMAGES_DIR / "diagnostics" / pdf.name)
        run_dest = IMAGES_DIR / "run_evidence" / "run40_rebuttal" / src.name
        shutil.copy2(src, run_dest)
    for item in alpha_figures:
        src = WEBSITE / item["src"]
        run_dest = IMAGES_DIR / "run_evidence" / "run41_rebuttal" / src.name
        shutil.copy2(src, run_dest)

    paper_tables = build_paper_ready(edm_summary_table, alpha_summary_table, completion_rows)

    evidence = {
        "cards": [
            {"kicker": "Run40 EDM", "value": str(len(edm_main_rows)), "label": "main metric rows", "detail": "EDM scorecards, paired deltas, and summary charts exclude conditional-minus-marginal ablation rows."},
            {"kicker": "Run41 AlphaFlow", "value": str(len(alpha_main_rows)), "label": "main rank CSV metric rows", "detail": "AlphaFlow scorecards and generated plots include raw cond-marg and log1p-damped cond-marg rows as main protein evidence."},
            {"kicker": "Scoped build", "value": "2", "label": "ground-truth runs", "detail": "The website summary is built from run40 EDM and run41 AlphaFlow sources."},
            {"kicker": "Run41 large standard", "value": "partial", "label": "rank CSV comparator coverage", "detail": "Large standard jobs timed out but retained rank CSV rows; they are marked as partial comparator evidence."},
        ],
        "leaderboard": leaderboard_rows(edm_summary_main, alpha_summary_rows),
        "tables": evidence_tables(edm_summary_table, alpha_summary_table, completion_rows),
        "coverage": completion_rows,
    }

    run40_figs = [
        {
            **item,
            "run": "run40_rebuttal",
            "run_label": "Run40",
            "src": str(Path("images") / "run_evidence" / "run40_rebuttal" / Path(item["src"]).name),
        }
        for item in edm_atlas
    ]
    run41_metric_figs = [
        {
            **item,
            "run": "run41_rebuttal",
            "run_label": "Run41",
            "src": str(Path("images") / "run_evidence" / "run41_rebuttal" / Path(item["src"]).name),
        }
        for item in alpha_figures
    ]
    run41_protein_figs = [
        {
            **item,
            "run": "run41_rebuttal",
            "run_label": "Run41",
            "src": item.get("run_evidence_src", item.get("src", "")),
        }
        for item in protein_figures + protein_diagnostics
    ]
    run41_figs = run41_metric_figs + run41_protein_figs

    datasets = [
        {"key": "edm", "label": "EDM / CIFAR-10", "short_label": "EDM", "domain": "edm", "dataset_group": "EDM", "size_group": "Overall", "metrics": ["fid_inception", "fid_pixel", "infer_seconds"]},
    ]
    for dg in ["ATLAS", "CAMEO"]:
        for size in ["All", "Short", "Medium", "Large"]:
            datasets.append(
                {
                    "key": dataset_key(dg, size),
                    "label": f"{dg} / {size}",
                    "short_label": f"{dg} {size}",
                    "domain": "alphaflow",
                    "dataset_group": dg,
                    "size_group": size,
                    "metrics": ["plddt_mean", "diversity", "rmsd_mean", "invalid_rate", "infer_seconds_per_output"],
                }
            )

    source_status = {
        "edm_rows": len(edm_main_rows),
        "edm_supplemental_condmarg_rows": len(edm_rows) - len(edm_main_rows),
        "alphaflow_rows": len(alpha_main_rows),
        "alphaflow_log1p_rows_included": sum(1 for row in alpha_rows if row.get("scheduler") == "entropic_log1p"),
        "run41_standard_dirs": [row for row in completion_rows if row["family"] == "standard"],
        "run41_condmarg_dirs": [row for row in completion_rows if row["family"] == "condmarg"],
        "run41_alphaflow_rows_deduped": len(alpha_main_rows),
        "run41_alphaflow_raw_rank_rows": len(alpha_rows),
        "run40_edm_atlas_figures": len(edm_atlas),
        "run41_generated_alpha_figures": len(alpha_figures),
        "run41_protein_evidence_gifs": protein_counts.get("gif", 0),
        "run41_protein_evidence_html": protein_counts.get("html", 0),
        "run41_protein_evidence_pdfs": protein_counts.get("pdf", 0),
        "run41_protein_evidence_pngs": protein_counts.get("png", 0),
        "scoped_runs": ["run40_rebuttal", "run41_rebuttal"],
    }

    return {
        "metadata": {
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "edm_source": "results/run40_rebuttal/summary/edm_all_metrics.csv",
            "alphaflow_source": "results/run41_rebuttal/exp_05_alphaflow_*/metrics.rank*.csv",
            "notes": [
                "EDM ground truth is run40_rebuttal.",
                "Main EDM summaries exclude run40 conditional-minus-marginal EDM ablation rows.",
                "AlphaFlow ground truth is run41_rebuttal.",
                "Main AlphaFlow summaries include raw cond-marg and log1p-damped cond-marg rows; read log1p AlphaFlow rows with their explicit family label.",
                "AlphaFlow rmsd_mean is displayed as endpoint spread/pairwise RMSD, not reference accuracy RMSD.",
                "The website build summarizes only run40 EDM and run41 AlphaFlow evidence.",
                "Run41 standard large AlphaFlow rows are partial rank-CSV comparator evidence because the large standard Slurm jobs timed out.",
            ],
            "scheduler_order": SCHEDULER_ORDER,
            "scheduler_labels": SCHEDULER_LABELS,
            "scheduler_colors": SCHEDULER_COLORS,
            "solver_colors": {"ode_heun": "#6f8191", "sde_heun": "#b18a6a"},
            "source_status": source_status,
        },
        "metrics": {"edm": EDM_METRICS, "alphaflow": ALPHA_METRICS},
        "summary": {"edm": edm_summary_main, "alphaflow": alpha_summary_rows},
        "paired_deltas": {"edm": paired_deltas_edm(edm_main_rows), "alphaflow": paired_deltas_alpha(alpha_main_rows)},
        "raw": {"edm": edm_rows, "alphaflow": alpha_rows},
        "figures": {
            "key": key_figures,
            "diagnostics": diagnostics,
            "protein_evidence": protein_figures,
            "protein_diagnostics": protein_diagnostics,
            "edm_examples": edm_examples,
        },
        "paper_tables": paper_tables,
        "evidence": evidence,
        "runs": {
            "ledger": [
                {
                    "run": "run40_rebuttal",
                    "label": "Run40",
                    "path": "results/run40_rebuttal",
                    "role": "Accepted EDM ground-truth source.",
                    "primary_use": "Primary EDM metric rows, EDM figures, and EDM sample grids.",
                    "caveat": "Used for EDM numeric evidence and EDM figure evidence in this website build.",
                    "counts": run_counts(RUN40, "EDM", edm_atlas),
                    "manifest": manifest_summary(RUN40, "EDM"),
                    "representative_artifacts": [
                        "results/run40_rebuttal/summary/edm_all_metrics.csv",
                        "results/run40_rebuttal/summary/figures/*EDM*.png",
                    ],
                },
                {
                    "run": "run41_rebuttal",
                    "label": "Run41",
                    "path": "results/run41_rebuttal",
                    "role": "Accepted AlphaFlow ground-truth source.",
                    "primary_use": "Primary AlphaFlow endpoint metrics and generated AlphaFlow plots.",
                    "caveat": "Large standard jobs are partial rank-CSV comparator evidence; cond-marg large jobs completed.",
                    "counts": run_counts(RUN41, "AlphaFlow", alpha_figures + protein_figures + protein_diagnostics),
                    "manifest": manifest_summary(RUN41, "AlphaFlow"),
                    "representative_artifacts": [
                        "results/run41_rebuttal/exp_05_alphaflow_*/metrics.rank*.csv",
                        "results/run41_rebuttal/exp_05_alphaflow_*/metrics.csv",
                        "results/run41_rebuttal/summary/entropic_neurips_evidence/protein_evidences/cond-marg/control/gif/*.gif",
                        "results/run41_rebuttal/summary/entropic_neurips_evidence/protein_evidences/cond-marg/control/html/*.html",
                        "results/run41_rebuttal/summary/entropic_neurips_evidence/protein_evidences/cond-marg/control/pdf/*.pdf",
                    ],
                },
            ],
            "figures": run40_figs + run41_figs,
        },
        "matrix": {
            "evidence_sets": [
                {"key": "primary", "label": "Primary: run40 EDM + run41 AlphaFlow"},
                {"key": "run40_rebuttal", "label": "Run40 EDM only"},
                {"key": "run41_rebuttal", "label": "Run41 AlphaFlow only"},
            ],
            "n_steps": [5, 10, 25],
            "alpha_families": ["condmarg", "standard"],
            "edm_modes": ["ode_heun", "sde_heun"],
            "datasets": datasets,
            "metrics": {"edm": EDM_METRICS, "alphaflow": ALPHA_METRICS},
            "records": make_matrix_records(edm_summary_main, alpha_summary_rows),
            "dataset_notes": {},
            "coverage": completion_rows,
            "analysis_principles": [
                "Use run40 for EDM and run41 for AlphaFlow.",
                "AlphaFlow claims use run41 endpoint metrics and run41 protein-construction evidence.",
                "Read partial run41 large standard rows as comparator evidence, not as completed-job evidence.",
            ],
        },
        "figure_atlas": {
            "run40_edm_figures": edm_atlas,
            "run41_alphaflow": {
                "source_note": "Run41 AlphaFlow plots are generated from run41 rank CSV metrics.",
                "figures": alpha_figures,
            },
            "run41_protein_evidence": {
                "source_note": "Run41 AlphaFlow protein GIF/HTML/PDF evidence is rendered from run41 cond-marg saved PDB frames.",
                "figures": protein_figures,
                "diagnostics": protein_diagnostics,
            },
        },
    }


def main() -> None:
    data = build_site_data()
    (DATA_DIR / "site_data.js").write_text(
        "window.RESULTS_DATA = " + json.dumps(data, indent=2, allow_nan=False) + ";\n",
        encoding="utf-8",
    )
    (PAPER_READY / "manifest.json").write_text(
        json.dumps(
            {
                "generated_at": data["metadata"]["generated_at"],
                "output": "results/website/PAPER_READY",
                "edm_rows_run40": data["metadata"]["source_status"]["edm_rows"],
                "alphaflow_rows_run41": data["metadata"]["source_status"]["alphaflow_rows"],
                "run41_protein_evidence": {
                    "gifs": data["metadata"]["source_status"].get("run41_protein_evidence_gifs", 0),
                    "html": data["metadata"]["source_status"].get("run41_protein_evidence_html", 0),
                    "pdfs": data["metadata"]["source_status"].get("run41_protein_evidence_pdfs", 0),
                    "pngs": data["metadata"]["source_status"].get("run41_protein_evidence_pngs", 0),
                },
                "tables": sorted(path.name for path in (PAPER_READY / "tables").glob("*.csv")),
                "latex_tables": sorted(path.name for path in (PAPER_READY / "latex").glob("*.tex")),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print("rebuilt", WEBSITE)
    print("edm rows", data["metadata"]["source_status"]["edm_rows"])
    print("alphaflow rows", data["metadata"]["source_status"]["alphaflow_rows"])
    print("edm figures", data["metadata"]["source_status"]["run40_edm_atlas_figures"])
    print("alpha figures", data["metadata"]["source_status"]["run41_generated_alpha_figures"])


if __name__ == "__main__":
    main()
