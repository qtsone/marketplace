# Block Executors Reference

Complete reference for all available block types in workflows-mcp.

## Core Executors

### Shell

Execute shell commands with configurable environment and working directory.

**Type**: `Shell`

**Inputs**:
```yaml
command: string          # Shell command to execute (required)
working_dir: string      # Working directory (optional)
env: object             # Environment variables (optional)
timeout: integer        # Timeout in seconds (optional)
```

**Outputs**:
```yaml
exit_code: integer      # Exit code (0 = success)
stdout: string          # Standard output
stderr: string          # Standard error
```

**Example**:
```yaml
- id: run_tests
  type: Shell
  inputs:
    command: "pytest tests/ -v"
    working_dir: "/path/to/project"
    env:
      PYTEST_ARGS: "--cov"
    timeout: 300
```

**Status Check**:
```yaml
condition: "{{blocks.run_tests.succeeded}}"  # Exit code was 0
```

---

### Workflow

Execute another workflow as a block (workflow composition).

**Type**: `Workflow`

**Inputs**:
```yaml
workflow: string        # Workflow name (required)
inputs: object          # Workflow inputs (optional)
```

**Outputs**: All outputs from the called workflow

**Example**:
```yaml
- id: ci_pipeline
  type: Workflow
  inputs:
    workflow: "python-ci-pipeline"
    inputs:
      project_path: "{{inputs.workspace}}"
      python_version: "3.12"
```

**Recursive Workflows**: Supported with depth limit (default: 50)

---

## File Operations

### CreateFile

Create a new file with content.

**Type**: `CreateFile`

**Inputs**:
```yaml
path: string            # File path (required)
content: string         # File content (required)
permissions: string     # Unix permissions (optional, default: "644")
encoding: string        # File encoding (optional, default: "utf-8")
```

**Outputs**:
```yaml
path: string            # Created file path
size: integer           # File size in bytes
```

**Example**:
```yaml
- id: create_readme
  type: CreateFile
  inputs:
    path: "{{blocks.setup.project_dir}}/README.md"
    content: |
      # {{inputs.project_name}}

      Version: {{inputs.version}}
      Created: {{metadata.start_time}}
    permissions: "644"
```

---

### ReadFile

Read file contents into workflow context.

**Type**: `ReadFile`

**Inputs**:
```yaml
path: string            # File path (required)
encoding: string        # File encoding (optional, default: "utf-8")
binary: boolean         # Read as binary (optional, default: false)
```

**Outputs**:
```yaml
content: string         # File content
path: string            # File path
size: integer           # File size in bytes
```

**Example**:
```yaml
- id: read_config
  type: ReadFile
  inputs:
    path: "config.json"

- id: process_config
  type: Shell
  inputs:
    command: "echo '{{blocks.read_config.content}}' | jq .version"
  depends_on: [read_config]
```

---

### RenderTemplate

Render Jinja2 templates with variables.

**Type**: `RenderTemplate`

**Inputs**:
```yaml
template: string        # Jinja2 template (required)
variables: object       # Template variables (required)
template_file: string   # Or path to template file (alternative)
```

**Outputs**:
```yaml
rendered: string        # Rendered template content
```

**Example**:
```yaml
- id: render_readme
  type: RenderTemplate
  inputs:
    template: |
      # {{ project_name }}

      ## Version {{ version }}

      Tests passed: {{ tests_passed }}
    variables:
      project_name: "{{inputs.project_name}}"
      version: "{{inputs.version}}"
      tests_passed: "{{blocks.run_tests.succeeded}}"

- id: save_readme
  type: CreateFile
  inputs:
    path: "README.md"
    content: "{{blocks.render_readme.rendered}}"
  depends_on: [render_readme]
```

---

## State Management

### SaveState

Save workflow state to JSON file.

**Type**: `SaveState`

**Inputs**:
```yaml
path: string            # JSON file path (required)
data: object            # Data to save (required)
```

**Outputs**:
```yaml
path: string            # Saved file path
```

**Example**:
```yaml
- id: save_results
  type: SaveState
  inputs:
    path: "workflow-state.json"
    data:
      test_results: "{{blocks.run_tests.exit_code}}"
      deploy_status: "{{blocks.deploy.succeeded}}"
      timestamp: "{{metadata.start_time}}"
```

---

### LoadState

Load workflow state from JSON file.

**Type**: `LoadState`

**Inputs**:
```yaml
path: string            # JSON file path (required)
```

**Outputs**:
```yaml
data: object            # Loaded data
```

**Example**:
```yaml
- id: load_previous
  type: LoadState
  inputs:
    path: "workflow-state.json"

- id: compare_results
  type: Shell
  inputs:
    command: "echo Previous: {{blocks.load_previous.data.test_results}}"
  depends_on: [load_previous]
```

---

## Interactive Executors

### Prompt

Pause workflow and prompt user for input.

**Type**: `Prompt`

**Inputs**:
```yaml
message: string         # Prompt message (required)
default: string         # Default response (optional)
```

**Outputs**:
```yaml
response: string        # User's response
```

**Example**:
```yaml
- id: ask_deploy
  type: Prompt
  inputs:
    message: "Deploy to production? (yes/no)"
    default: "no"

- id: deploy
  type: Shell
  inputs:
    command: "./deploy.sh production"
  depends_on: [ask_deploy]
  condition: "{{blocks.ask_deploy.response}} == 'yes'"
```

**Resume with**:
```text
Tool: resume_workflow
Parameters: {
  checkpoint_id: '<checkpoint_id>',
  response: 'yes'
}
```

---

## Block Execution Model

All blocks follow the same execution model:

### Execution States

1. **PENDING** - Block waiting to execute
2. **RUNNING** - Block currently executing
3. **COMPLETED** - Block finished successfully
4. **FAILED** - Block execution failed
5. **SKIPPED** - Block skipped due to condition
6. **PAUSED** - Block paused (Prompt blocks)

### Status vs Outcome (ADR-005)

**Execution Status**: Lifecycle state of the block
- `pending`, `running`, `completed`, `failed`, `skipped`, `paused`

**Operation Outcome**: Result of the operation
- `success` - Operation succeeded (exit_code = 0)
- `failure` - Operation failed (exit_code != 0)
- `n/a` - Not applicable (executor crashed)

**Key Insight**: A Shell block with exit_code=1 has:
- `status: "completed"` (executor ran successfully)
- `outcome: "failure"` (command failed)
- `succeeded: false` (operation failed)
- `failed: false` (executor didn't crash)

### Status Shortcuts (ADR-007)

**Use these 90% of the time**:

```yaml
{{blocks.test.succeeded}}    # Operation succeeded
{{blocks.test.failed}}       # Operation failed (or crashed)
{{blocks.test.skipped}}      # Condition was false
```

**Precision control when needed**:

```yaml
{{blocks.test.status}} == 'completed'    # Executor finished
{{blocks.test.status}} == 'failed'       # Executor crashed
{{blocks.test.outcome}} == 'success'     # Operation succeeded
{{blocks.test.outcome}} == 'failure'     # Operation failed
```

---

## Common Block Patterns

### Pattern 1: Sequential Execution

```yaml
blocks:
  - id: step1
    type: Shell
    inputs:
      command: "echo Step 1"

  - id: step2
    type: Shell
    inputs:
      command: "echo Step 2"
    depends_on: [step1]

  - id: step3
    type: Shell
    inputs:
      command: "echo Step 3"
    depends_on: [step2]
```

### Pattern 2: Parallel Execution

```yaml
blocks:
  - id: test_unit
    type: Shell
    inputs:
      command: "pytest tests/unit/"

  - id: test_integration
    type: Shell
    inputs:
      command: "pytest tests/integration/"

  # Both run in parallel (no dependencies)
```

### Pattern 3: Conditional Execution

```yaml
blocks:
  - id: check_env
    type: Shell
    inputs:
      command: "echo {{inputs.environment}}"

  - id: deploy_staging
    type: Shell
    inputs:
      command: "./deploy.sh staging"
    depends_on: [check_env]
    condition: "{{inputs.environment}} == 'staging'"

  - id: deploy_production
    type: Shell
    inputs:
      command: "./deploy.sh production"
    depends_on: [check_env]
    condition: "{{inputs.environment}} == 'production'"
```

### Pattern 4: Error Handling

```yaml
blocks:
  - id: risky_operation
    type: Shell
    inputs:
      command: "./risky.sh"

  - id: cleanup_success
    type: Shell
    inputs:
      command: "echo Success cleanup"
    depends_on: [risky_operation]
    condition: "{{blocks.risky_operation.succeeded}}"

  - id: cleanup_failure
    type: Shell
    inputs:
      command: "echo Failure cleanup"
    depends_on: [risky_operation]
    condition: "{{blocks.risky_operation.failed}}"

  - id: cleanup_always
    type: Shell
    inputs:
      command: "echo Always cleanup"
    depends_on: [risky_operation]
    condition: "{{blocks.risky_operation.status}} == 'completed'"
```

### Pattern 5: File Processing Pipeline

```yaml
blocks:
  - id: read_input
    type: ReadFile
    inputs:
      path: "input.json"

  - id: process_data
    type: RenderTemplate
    inputs:
      template: "Processed: {{ data }}"
      variables:
        data: "{{blocks.read_input.content}}"
    depends_on: [read_input]

  - id: save_output
    type: CreateFile
    inputs:
      path: "output.txt"
      content: "{{blocks.process_data.rendered}}"
    depends_on: [process_data]

  - id: save_state
    type: SaveState
    inputs:
      path: "state.json"
      data:
        input_size: "{{blocks.read_input.size}}"
        output_path: "{{blocks.save_output.path}}"
    depends_on: [save_output]
```

---

## Best Practices

### 1. Use Meaningful Block IDs
```yaml
# Good
- id: run_unit_tests
- id: deploy_to_staging

# Bad
- id: step1
- id: task_a
```

### 2. Declare Dependencies Explicitly
```yaml
# Good - clear dependency chain
- id: build
  ...
- id: test
  depends_on: [build]
- id: deploy
  depends_on: [test]
```

### 3. Use Boolean Shortcuts
```yaml
# Good
condition: "{{blocks.test.succeeded}}"

# Less good (but valid)
condition: "{{blocks.test.outputs.exit_code}} == 0"
```

### 4. Handle Both Success and Failure
```yaml
- id: deploy
  condition: "{{blocks.test.succeeded}}"

- id: notify_success
  condition: "{{blocks.deploy.succeeded}}"

- id: notify_failure
  condition: "{{blocks.deploy.failed}}"
```

### 5. Use Workflow Composition
```yaml
# Good - reuse existing workflows
- id: ci
  type: Workflow
  inputs:
    workflow: "python-ci-pipeline"

# Less good - duplicate logic in Shell blocks
```

---

## Troubleshooting

### Block Not Executing
1. Check `depends_on` - dependencies must complete first
2. Check `condition` - condition must evaluate to true
3. Verify block ID spelling (case-sensitive)

### Variable Not Resolving
1. Check namespace: `{{blocks.id.outputs.field}}`
2. Verify block completed before reference
3. Check output field name in workflow info

### Exit Code Confusion
- `exit_code == 0` means command succeeded
- `exit_code != 0` means command failed
- Use `{{blocks.id.succeeded}}` for cleaner checks

### Workflow Composition Issues
1. Verify workflow exists: `list_workflows()`
2. Check required inputs: `get_workflow_info()`
3. Ensure inputs are provided correctly
