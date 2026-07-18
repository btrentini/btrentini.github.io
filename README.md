# Bruno Trentini's website

Static personal website hosted at [trentini.fyi](https://trentini.fyi).

## Local preview

From the repository root, run:

```sh
python3 -m http.server 8000
```

Then open:

- `http://127.0.0.1:8000/` — leadership-focused homepage
- `http://127.0.0.1:8000/leadership.html` — executive profile and downloadable PDF
- `http://127.0.0.1:8000/projects.html` — product and modelling experiments

There is no build step. Serve the repository over HTTP so the publication and writing JSON files load correctly.
