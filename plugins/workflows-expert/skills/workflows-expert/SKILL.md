---
name: workflows-expert
description: Expert knowledge for using workflows-mcp MCP server to execute DAG-based workflows with proper variable syntax, conditionals, and best practices
---

# Workflows MCP Expert Skill

Use this skill when the user wants to execute workflows, orchestrate multi-step tasks, or use the workflows-mcp MCP server.

## When to Activate

Activate this skill when the user mentions:
- "run a workflow" or "execute workflow"
- "list workflows" or "what workflows are available"
- "workflow information" or "workflow details"
- Working with CI/CD pipelines, git operations, or automated tasks
- Multi-step task orchestration
- DAG-based execution

## Core Concepts

### Available MCP Tools

The workflows-mcp server provides these tools:

1. **list_workflows()** - List all available workflows with optional tag filtering
2. **get_workflow_info(workflow)** - Get detailed info about a specific workflow
3. **execute_workflow(workflow, inputs)** - Execute a workflow with inputs
4. **validate_workflow_yaml(yaml_content)** - Validate workflow YAML before execution
5. **execute_inline_workflow(workflow_yaml, inputs)** - Execute workflow without registering

### Variable Resolution System

**CRITICAL: Four-namespace architecture**

All variables use explicit namespace paths:

```yaml
# Workflow inputs
${inputs.project_name}
${inputs.workspace}

# Workflow metadata
${metadata.workflow_name}
${metadata.start_time}

# Block outputs (explicit)
${blocks.create_worktree.outputs.worktree_path}
${blocks.run_tests.outputs.exit_code}

# Block outputs (shortcut - auto-expands to outputs)
${blocks.run_tests.exit_code}           # Same as outputs.exit_code
${blocks.create_worktree.worktree_path}  # Same as outputs.worktree_path

# Block status (ADR-007)
${blocks.run_tests.succeeded}   # Boolean: true if completed successfully
${blocks.build.failed}          # Boolean: true if failed (any reason)
${blocks.optional.skipped}      # Boolean: true if skipped
```

**Never use bare block IDs without namespace:**
- ❌ WRONG: `${run_tests}` or `${run_tests.success}`
- ✅ CORRECT: `${blocks.run_tests.succeeded}` or `${blocks.run_tests.outputs.exit_code}`

### Conditional Execution

Use conditions to control block execution:

```yaml
blocks:
  - id: deploy
    type: Shell
    inputs:
      command: ./deploy.sh
    condition: "${blocks.run_tests.succeeded}"  # Only deploy if tests passed
    depends_on: [run_tests]
```

**Tier 1: Boolean Shortcuts (Use for 90% of cases)**
- `${blocks.id.succeeded}` - True if completed successfully
- `${blocks.id.failed}` - True if failed (any reason)
- `${blocks.id.skipped}` - True if skipped

**Tier 2: Status String (For precise control)**
- `${blocks.id.status} == 'completed'` - Executor finished
- `${blocks.id.status} in ['completed', 'skipped']` - Run if finished or skipped

### Workflow Composition

Call workflows as blocks:

```yaml
blocks:
  - id: ci_pipeline
    type: Workflow
    inputs:
      workflow: "python-ci-pipeline"
      inputs:
        project_path: "${inputs.workspace}"
```

## Common Workflows

### Python Development
- `setup-python-env` - Set up Python environment with uv
- `run-pytest` - Run pytest tests
- `lint-python` - Run ruff linting
- `python-ci-pipeline` - Complete CI pipeline

### Git Operations
- `git-checkout-branch` - Checkout or create git branch
- `git-commit-and-push` - Stage, commit, and push changes

### Examples
- `sequential-echo` - Sequential execution example
- `parallel-echo` - Parallel execution example
- `conditional-deploy` - Conditional execution example

## Workflow Execution Pattern

### Step 1: List Available Workflows

```javascript
await use_mcp_tool('workflows', 'list_workflows', {})
```

### Step 2: Get Workflow Information

```javascript
await use_mcp_tool('workflows', 'get_workflow_info', {
  workflow: 'python-ci-pipeline',
  format: 'markdown'  // or 'json'
})
```

### Step 3: Execute Workflow

```javascript
await use_mcp_tool('workflows', 'execute_workflow', {
  workflow: 'python-ci-pipeline',
  inputs: {
    project_path: '/path/to/project',
    python_version: '3.12'
  },
  response_format: 'minimal'  // or 'detailed' for debugging
})
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
      command: "echo Processing ${inputs.target}"

  - id: step2
    type: Shell
    inputs:
      command: "echo Done"
    depends_on: [step1]
    condition: "${blocks.step1.succeeded}"

outputs:
  result: "${blocks.step2.outputs.stdout}"
```

Execute with:

```javascript
await use_mcp_tool('workflows', 'execute_inline_workflow', {
  workflow_yaml: `<yaml content>`,
  inputs: { target: 'my-target' }
})
```

## Best Practices

### 1. Always Use Proper Variable Syntax
- ✅ `${inputs.field_name}`
- ✅ `${blocks.block_id.outputs.field}`
- ✅ `${blocks.block_id.succeeded}`
- ❌ `${field_name}` - Missing namespace
- ❌ `${block_id}` - Missing blocks namespace

### 2. Check Workflow Info Before Execution
Always call `get_workflow_info()` to see required inputs before executing.

### 3. Use Boolean Shortcuts for Conditions
- Prefer `${blocks.test.succeeded}` over `${blocks.test.outputs.exit_code} == 0`
- Simpler, more readable, follows ADR-007 standard

### 4. Handle Execution Responses
Check `status` field in response:
- `"success"` - Workflow completed successfully
- `"failure"` - Workflow failed (check `error` field)

### 5. Use Minimal Response Format
Unless debugging, use `response_format: "minimal"` to reduce token usage.

### 6. Validate Before Execution
For inline workflows, use `validate_workflow_yaml()` first to catch errors.

## Common Patterns

### Pattern 1: Run Tests Then Deploy

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
    condition: "${blocks.run_tests.succeeded}"
    depends_on: [run_tests]
```

### Pattern 2: Cleanup Regardless of Success

```yaml
blocks:
  - id: build
    type: Shell
    inputs:
      command: make build

  - id: cleanup
    type: Shell
    inputs:
      command: rm -rf build-cache/
    condition: "${blocks.build.status} == 'completed'"
    depends_on: [build]
```

### Pattern 3: Workflow Composition

```yaml
blocks:
  - id: setup
    type: Workflow
    inputs:
      workflow: "setup-python-env"
      inputs:
        python_version: "${inputs.python_version}"

  - id: test
    type: Workflow
    inputs:
      workflow: "run-pytest"
      inputs:
        project_path: "${inputs.project_path}"
    depends_on: [setup]
```

## Troubleshooting

### Variable Resolution Errors
If you get variable resolution errors:
1. Check you're using proper namespace: `${inputs.*}`, `${blocks.*}`, `${metadata.*}`
2. Verify block IDs match exactly
3. For block outputs, use full path: `${blocks.id.outputs.field}`

### Execution Failures
If workflow execution fails:
1. Check the `error` field in response
2. Use `response_format: "detailed"` to see block-level details
3. Verify required inputs are provided
4. Check conditions are using correct syntax

### Workflow Not Found
If workflow isn't found:
1. Use `list_workflows()` to see available workflows
2. Check workflow name spelling
3. Verify MCP server is connected

## Reference Documentation

See [references/variable-syntax.md](references/variable-syntax.md) for complete variable resolution documentation.

See [references/block-executors.md](references/block-executors.md) for available block types and their inputs.

## Examples

### Example 1: Run Python CI Pipeline

```javascript
// 1. Check what inputs are needed
const info = await use_mcp_tool('workflows', 'get_workflow_info', {
  workflow: 'python-ci-pipeline',
  format: 'json'
});

// 2. Execute with required inputs
const result = await use_mcp_tool('workflows', 'execute_workflow', {
  workflow: 'python-ci-pipeline',
  inputs: {
    project_path: '/Users/user/my-project'
  }
});

// 3. Check result
if (result.status === 'success') {
  console.log('CI passed!');
} else {
  console.log('CI failed:', result.error);
}
```

### Example 2: Custom Git Workflow

```javascript
const yaml = `
name: feature-branch-workflow
description: Create feature branch and commit changes

inputs:
  feature_name:
    type: string
    required: true
  commit_message:
    type: string
    required: true

blocks:
  - id: create_branch
    type: Workflow
    inputs:
      workflow: "git-checkout-branch"
      inputs:
        branch: "feature/\${inputs.feature_name}"
        create: true

  - id: commit_changes
    type: Workflow
    inputs:
      workflow: "git-commit-and-push"
      inputs:
        message: "\${inputs.commit_message}"
    depends_on: [create_branch]
    condition: "\${blocks.create_branch.succeeded}"

outputs:
  branch: "\${blocks.create_branch.outputs.branch}"
  commit_sha: "\${blocks.commit_changes.outputs.commit_sha}"
`;

const result = await use_mcp_tool('workflows', 'execute_inline_workflow', {
  workflow_yaml: yaml,
  inputs: {
    feature_name: 'new-api',
    commit_message: 'feat: add new API endpoint'
  }
});
```

## Summary

When using workflows-mcp:
1. **List workflows** to discover available workflows
2. **Get workflow info** to understand inputs and structure
3. **Use proper variable syntax** with explicit namespaces
4. **Use boolean shortcuts** for conditions (`succeeded`, `failed`, `skipped`)
5. **Check execution status** in responses
6. **Compose workflows** for complex orchestration

This MCP server enables powerful workflow orchestration with proper DAG resolution, parallel execution, and conditional logic.
