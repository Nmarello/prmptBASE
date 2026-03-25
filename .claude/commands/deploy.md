Deploy prmptVAULT: $ARGUMENTS

Default behavior (no args or "staging"):
1. `git status` + `git diff` to review changes
2. Stage and commit with a descriptive message
3. Push to `origin staging`
4. Confirm: "Deployed to staging — https://staging.prmptvault.pages.dev"

If $ARGUMENTS contains "main", "prod", or "production":
1. Confirm with the user before proceeding
2. Push to `origin main`
3. Confirm: "Deployed to production — https://prmptvault.ai"

Never push to main without explicit confirmation. Remind Nick if there are uncommitted changes that weren't staged.
