GitHub integration
Actions
Disconnect
Your project is connected
mayankkmauryaa/Carpooling-System
We created a Neon API key for your project and added the following secrets and variables to your GitHub repository:
NEON_API_KEY
NEON_PROJECT_ID
Setting up your GitHub Actions workflow
Add the GitHub Actions workflow to your repo
In your GitHub repository, create a .yml file in your.github/workflows directory; for example: neon_workflow.yml.
Copy the following YAML contents into your neon_workflow.yml file.
Commit your changes.

The GitHub Actions workflow creates a new database branch with each pull request, which you can view on the Branches page in the Neon Console. When you close the pull request, the branch is deleted.

```
name: Create/Delete Branch for Pull Request

on:
  pull_request:
    types:
      - opened
      - reopened
      - synchronize
      - closed

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}

jobs:
  setup:
    name: Setup
    outputs:
      branch: ${{ steps.branch_name.outputs.current_branch }}
    runs-on: ubuntu-latest
    steps:
      - name: Get branch name
        id: branch_name
        uses: tj-actions/branch-names@v8

  create_neon_branch:
    name: Create Neon Branch
    outputs:
      db_url: ${{ steps.create_neon_branch_encode.outputs.db_url }}
      db_url_with_pooler: ${{ steps.create_neon_branch_encode.outputs.db_url_with_pooler }}
    needs: setup
    if: |
      github.event_name == 'pull_request' && (
      github.event.action == 'synchronize'
      || github.event.action == 'opened'
      || github.event.action == 'reopened')
    runs-on: ubuntu-latest
    steps:
      - name: Get branch expiration date as an env variable (2 weeks from now)
        id: get_expiration_date
        run: echo "EXPIRES_AT=$(date -u --date '+14 days' +'%Y-%m-%dT%H:%M:%SZ')" >> "$GITHUB_ENV"
      - name: Create Neon Branch
        id: create_neon_branch
        uses: neondatabase/create-branch-action@v6
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch_name: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
          api_key: ${{ secrets.NEON_API_KEY }}
          expires_at: ${{ env.EXPIRES_AT }}

# The step above creates a new Neon branch.
# You may want to do something with the new branch, such as run migrations, run tests
# on it, or send the connection details to a hosting platform environment.
# The branch DATABASE_URL is available to you via:
# "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}".
# It's important you don't log the DATABASE_URL as output as it contains a username and
# password for your database.
# For example, you can uncomment the lines below to run a database migration command:
#      - name: Run Migrations
#        run: npm run db:migrate
#        env:
#          # to use pooled connection
#          DATABASE_URL: "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}"
#          # OR to use unpooled connection
#          # DATABASE_URL: "${{ steps.create_neon_branch.outputs.db_url }}"

# Following the step above, which runs database migrations, you may want to check
# for schema changes in your database. We recommend using the following action to
# post a comment to your pull request with the schema diff. For this action to work,
# you also need to give permissions to the workflow job to be able to post comments
# and read your repository contents. Add the following permissions to the workflow job:
#
# permissions:
#   contents: read
#   pull-requests: write
#
# You can also check out https://github.com/neondatabase/schema-diff-action for more
# information on how to use the schema diff action.
# You can uncomment the lines below to enable the schema diff action.
#      - name: Post Schema Diff Comment to PR
#        uses: neondatabase/schema-diff-action@v1
#        with:
#          project_id: ${{ vars.NEON_PROJECT_ID }}
#          compare_branch: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
#          api_key: ${{ secrets.NEON_API_KEY }}

  delete_neon_branch:
    name: Delete Neon Branch
    needs: setup
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Delete Neon Branch
        uses: neondatabase/delete-branch-action@v3
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
          api_key: ${{ secrets.NEON_API_KEY }}

```

Show less

Copy snippet
Next steps
For more about integrating and building workflows with GitHub Actions, please refer to the Neon GitHub integration guide.
Provide feedback
Please provide feedback on your experience with this integration to help us improve it.

Submit feedback
