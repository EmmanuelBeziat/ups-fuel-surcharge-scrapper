# 🚚 ups-fuel-surcharge-scrapper

Because they couldn’t provide an API. Right. https://www.ups.com/fr/fr/support/shipping-support/shipping-costs-rates/fuel-surcharges.page

## Production notes (Puppeteer/Linux)

If Puppeteer fails with missing shared libraries (for example `libnspr4.so`), install Chromium runtime dependencies on the server.

### Debian/Ubuntu

```bash
sudo apt-get update
sudo apt-get install -y \
  libnspr4 \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2
```

### Use system Chrome/Chromium (recommended in production)

Set one of these environment variables:

- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` (or your Chrome binary path)
- `PUPPETEER_BROWSER_CHANNEL=chrome` or `chromium`

Optional timeout override:

- `SCRAPER_TIMEOUT_MS=15000`
