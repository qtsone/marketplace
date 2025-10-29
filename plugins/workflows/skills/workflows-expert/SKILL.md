---
name: workflows-expert
description: Activate for workflow execution, CI/CD pipelines, git operations, or multi-step task orchestration. Provides workflows-mcp MCP server integration with tag-based workflow discovery, DAG-based execution, and variable syntax expertise. Use when requests mention "run workflow", "execute workflow", "orchestrate tasks", "automate CI/CD", "multi-step process", or "workflow information".
---

# Workflows MCP Expert Skill

Activate for workflow execution, multi-step task orchestration, and workflows-mcp MCP server operations.

## Activation Triggers

Activate when requests mention:
- "run a workflow" or "execute workflow"
- "list workflows" or "what workflows are available"
- "orchestrate multi-step tasks" or "DAG execution"
- "CI/CD pipeline", "git automation", "automated testing"
- "workflow information" or "workflow details"
- Multi-step task coordination with dependencies
- "Chain multiple commands" or "automate my workflow"

Common user phrases:
- "I need to run tests before deploying"
- "Create a multi-step build pipeline"
- "Execute this only if the previous step succeeds"
- "Run these tasks in parallel"
- "Automate my CI/CD workflow"

## Core Workflow Pattern

**Standard execution pattern: Discover → Inspect → Execute**

### Step 1: Discover Workflows by Tags

**Always use tag-based discovery** instead of guessing workflow names.

```text
Tool: list_workflows
Parameters:
  tags: ['python', 'ci']  # AND logic - workflows with BOTH tags
  format: 'markdown'
Returns: List of matching workflow names
```

**Common tag combinations:**
- **Python**: `['python']`, `['python', 'testing']`, `['python', 'ci']`
- **Git**: `['git']`, `['git', 'commit']`, `['git', 'checkout']`
- **CI/CD**: `['ci']`, `['ci', 'deployment']`
- **TDD**: `['tdd']`, `['tdd', 'phase1']`, `['tdd', 'implementation']`

### Step 2: Get Workflow Information

**Call before executing** to understand required inputs and workflow structure:

```text
Tool: get_workflow_info
Parameters:
  workflow: 'python-ci-pipeline'
  format: 'markdown'
Returns: Workflow structure, required inputs, outputs, blocks
```

### Step 3: Execute Workflow

```text
Tool: execute_workflow
Parameters:
  workflow: 'python-ci-pipeline'
  inputs: {project_path: '/path/to/project'}
  response_format: 'minimal'
Returns: {status: 'success', outputs: {...}}
```

**Response status values:**
- `'success'` - Workflow completed successfully
- `'failure'` - Workflow failed (check `error` field)
- `'paused'` - Workflow paused for user input (Prompt blocks)

## Available MCP Tools

The workflows-mcp server provides these tools:

### Discovery & Information

**list_workflows(tags, format)** - Discover workflows by tags
- Filter by tags with AND logic: `tags=['python', 'testing']`
- Format: `json` or `markdown`
- Returns workflow names only

**get_workflow_info(workflow, format)** - Get detailed workflow information
- Shows inputs, outputs, blocks, dependencies
- Format: `json` or `markdown`
- Call before executing to understand requirements

### Execution

**execute_workflow(workflow, inputs, response_format)** - Execute registered workflow
- Provide required inputs from get_workflow_info()
- Response format: `minimal` (recommended) or `detailed` (debugging only)
- Returns execution status and outputs

**execute_inline_workflow(workflow_yaml, inputs, response_format)** - Execute YAML directly
- Execute workflow without registration
- Useful for one-off or custom workflows
- Validate first with validate_workflow_yaml()

**validate_workflow_yaml(yaml_content)** - Validate workflow YAML before execution
- Catches syntax errors early
- Returns validation errors with helpful messages
- Always validate inline workflows before execution

### Checkpoint Management

**resume_workflow(checkpoint_id, response, response_format)** - Resume paused workflow
- Used for interactive workflows with Prompt blocks
- Provide user response to prompt
- Continue from saved checkpoint

**list_checkpoints(workflow_name, format)** - View saved checkpoints
- Filter by workflow name (optional)
- Shows pause and automatic checkpoints

**get_checkpoint_info(checkpoint_id, format)** - Inspect checkpoint details
- View checkpoint state before resuming
- See progress and context

**delete_checkpoint(checkpoint_id)** - Clean up old checkpoints
- Remove paused workflows no longer needed

## Variable Syntax Overview

All variables use explicit four-namespace architecture:

### 1. Inputs Namespace
Access workflow input parameters:
```yaml
{{inputs.project_name}}
{{inputs.workspace}}
{{inputs.environment}}
```

### 2. Metadata Namespace
Access workflow execution metadata:
```yaml
{{metadata.workflow_name}}
{{metadata.start_time}}
{{metadata.execution_id}}
```

### 3. Blocks Namespace
Access block execution results (most commonly used):

**Block outputs:**
```yaml
{{blocks.run_tests.outputs.exit_code}}
{{blocks.create_file.outputs.path}}
```

**Block status (use for 90% of conditional cases):**
```yaml
{{blocks.test.succeeded}}    # True if completed successfully
{{blocks.build.failed}}      # True if failed (any reason)
{{blocks.optional.skipped}}  # True if skipped by condition
```

## Common Patterns

### Pattern 1: Conditional Execution Based on Success

```yaml
blocks:
  - id: run_tests
    type: Shell
    inputs:
      command: pytest tests/

  - id: deploy
    type: Shell
    inputs:
      command: ./deploy.sh
    condition: "{{blocks.run_tests.succeeded}}"
    depends_on: [run_tests]
```

### Pattern 2: Workflow Composition

```yaml
blocks:
  - id: ci_pipeline
    type: Workflow
    inputs:
      workflow: "python-ci-pipeline"
      inputs:
        project_path: "{{inputs.workspace}}"
```

### Pattern 3: Parallel Execution

```yaml
blocks:
  - id: unit_tests
    type: Shell
    inputs:
      command: "pytest tests/unit/"

  - id: integration_tests
    type: Shell
    inputs:
      command: "pytest tests/integration/"

  # Both run in parallel (no dependencies)
```

## Creating Inline Workflows

For one-off tasks, create and execute inline workflows:

```yaml
name: custom-task
description: Custom workflow for specific task

inputs:
  target:
    type: string
    required: true

blocks:
  - id: step1
    type: Shell
    inputs:
      command: "echo Processing {{inputs.target}}"

  - id: step2
    type: Shell
    inputs:
      command: "echo Done"
    depends_on: [step1]
    condition: "{{blocks.step1.succeeded}}"

outputs:
  result: "{{blocks.step2.outputs.stdout}}"
```

Execute with execute_inline_workflow tool.

## Best Practices

1. **Tag-based discovery** - Use list_workflows(tags=[...]) instead of guessing workflow names
2. **Check workflow info first** - Call get_workflow_info() to understand requirements
3. **Explicit namespaces** - Use inputs.*, blocks.*, metadata.* consistently
4. **Boolean shortcuts** - Prefer .succeeded over .outputs.exit_code == 0
5. **Minimal response format** - Use response_format='minimal' unless debugging
6. **Validate inline workflows** - Use validate_workflow_yaml() before execution
7. **Handle execution responses** - Check status field: 'success' or 'failure'

## Troubleshooting

### Variable Resolution Errors
- Verify proper namespace: `{{inputs.*}}`, `{{blocks.*}}`, `{{metadata.*}}`
- Check block IDs match exactly (case-sensitive)
- Ensure blocks complete before referencing outputs (use depends_on)

### Execution Failures
- Check `error` field in response for details
- Use `response_format: "detailed"` for block-level debugging
- Verify required inputs are provided
- Validate condition syntax

### Workflow Not Found
- Use list_workflows() to see available workflows
- Check workflow name spelling (case-sensitive)
- Verify MCP server connection

## Reference Documentation

For detailed information beyond core workflows, load reference files using the Read tool as needed:

### Variable Syntax Reference
**File**: `references/variable-syntax.md`

**Load when:** Resolving variable syntax errors, understanding the complete four-namespace architecture, debugging variable resolution issues, or learning advanced variable patterns.

**Contains:** Complete variable resolution rules, recursive resolution examples, cross-block references, common mistakes, debugging techniques, and comprehensive variable type information.

### Block Executors Reference
**File**: `references/block-executors.md`

**Load when:** Understanding available block types (Shell, Workflow, CreateFile, ReadFile, etc.), checking input/output specifications for each block type, learning block execution patterns, or troubleshooting block-specific issues.

**Contains:** Complete reference for all block types, input/output specifications, execution states, status vs outcome distinction, common block patterns, and troubleshooting guides.

### Complete Workflow Examples
**File**: `references/examples.md`

**Load when:** Implementing complex multi-stage workflows, building parallel execution pipelines, creating file processing workflows, designing interactive approval workflows, or learning advanced patterns like retry logic and error handling.

**Contains:** Full workflow examples with documentation including tag-based discovery examples, multi-stage deployment pipelines, parallel testing with aggregation, file processing pipelines, interactive deployments with approval steps, and common usage patterns.

## Bundled Assets

### Example Workflow Templates
**Directory**: `examples/`

**Available templates:**
- `simple-ci-pipeline.yaml` - Basic CI pipeline with sequential execution
- `conditional-deploy.yaml` - Environment-based deployment with conditions
- `parallel-testing.yaml` - Parallel test execution with result aggregation

**Usage:** Copy and modify these YAML templates for custom workflows. Execute using execute_inline_workflow tool with the template content.

## Summary

The workflows-mcp server enables powerful workflow orchestration through:

1. **Tag-based discovery** - Find workflows by purpose, not by guessing names
2. **Workflow inspection** - Understand requirements before execution
3. **DAG-based execution** - Automatic dependency resolution and parallel execution
4. **Conditional logic** - Boolean shortcuts for clean workflow conditions
5. **Workflow composition** - Build complex pipelines from reusable workflows
6. **Variable resolution** - Explicit four-namespace architecture for clarity

**Key pattern: Discover → Inspect → Execute**

This ensures correct workflow selection and execution with proper inputs.
