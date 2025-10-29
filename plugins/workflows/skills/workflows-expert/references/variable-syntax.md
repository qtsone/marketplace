# Variable Resolution Syntax Reference

Complete guide to variable resolution in workflows-mcp.

## Four-Namespace Architecture

All variables must use explicit namespace paths for clarity and security.

### 1. Inputs Namespace

Access workflow input parameters:

```yaml
{{inputs.project_name}}
{{inputs.workspace}}
{{inputs.python_version}}
{{inputs.branch_name}}
```

**Used in**: Block inputs, conditions, outputs

**Example:**
```yaml
inputs:
  project_name:
    type: string
    default: "my-project"

blocks:
  - id: create_dir
    type: Shell
    inputs:
      command: "mkdir -p {{inputs.project_name}}"
```

### 2. Metadata Namespace

Access workflow execution metadata:

```yaml
{{metadata.workflow_name}}      # Name of the workflow
{{metadata.start_time}}         # Execution start timestamp
{{metadata.execution_id}}       # Unique execution identifier
```

**Used in**: Logging, outputs, debugging

**Example:**
```yaml
blocks:
  - id: log_start
    type: CreateFile
    inputs:
      path: "execution.log"
      content: |
        Workflow: {{metadata.workflow_name}}
        Started: {{metadata.start_time}}
```

### 3. Blocks Namespace

Access block execution results. This is the most commonly used namespace.

#### Block Outputs (Explicit)

```yaml
{{blocks.block_id.outputs.field_name}}
{{blocks.run_tests.outputs.exit_code}}
{{blocks.create_file.outputs.path}}
{{blocks.git_checkout.outputs.branch}}
```

#### Block Outputs (Shortcut)

Auto-expands to `outputs.field_name`:

```yaml
{{blocks.run_tests.exit_code}}           # Same as outputs.exit_code
{{blocks.create_file.path}}              # Same as outputs.path
{{blocks.git_checkout.branch}}           # Same as outputs.branch
```

**Recommendation**: Use shortcuts for cleaner YAML.

#### Block Status (ADR-007)

**Tier 1: Boolean Shortcuts** (Use for 90% of cases)

```yaml
{{blocks.test.succeeded}}    # True if completed successfully
{{blocks.build.failed}}      # True if failed (any reason)
{{blocks.optional.skipped}}  # True if skipped by condition
```

**Tier 2: Status String** (For precise control)

```yaml
{{blocks.test.status}} == 'completed'    # Executor finished
{{blocks.test.status}} == 'failed'       # Executor crashed
{{blocks.test.status}} == 'skipped'      # Condition was false
```

Status values: `pending`, `running`, `completed`, `failed`, `skipped`, `paused`

#### Block Inputs (For debugging)

```yaml
{{blocks.run_tests.inputs.command}}
{{blocks.create_file.inputs.path}}
```

#### Block Metadata

```yaml
{{blocks.test.metadata.execution_time_ms}}
{{blocks.test.metadata.start_time}}
{{blocks.test.metadata.end_time}}
```

### 4. Internal Namespace (Not Accessible)

`{{__internal__.*}}` - System state, security boundary

Cannot be accessed via variable syntax.

## Variable Resolution Rules

### Resolution Order

1. Variables resolved at **execution time**, not load time
2. Variables can reference other variables (recursive resolution)
3. Undefined variables cause execution failure

### Recursive Resolution

Variables can reference other variables:

```yaml
inputs:
  base_path: "/project"
  sub_path: "{{inputs.base_path}}/src"
  full_path: "{{inputs.sub_path}}/main.py"
```

Resolves to: `/project/src/main.py`

### Cross-Block References

Reference outputs from previous blocks:

```yaml
blocks:
  - id: create_worktree
    type: CreateWorktree
    inputs:
      branch: "feature/{{inputs.feature_name}}"
      path: ".worktrees/{{inputs.feature_name}}"

  - id: create_file
    type: CreateFile
    inputs:
      path: "{{blocks.create_worktree.worktree_path}}/README.md"
      content: "# {{inputs.project_name}}"
    depends_on: [create_worktree]
```

## Common Patterns

### Pattern 1: Conditional Execution Based on Exit Code

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
    # Use boolean shortcut (recommended)
    condition: "{{blocks.run_tests.succeeded}}"
    depends_on: [run_tests]

  # Alternative: explicit exit code check
  - id: deploy_alt
    type: Shell
    inputs:
      command: ./deploy.sh
    condition: "{{blocks.run_tests.outputs.exit_code}} == 0"
    depends_on: [run_tests]
```

### Pattern 2: File Paths with Multiple Variables

```yaml
blocks:
  - id: process
    type: Shell
    inputs:
      command: "python {{inputs.script_path}}"
      working_dir: "{{blocks.setup.outputs.project_dir}}/src"
```

### Pattern 3: Workflow Outputs

```yaml
outputs:
  result_path: "{{blocks.create_file.outputs.path}}"
  tests_passed: "{{blocks.run_tests.succeeded}}"
  exit_code: "{{blocks.run_tests.outputs.exit_code}}"
  execution_time: "{{blocks.run_tests.metadata.execution_time_ms}}"
```

### Pattern 4: Complex Conditions

```yaml
blocks:
  - id: deploy
    type: Shell
    inputs:
      command: ./deploy.sh
    # Multiple conditions with boolean logic
    condition: >
      {{blocks.run_tests.succeeded}} and
      {{blocks.build.succeeded}} and
      {{inputs.environment}} == 'production'
    depends_on: [run_tests, build]
```

## Common Mistakes

### ❌ Wrong: Missing Namespace

```yaml
# WRONG - no namespace
{{project_name}}
{{exit_code}}
{{test.succeeded}}
```

### ✅ Correct: With Namespace

```yaml
# CORRECT - explicit namespace
{{inputs.project_name}}
{{blocks.run_tests.outputs.exit_code}}
{{blocks.test.succeeded}}
```

### ❌ Wrong: Old Status Syntax

```yaml
# WRONG - old pre-ADR-007 syntax
{{blocks.test.outputs.success}}
{{blocks.test.success}}
```

### ✅ Correct: ADR-007 Status

```yaml
# CORRECT - ADR-007 shortcuts
{{blocks.test.succeeded}}
{{blocks.test.failed}}
{{blocks.test.skipped}}
```

### ❌ Wrong: Accessing Internal State

```yaml
# WRONG - cannot access internal namespace
{{__internal__.checkpoint_id}}
```

### ✅ Correct: Use Public Namespaces

```yaml
# CORRECT - use public namespaces
{{metadata.execution_id}}
{{blocks.step.outputs.result}}
```

## Variable Types

Variables resolve to these types:

- **String**: Most variables resolve to strings
- **Boolean**: Status shortcuts (`succeeded`, `failed`, `skipped`)
- **Integer**: Numeric outputs (exit codes, counts)
- **Object**: Metadata objects (rare, usually access specific fields)

## Best Practices

1. **Use explicit namespaces** - Always use `inputs.`, `blocks.`, `metadata.`
2. **Prefer boolean shortcuts** - Use `.succeeded` over `.outputs.exit_code == 0`
3. **Use output shortcuts** - Use `.exit_code` instead of `.outputs.exit_code` for cleaner YAML
4. **Check workflow info** - Use `get_workflow_info()` to see available outputs
5. **Quote in conditions** - Always use `"{{...}}"` in condition strings
6. **Document custom outputs** - If creating workflows, document output fields

## Debugging Variable Issues

If variables aren't resolving:

1. **Check namespace** - Ensure you're using `inputs.`, `blocks.`, or `metadata.`
2. **Verify block ID** - Block IDs are case-sensitive
3. **Check depends_on** - Blocks must complete before their outputs are available
4. **Use detailed response** - Set `response_format: "detailed"` to see resolution details
5. **Validate YAML** - Use `validate_workflow_yaml()` before execution

## Complete Example

```yaml
name: full-example
description: Demonstrates all variable namespaces

inputs:
  project_name:
    type: string
    required: true
  environment:
    type: string
    default: "staging"

blocks:
  - id: setup
    type: Shell
    inputs:
      command: "echo Setting up {{inputs.project_name}}"

  - id: test
    type: Shell
    inputs:
      command: "pytest tests/"
      working_dir: "{{inputs.project_name}}"
    depends_on: [setup]

  - id: log_results
    type: CreateFile
    inputs:
      path: "results.log"
      content: |
        Workflow: {{metadata.workflow_name}}
        Started: {{metadata.start_time}}
        Project: {{inputs.project_name}}
        Environment: {{inputs.environment}}
        Setup succeeded: {{blocks.setup.succeeded}}
        Tests exit code: {{blocks.test.exit_code}}
        Tests passed: {{blocks.test.succeeded}}
    depends_on: [test]
    condition: "{{blocks.test.status}} == 'completed'"

  - id: deploy
    type: Shell
    inputs:
      command: "./deploy.sh {{inputs.environment}}"
    depends_on: [test]
    condition: >
      {{blocks.test.succeeded}} and
      {{inputs.environment}} == 'production'

outputs:
  tests_passed: "{{blocks.test.succeeded}}"
  deploy_ran: "{{blocks.deploy.status}} != 'skipped'"
  log_path: "{{blocks.log_results.path}}"
```

This example shows all four namespaces in use with proper syntax.
