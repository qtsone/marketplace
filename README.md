# QTS Claude Code Plugin Marketplace

Official Claude Code plugin marketplace for QTS team workflows and tools.

## What's Inside

This marketplace provides curated plugins that extend Claude Code with team-specific workflows, skills, and integrations.

### Available Plugins

#### workflows

Expert skill for using the workflows-mcp MCP server to execute DAG-based workflows.

**Includes:**
- 📚 Comprehensive skill documentation for workflows-mcp usage
- 🔧 Variable resolution syntax reference
- 📖 Block executors complete reference
- ✅ Best practices and common patterns

**Keywords**: workflows, mcp, dag, automation, orchestration

**Version**: 1.0.0

## Installation

### For Team Members

Add this marketplace to your Claude Code:

```bash
/plugin marketplace add qtsone/marketplace
```

Then install plugins:

```bash
/plugin install workflows@qtsone
```

### For Claude Desktop Configuration

Add to your `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "qtsone": {
      "source": {
        "source": "github",
        "repo": "qtsone/marketplace"
      }
    }
  }
}
```

Team members will automatically have access to the marketplace.

## Available Skills

This marketplace includes the following skills bundled in plugins:

### workflows-expert (from `workflows` plugin)

Teaches Claude how to properly use the workflows-mcp MCP server for workflow orchestration.

**Activates when you mention:**
- "run a workflow" or "execute workflow"
- "list workflows" or "what workflows are available"
- Working with CI/CD pipelines, git operations
- Multi-step task orchestration

**Key capabilities:**
- ✅ Proper variable resolution syntax (4-namespace architecture)
- ✅ Conditional execution patterns
- ✅ Workflow composition
- ✅ Status checking with ADR-007 shortcuts
- ✅ Best practices and troubleshooting

**Documentation included:**
- Complete variable syntax reference
- All block executor types and their inputs/outputs
- Common workflow patterns
- Troubleshooting guide

## Contributing

To add a new plugin to this marketplace:

1. Create plugin directory in `plugins/`
2. Add `.claude-plugin/plugin.json` manifest
3. Include components (commands, agents, skills, hooks, MCP servers)
4. Update `.claude-plugin/marketplace.json`
5. Submit pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Plugin Structure

```text
plugins/
└── your-plugin/
    ├── .claude-plugin/
    │   └── plugin.json         # Required manifest
    ├── commands/               # Slash commands (optional)
    ├── agents/                 # Agent definitions (optional)
    ├── skills/                 # Skills with SKILL.md (optional)
    │   └── skill-name/
    │       ├── SKILL.md        # Required
    │       └── references/     # Reference docs (optional)
    ├── hooks/                  # Hook configurations (optional)
    └── .mcp.json              # MCP server definitions (optional)
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

For issues or questions:
- Open an issue in this repository
- Contact the QTS DevOps team
- See [workflows-mcp documentation](https://github.com/qtsone/workflows-mcp)

## Related Projects

- [workflows-mcp](https://github.com/qtsone/workflows-mcp) - DAG-based workflow orchestration MCP server
- [Claude Code](https://docs.claude.com/en/docs/claude-code) - Official documentation

---

**Made with ❤️ by the QTS Team**
