# Algorand Energy Dashboard

A dashboard for monitoring Algorand network statistics, energy consumption, and environmental impact metrics.

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Setup

**1. Install dependencies:**

```bash
# Install fetcher dependencies
cd fetcher
npm install

# Install dashboard dependencies
cd ../dashboard
npm install
```

**2. Fetch data:**

```bash
cd fetcher
npm run fetch
```

**3. Start the dashboard:**

```bash
cd dashboard
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

## Deployment

### GitHub Pages

**Setup:**

1. Enable GitHub Pages in your repository:
   - Go to Settings → Pages
   - Under "Build and deployment", set **Source** to "GitHub Actions"

2. The workflow will automatically:
   - Run daily at 2 AM UTC to fetch fresh data
   - Deploy when you push changes to `dashboard/**`
   - Can be manually triggered from the Actions tab

3. Your site will be available at `https://<your-username>.github.io/<repository-name>/`

## Acknowledgments

- Nodely for network data
- Our World in Data for carbon intensity data
