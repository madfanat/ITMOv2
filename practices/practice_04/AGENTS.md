# ITMO Practice 4 Agents

This workspace uses a focused primary agent with automatic checks, a browser skill, and a custom MCP tool.

Rules for the agent:

- Load instructions from this file and prefer minimal, correct edits.
- Use the skill vercel-labs/agent-browser when the user asks to research a URL, navigate pages, or extract structured data from websites. Prefer it for on-demand browsing tasks.
- After any file edit, run the auto-check runner to validate the environment and surface results to the conversation.
- Use the MCP server itmo-tools for quick validations:
  - validate_readme: checks that project README and required files exist.
  - check_url: fetches a URL and returns basic metadata; fails on invalid input.
- Ask before running destructive commands and avoid changing unrelated files.

How to apply in this project:

- Use the browser skill to explore linked documentation or public resources.
- Use the MCP validate_readme tool during setup and before demos.
- Rely on the automatic check output after edits to confirm the configured environment.

MCP servers:

- itmo-tools: local Node server that exposes validate_readme and check_url.

Auto-check runner:

- .opencode/runners/auto-check.js runs basic environment checks after edits via a hook.
