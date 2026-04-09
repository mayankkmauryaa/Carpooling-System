# GitHub Actions Setup for Neon Database Branching

This workflow automatically creates a Neon database branch for each Pull Request and deletes it when the PR is closed.

## Prerequisites

Before this workflow works, you need to configure the following in your GitHub repository:

### 1. Add Repository Variables

Go to your GitHub repository → **Settings** → **Variables and secrets** → **Variables**:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `NEON_PROJECT_ID` | Your Neon project ID | Found in Neon Dashboard → Settings → General |

### 2. Add Repository Secrets

Go to your GitHub repository → **Settings** → **Variables and secrets** → **Secrets** → **Actions**:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `NEON_API_KEY` | Your Neon API key | Found in Neon Dashboard → Settings → API Keys |

### 3. How to Find These Values

#### NEON_PROJECT_ID
1. Go to [Neon Dashboard](https://console.neon.tech)
2. Select your project
3. Click **Settings** → **General**
4. Copy the **Project ID** (looks like: `soft-name-12345678`)

#### NEON_API_KEY
1. Go to [Neon Dashboard](https://console.neon.tech)
2. Click **Settings** → **API Keys**
3. Click **Create API Key**
4. Give it a name (e.g., `github-actions`)
5. Copy the generated key (starts with: `nee....`)

### 4. Add to GitHub Repository

1. Go to your **GitHub repository**
2. Click **Settings** (top tab)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** for `NEON_API_KEY`
5. Click **New repository variable** for `NEON_PROJECT_ID`

Or via GitHub CLI:
```bash
gh secret set NEON_API_KEY --body "nee_your_api_key_here"
gh variable set NEON_PROJECT_ID --body "your_project_id_here"
```

## What the Workflow Does

### On PR Open/Update (opened, reopened, synchronize)

1. Creates a new Neon branch named `preview/pr-{number}-{branch-name}`
2. Installs npm dependencies in the backend folder
3. Runs `npx prisma generate` and `npx prisma db push`
4. Posts a schema diff comment to the PR showing database changes

### On PR Close (closed)

1. Deletes the Neon branch

## Branch Naming

Preview branches are named: `preview/pr-{PR_NUMBER}-{BRANCH_NAME}`

Examples:
- `preview/pr-123-feature-login`
- `preview/pr-45-fix-bug`
- `preview/pr-1-main`

## Environment Variables Available in Workflow

When a PR branch is created, these outputs are available:

```yaml
steps.create_neon_branch.outputs.db_url          # Direct connection string
steps.create_neon_branch.outputs.db_url_with_pooler  # Pooled connection string
```

## Customization

### Change Branch Expiration

Edit line in workflow:
```yaml
run: echo "EXPIRES_AT=$(date -u --date '+14 days' +'%Y-%m-%dT%H:%M:%SZ')" >> "$GITHUB_ENV"
```

Change `'+14 days'` to your preferred duration.

### Skip Database Migration

If you don't want automatic migrations, remove these steps:
```yaml
- name: Set DATABASE_URL for migrations
- name: Push database schema
- name: Post Schema Diff Comment to PR
```

### Add Tests After Migration

Add a job that depends on `create_neon_branch`:

```yaml
run_tests:
  name: Run Tests
  needs: create_neon_branch
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm install
      working-directory: backend
    - run: npm test
      working-directory: backend
      env:
        DATABASE_URL: ${{ needs.create_neon_branch.outputs.db_url_with_pooler }}
```

## Quick Reference

```
Neon Dashboard URL: https://console.neon.tech
Project ID Format: soft-name-12345678
API Key Format: nee_a1b2c3d4e5f6...

Your Project ID: red-pond-06172793
```

## Visual Guide

### Neon Dashboard - Project ID Location
```
Dashboard
├── Projects
│   └── Your Project
│       └── Settings (gear icon)
│           └── General
│               └── Project ID: [copy here]
```

### Neon Dashboard - API Key Location
```
Dashboard
├── Your Project
│   └── Settings (gear icon)
│       └── API Keys
│           └── Create API Key
│               └── Copy key [here]
```

### GitHub Repository - Where to Add
```
GitHub Repository
└── Settings
    └── Secrets and variables (left sidebar)
        └── Actions
            ├── Repository secrets
            │   └── NEON_API_KEY
            └── Repository variables
                └── NEON_PROJECT_ID
```

### Workflow Not Running

1. Check that the workflow file is in `.github/workflows/`
2. Verify repository variables and secrets are set
3. Check GitHub Actions tab for error logs

### Database Connection Failed

1. Ensure `NEON_PROJECT_ID` and `NEON_API_KEY` are correct
2. Check if Neon compute is active (may have scaled to zero)
3. Verify the branch was created in Neon Dashboard

### Schema Diff Not Posted

1. Ensure the workflow has `pull-requests: write` permission
2. Check Actions logs for schema-diff-action errors
