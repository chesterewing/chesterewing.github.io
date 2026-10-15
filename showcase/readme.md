# Showcase folder

This is where I drop website demos so they show up on **/showcase.html** automatically.

## Adding a new demo (3 steps)

1. **Drop the website folder here** under `/showcase/`. Example:
   ```
   /showcase/
       my-cafe-site/
           index.html
           style.css
           preview.jpg     ← optional thumbnail (1200x630 ideal)
   ```
   The folder name = the **slug** I'll use in the manifest.

2. **Edit `index.json`** in this folder. Add a new entry to the `items[]` array:
   ```json
   {
     "slug": "my-cafe-site",
     "title": "Cafe Landing Page",
     "category": "Landing Page",
     "description": "Single-page site for a cafe — menu, hours, click-to-call.",
     "price": "₱4,500",
     "preview": "preview.jpg",
     "tags": ["HTML", "CSS", "Responsive"],
     "buyUrl": "mailto:ce.columna404@gmail.com?subject=Buying%20Cafe%20Landing%20Page"
   }
   ```

3. **Refresh `/showcase.html`** — the card appears.

## Light source-code "protection" (optional)

To discourage casual right-click / DevTools snooping inside a demo, add this just before `</body>` in the demo's `index.html`:

```html
<script src="../../js/protect.js"></script>
```

⚠️ **Heads-up:** This is theatre. The browser must download the source to render the page, so anyone determined enough can still grab the code (Network tab, View Source via URL, etc.). It only stops drive-by copying. For real IP protection, use a server-side render or sell the code via a paid handoff.

## Running locally

`fetch()` doesn't work on `file://` in most browsers — so opening `showcase.html` directly will show "Could not load showcase". Run a tiny local server instead:

```
cd c:\Users\programmer\Desktop\web
python -m http.server 8000
```

Then visit http://localhost:8000/showcase.html
