# Contributing to Scrumpty

Thanks for your interest in contributing! This guide explains how to propose changes, report bugs, and get your work merged.

## Ways to Contribute
- 🐛 Report bugs via GitHub Issues (include reproduction steps, expected vs actual behavior).
- ✨ Propose or build new features (open an issue first for larger changes).
- 📝 Improve documentation.
- 🎨 Enhance UI/UX or accessibility.
- 🚀 Optimize performance or developer experience.

## Development Setup
1. Fork the repo and clone your fork.
2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```
3. Create `.env.local` (see `README.md` for variables).
4. Run the dev server:
   ```bash
   npm run dev
   # or
   bun dev
   ```

## Branching & Commits
- Create a branch per change: `feature/short-name`, `fix/issue-123`, or `chore/docs`.
- Use clear commits; aim for conventional style (e.g., `feat: add sprint velocity chart`, `fix: null check on attachments`).
- Keep commits focused; avoid unrelated changes.

## Code Style
- TypeScript strict; prefer explicit types.
- Use existing shadcn/ui components and Tailwind utilities.
- Keep components small and cohesive; favor composition over inheritance.
- Prefer Server Components unless client interactivity is required.
- Validate inputs with Zod where applicable.
- Run linting before pushing:
  ```bash
  npm run lint
  ```

## Testing
- Add or update tests where meaningful (unit or integration if present).
- Manually verify critical flows you touch (auth, workspace/project/task creation, uploads, comments).

## Pull Requests
- Fill out the PR template (summary, screenshots if UI, testing done).
- Link related issues.
- Describe breaking changes and migration steps if any.
- Keep PRs scoped; avoid batching unrelated features.

## Documentation
- Update `README.md` or relevant docs when behavior or setup changes.
- For Appwrite schema changes, update `APPWRITE_GUIDE.md` accordingly.

## Code Review Expectations
- Be responsive to feedback; keep discussions respectful.
- Reviewers aim for clarity, safety, and maintainability.

## Security
- Do **not** post vulnerabilities in public issues. Email `security@scrumpty.com` or use GitHub’s Security tab.

## Release Checklist (for maintainers)
- Lint and build pass.
- Docs updated (including environment variables and schema when needed).
- Migrations or Appwrite schema changes are documented.
- Changelog updated if maintained.
