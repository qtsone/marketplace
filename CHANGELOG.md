# Changelog

All notable changes to this project will be documented in this file.

## [1.3.2](https://github.com/qtsone/marketplace/compare/v1.3.1...v1.3.2) (2025-11-02)


### Bug Fixes

* **workflows:** update mcp config ([db1894b](https://github.com/qtsone/marketplace/commit/db1894b38e539543d9fcb182b0dbd7fdfc6d7238))

## [1.3.1](https://github.com/qtsone/marketplace/compare/v1.3.0...v1.3.1) (2025-10-30)


### Bug Fixes

* **release:** update tag ([435ac04](https://github.com/qtsone/marketplace/commit/435ac040f8b526ae68e7ae779a37ee23c830abff))

# [1.3.0](https://github.com/qtsone/marketplace/compare/v1.2.0...v1.3.0) (2025-10-29)


### Features

* implement unified versioning strategy for marketplace and plugins ([4e940c8](https://github.com/qtsone/marketplace/commit/4e940c86d0482c5e6a3b83b63bcc9f2d90461b78))

# [1.2.0](https://github.com/qtsone/marketplace/compare/v1.1.0...v1.2.0) (2025-10-29)


### Bug Fixes

* add package.json with semantic-release dependencies ([965eae3](https://github.com/qtsone/marketplace/commit/965eae3dec9d52d5d66a301be7a1bdb9852348fd))
* disable default extra-plugins when using package.json ([6530167](https://github.com/qtsone/marketplace/commit/6530167518714051c3e5d601b2f53b478d0806ec))
* use configurable extra-plugins input for semantic-release ([20884b0](https://github.com/qtsone/marketplace/commit/20884b093d8f0b5dbedc4bd50150bc5e094cf05b))
* use extra-plugins for module resolution compatibility ([f77ac9e](https://github.com/qtsone/marketplace/commit/f77ac9ee478bcfabcdbeca16c2c51240594880b7))
* use package.json for semantic-release plugin management ([7f7b688](https://github.com/qtsone/marketplace/commit/7f7b68824cde6214374045ec6d0540398a9c239f))
* **workflows-expert:** correct broken example workflows and invalid syntax ([8a136b0](https://github.com/qtsone/marketplace/commit/8a136b0c3f27dcde106c0943b46fcf76513ca1b0))


### Features

* add test workflow for semantic-release action validation ([6b488ad](https://github.com/qtsone/marketplace/commit/6b488ad47c91478f4677dc954ddd845191119dcd))
* automate version management in semantic-release workflow ([bd5e8f2](https://github.com/qtsone/marketplace/commit/bd5e8f22f0c4b0540535254389879640f051564c))

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
