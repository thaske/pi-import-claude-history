# Demo assets

- **`record-demo.sh`** — records `demo.cast`, renders **`demo.gif`** with `agg`, then **`demo.mp4`** with `ffmpeg`.
- Dependencies: `asciinema`, `agg`, `ffmpeg`, `bash`.

Run from repository root:

```bash
chmod +x demo/record-demo.sh
./demo/record-demo.sh
```

To upload the cast to [asciinema.org](https://asciinema.org/) instead of embedding files:

```bash
asciinema upload demo/demo.cast
```
