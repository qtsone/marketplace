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

Common user phrases that trigger this skill:
- "I need to run tests before deploying"
- "Create a multi-step build pipeline"
- "Execute this only if the previous step succeeds"
- "Orchestrate tasks with dependencies"
- "Run these tasks in parallel"
- "Chain multiple commands together"
- "Automate my CI/CD workflow"

## Core Concepts

### Available MCP Tools

The workflows-mcp server provides these tools:

1. **list_workflows(tags, format)** - Discover workflows by tags
   - Filter by tags (AND logic): `tags=['python', 'testing']`
   - Format: `json` or `markdown`
   - Returns workflow names only

2. **get_workflow_info(workflow, format)** - Get detailed workflow information
   - Shows inputs, outputs, blocks, dependencies
   - Format: `json` or `markdown`
   - **call this before executing** to understand requirements

3. **execute_workflow(workflow, inputs, response_format)** - Execute a registered workflow
   - Provide required inputs from `get_workflow_info()`
   - Response format: `minimal` (highly recommended) or `detailed` (only for debugging)

4. **execute_inline_workflow(workflow_yaml, inputs)** - Execute YAML directly without registration
   - Useful for one-off or custom workflows
   - Validate first with `validate_workflow_yaml()`

5. **validate_workflow_yaml(yaml_content)** - Validate workflow YAML before execution
   - Catches syntax errors early
   - Returns validation errors with helpful messages

**Checkpoint Management Tools** (for interactive workflows with Prompt blocks):
- **resume_workflow(checkpoint_id, response)** - Resume paused workflow
- **list_checkpoints()** - See all saved checkpoints
- **get_checkpoint_info(checkpoint_id)** - Inspect checkpoint details
- **delete_checkpoint(checkpoint_id)** - Clean up old checkpoints

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

## Discovering Workflows with Tags

### Tag-Based Discovery Pattern

**ALWAYS start by discovering workflows using tags instead of guessing workflow names.**

Common tag categories:
- **Language**: `python`, `javascript`, `shell`
- **Task type**: `ci`, `git`, `testing`, `deployment`, `tdd`
- **Operations**: `setup`, `checkout`, `commit`, `lint`, `analysis`

### Discovery Workflow

**Step 1: Discover workflows by tags**
```text
Tool: list_workflows
Parameters:
  tags: ['python', 'testing']  # AND logic - workflows with BOTH tags
  format: 'markdown'
Returns: List of matching workflow names
```

**Step 2: Get workflow details**
```text
Tool: get_workflow_info
Parameters:
  workflow: 'python-ci-pipeline'
  format: 'markdown'
Returns: Workflow structure, inputs, outputs, blocks
```

**Step 3: Execute workflow**
```text
Tool: execute_workflow
Parameters:
  workflow: 'python-ci-pipeline'
  inputs: {project_path: '/path/to/project'}
  response_format: 'minimal'
Returns: {status: 'success', outputs: {...}}
```

### Common Tag Combinations

**Python Development**:
- `['python']` - All Python-related workflows
- `['python', 'testing']` - Python test execution workflows
- `['python', 'ci']` - Python CI pipelines
- `['python', 'setup']` - Environment setup workflows

**Git Operations**:
- `['git']` - All git workflows
- `['git', 'commit']` - Commit-related workflows
- `['git', 'checkout']` - Branch checkout workflows
- `['git', 'analysis']` - Git diff and analysis workflows

**CI/CD**:
- `['ci']` - All CI workflows
- `['ci', 'deployment']` - Deployment pipelines
- `['deployment', 'conditional']` - Environment-based deployments

**TDD Workflows**:
- `['tdd']` - All TDD workflows
- `['tdd', 'phase1']` - Analysis phase
- `['tdd', 'implementation']` - Implementation phase
- `['tdd', 'integration']` - Integration testing phase

## Workflow Execution Pattern

**Recommended approach: Discover → Inspect → Execute**

### Step 1: Discover Workflows by Tags

**Preferred method - discover by tags:**
```text
Tool: list_workflows
Parameters:
  tags: ['python', 'ci']  # AND logic: workflows with BOTH tags
  format: 'markdown'
```

**Alternative - list all workflows (less efficient):**
```text
Tool: list_workflows
Parameters:
  tags: []  # Empty list = all workflows
  format: 'json'
```

### Step 2: Get Workflow Information

**ALWAYS call this before executing** to understand inputs and behavior:

```text
Tool: get_workflow_info
Parameters:
  workflow: 'python-ci-pipeline'
  format: 'markdown'  # Human-readable format recommended
```

### Step 3: Execute Workflow

```bash
Tool: execute_workflow
Parameters:
  workflow: 'python-ci-pipeline'
  inputs: {project_path: '/path/to/project'}  # From get_workflow_info()
  response_format: 'minimal'  # Use 'detailed' only for debugging
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

```text
Tool: execute_inline_workflow
Parameters:
  workflow_yaml: '<yaml content above>'
  inputs: {target: 'my-target'}
```

## Best Practices

### 1. Always Use Proper Variable Syntax
- ✅ `${inputs.field_name}`
- ✅ `${blocks.block_id.outputs.field}`
- ✅ `${blocks.block_id.succeeded}`
- ❌ `${field_name}` - Missing namespace
- ❌ `${block_id}` - Missing blocks namespace

### 2. Discover Workflows with Tags First
Use `list_workflows(tags=[...])` to discover relevant workflows instead of guessing names. Tag-based discovery is more reliable and shows you all available options.

### 3. Check Workflow Info Before Execution
Call `get_workflow_info()` to see required inputs, outputs, and workflow structure before executing.

### 4. Use Boolean Shortcuts for Conditions
- Prefer `${blocks.test.succeeded}` over `${blocks.test.outputs.exit_code} == 0`
- Simpler, more readable, follows ADR-007 standard

### 5. Handle Execution Responses
Check `status` field in response:
- `"success"` - Workflow completed successfully
- `"failure"` - Workflow failed (check `error` field)

### 6. Use Minimal Response Format
Unless debugging, use `response_format: "minimal"` to reduce token usage.

### 7. Validate Before Execution
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

**See [references/examples.md](references/examples.md) for more complete workflow examples including multi-stage deployments, parallel execution, and error handling.**

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

For detailed information, use these reference files:

### Variable Syntax Reference
**File**: [references/variable-syntax.md](references/variable-syntax.md)
- Complete guide to the four-namespace architecture
- Variable resolution rules and patterns
- Common mistakes and debugging tips

**Quick find patterns**:
```bash
# List all common mistakes
grep -A 5 "❌ Wrong" references/variable-syntax.md

# Find specific pattern examples
grep -A 10 "Pattern [0-9]" references/variable-syntax.md

# Find namespace documentation
grep "### [0-9]" references/variable-syntax.md
```

### Block Executors Reference
**File**: [references/block-executors.md](references/block-executors.md)
- All available block types (Shell, Workflow, CreateFile, ReadFile, etc.)
- Input/output specifications for each block type
- Execution patterns and troubleshooting

**Quick find patterns**:
```bash
# List all block types
grep "^### " references/block-executors.md

# Find specific block documentation
grep -A 20 "### Shell" references/block-executors.md

# Find common patterns
grep -A 15 "### Pattern [0-9]" references/block-executors.md
```

### Complete Examples
**File**: [references/examples.md](references/examples.md)
- Full workflow examples for common use cases
- Multi-stage deployments, parallel testing, file processing
- Interactive workflows with approval steps
- Error handling and retry patterns

**Quick find patterns**:
```bash
# List all examples
grep "^## Example" references/examples.md

# Find specific pattern
grep -A 30 "Pattern:" references/examples.md
```

## Quick Start Example

Basic workflow execution pattern:

**Step 1: Check required inputs**
```text
Tool: get_workflow_info
Parameters:
  workflow: 'python-ci-pipeline'
  format: 'markdown'
```

**Step 2: Execute workflow**
```text
Tool: execute_workflow
Parameters:
  workflow: 'python-ci-pipeline'
  inputs: {project_path: '/Users/user/my-project'}
  response_format: 'minimal'
```

**Step 3: Check result**
- If `status` is `'success'` → CI passed
- If `status` is `'failure'` → Check `error` field

**For complete examples** including multi-stage deployments, parallel execution, file processing, and error handling, see [references/examples.md](references/examples.md).

## Summary

When using workflows-mcp:
1. **Discover with tags** - Use `list_workflows(tags=[...])` to find relevant workflows
2. **Get workflow info** - Always call `get_workflow_info()` before executing
3. **Use proper variable syntax** - Explicit namespaces (`inputs.`, `blocks.`, `metadata.`)
4. **Use boolean shortcuts** - Conditions with `.succeeded`, `.failed`, `.skipped`
5. **Check execution status** - Verify `status` field in responses
6. **Compose workflows** - Build complex pipelines from reusable workflows

**Key workflow: Discover → Inspect → Execute**

This MCP server enables powerful workflow orchestration with tag-based discovery, DAG resolution, parallel execution, and conditional logic.
