Stage and push changes to staging: $ARGUMENTS

1. Run `git status` and `git diff` to review what changed
2. Stage relevant files (be specific, avoid `git add .` if there are unrelated changes)
3. Write a concise commit message based on the actual diff — lead with the type (fix/add/update) and what changed
4. Commit and push to `origin staging`
5. Report the commit hash and what was pushed

Never push to `main` unless explicitly told to. If $ARGUMENTS mentions "main" or "prod", confirm before pushing.
