# WISPR Pill Mover

A lightweight macOS menu bar app that repositions the [WISPR Flow](https://wispr.com/) floating pill button.

WISPR Flow's pill sits at the bottom center of your screen by default and can't be moved natively. This app fixes that by letting you snap it to any corner — or keep it in the center if you prefer.

## Positions

| Shortcut | Position |
|----------|----------|
| `1` | Bottom Center *(default)* |
| `2` | Top Left |
| `3` | Top Right |
| `4` | Bottom Left |
| `5` | Bottom Right |

## Requirements

- macOS 13 (Ventura) or later
- Swift 5.9+ toolchain (Xcode 15+ or standalone)
- **Accessibility permission** — the app uses the macOS Accessibility API to find and move WISPR Flow's window. On first launch you'll be prompted to grant access in **System Settings > Privacy & Security > Accessibility**.

## Install

### From source

```bash
git clone https://github.com/YOUR_USER/wispr-pill-mover.git
cd wispr-pill-mover
make install          # builds release binary → /usr/local/bin/WisprPillMover
```

### Manual

```bash
swift build -c release
cp .build/release/WisprPillMover /usr/local/bin/
```

Then run `WisprPillMover` from any terminal, or add it to your Login Items so it starts automatically.

## Usage

Once running, a small **↕↔** icon appears in your menu bar. Click it to:

- **Pick a position** — the pill moves immediately.
- **Re-apply Position Continuously** — toggles a 3-second timer that forces the pill back if WISPR Flow resets it.
- **Move Now** — one-shot reposition.
- **List WISPR Windows (Debug)** — shows all detected WISPR Flow windows with their sizes and positions, useful for troubleshooting.

The app also watches for WISPR Flow (re)launches and automatically applies your chosen position.

## How It Works

1. Finds the running WISPR Flow process by bundle identifier or name.
2. Enumerates its windows via the **Accessibility API** (`AXUIElement`).
3. Identifies the pill as the smallest window (≤ 400 × 120 pt).
4. Computes screen-edge-aware coordinates for your chosen position.
5. Moves the window with `AXUIElementSetAttributeValue`.

## Troubleshooting

**"WISPR Flow is not running"** — Start WISPR Flow first, then click *Move Now* or relaunch WISPR Pill Mover.

**"Could not identify the pill window"** — WISPR Flow may have changed its UI. Use *List WISPR Windows (Debug)* to see what windows exist. Open an issue with the output.

**Pill moves back immediately** — Enable *Re-apply Position Continuously* to keep it in place.

**Permission dialog doesn't appear** — Open **System Settings > Privacy & Security > Accessibility**, click **+**, and add the `WisprPillMover` binary manually.

## Contributing

PRs welcome! This is a small, focused project — keep it simple.

```bash
make build   # debug build
make run     # build + run
make clean   # wipe build artifacts
```

## License

[MIT](LICENSE)
