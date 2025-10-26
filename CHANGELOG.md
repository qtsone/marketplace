# Changelog

All notable changes to this project will be documented in this file.

# [1.1.0](https://github.com/qtsone/marketplace/compare/v1.0.0...v1.1.0) (2025-10-26)


### Features

* enhance workflows plugin with specialist agent and MCP auto-config ([1262294](https://github.com/qtsone/marketplace/commit/12622942469f774e7679be6a4da859e3375470f9))

# 1.0.0 (2025-10-26)


### Features

* enhance workflows plugin with improved documentation and structure ([16e2bb9](https://github.com/qtsone/marketplace/commit/16e2bb90ddaa83702489e99b85f78a1cee1418e0))
* initial marketplace setup with workflows-expert plugin ([d360863](https://github.com/qtsone/marketplace/commit/d360863fcd4bd0b8b64bc80f2e543483cf098667))


### BREAKING CHANGES

* Plugin renamed from workflows-expert to workflows

- Rename plugin from workflows-expert to workflows for simplicity
- Rename marketplace from qts-tools to qtsone for consistency
- Remove JavaScript pseudocode from skill documentation
- Replace with neutral MCP tool call format (Tool/Parameters/Returns)
- Add comprehensive tag-based workflow discovery examples
- Create example workflow YAML files (simple-ci, conditional-deploy, parallel-testing)
- Add grep search patterns for navigating large reference files
- Enhance "When to Activate" with natural language triggers
- Remove dist/ build artifacts (source-based distribution only)
- Add GitHub release workflow with semantic versioning
- Add CODEOWNERS and .releaserc configuration

The workflows-expert skill now emphasizes tag-based discovery as the primary
interaction pattern, aligning with workflows-mcp server capabilities.

Installation:
  /plugin marketplace add qtsone/marketplace
  /plugin install workflows@qtsone

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
