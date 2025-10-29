# Scripts Directory

This directory is reserved for executable scripts that support workflow operations.

## Purpose

Scripts should be used when:
- The same code is being rewritten repeatedly
- Deterministic reliability is required
- Complex workflow validation or transformation logic is needed

## Current Status

No scripts are currently required for this skill. The workflows-mcp MCP server provides all necessary functionality through its tool interface.

## Future Additions

Potential scripts that might be added:
- Workflow YAML validation utilities
- Workflow template generators
- Migration scripts for workflow format upgrades

Scripts may be executed without loading into context, making them token-efficient for repeated operations.
