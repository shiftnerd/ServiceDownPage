# service-is-down

A "We'll Be Right Back" page for when the Rewst service is down. It looks like a normal status page, but the illustration is a small click-and-find game.

Stewart the rooster is at his desk, it's raining, and something is wrong with the rack. There are 12 clues to find, and the tray in the corner tracks which ones you've got. Find them all to learn the root cause.

No build step and no dependencies. It's plain HTML, CSS and JS.

## Layout

| File | What it is |
| --- | --- |
| `index.html` | Page markup and the scene |
| `style.css` | Base page styles |
| `interactive.css` | Styles for the game layer |
| `app.js` | All the behaviour: rain, the rack puzzle, clue tracking, easter eggs |
| `assets/` | Scene art, logos, the monitor video, and voicemail audio |

## Notes

- The monitor video (`assets/the-service-is-down.mp4`) is only fetched on first click.
- Progress is kept in `sessionStorage`, so it resets when the tab closes.
- Animations respect `prefers-reduced-motion`.
- Add `?idle=1500` to the URL to shorten the idle timer when testing.
- The page uses 1920x1080 coordinates for hotspots (see `data-box` in `index.html`), so new interactive elements should be placed in those units.
