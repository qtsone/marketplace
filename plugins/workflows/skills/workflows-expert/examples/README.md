# Workflow Examples

This directory contains sample workflow YAML files demonstrating common patterns and use cases for the workflows-mcp server.

## Available Examples

### simple-ci-pipeline.yaml

Basic CI pipeline that runs tests, linting, and builds only if quality checks pass.

**Use case**: Simple continuous integration
**Demonstrates**: Sequential execution, conditional builds

**Execute with workflows-mcp:**

```python
# Using the execute_inline_workflow tool
result = await execute_inline_workflow(
    workflow_yaml=Path('simple-ci-pipeline.yaml').read_text(),
    inputs={'project_path': '/path/to/project'}
)
```

Or execute as registered workflow:
```python
# First register the workflow, then execute
result = await execute_workflow(
    workflow='simple-ci-pipeline',
    inputs={'project_path': '/path/to/project'}
)
```

### conditional-deploy.yaml

Environment-based deployment with conditional logic.

**Use case**: Multi-environment deployments
**Demonstrates**: Complex conditions, environment-specific logic, emergency skip options

**Execute with workflows-mcp:**

```python
# Deploy to staging
result = await execute_inline_workflow(
    workflow_yaml=Path('conditional-deploy.yaml').read_text(),
    inputs={
        'environment': 'staging',
        'skip_tests': False
    }
)

# Emergency production deployment (skip tests)
result = await execute_inline_workflow(
    workflow_yaml=Path('conditional-deploy.yaml').read_text(),
    inputs={
        'environment': 'production',
        'skip_tests': True  # Use with caution!
    }
)
```

### parallel-testing.yaml

Run multiple test suites in parallel and generate aggregated report.

**Use case**: Fast test execution with comprehensive coverage
**Demonstrates**: Parallel execution, result aggregation, template rendering, file creation

**Execute with workflows-mcp:**

```python
result = await execute_inline_workflow(
    workflow_yaml=Path('parallel-testing.yaml').read_text(),
    inputs={'project_path': '/path/to/project'}
)

# Check if all tests passed
if result['outputs']['all_passed']:
    print(f"All tests passed! Report: {result['outputs']['report_path']}")
else:
    print("Some tests failed. Check the report for details.")
```

## Learning Path

1. **Start with**: `simple-ci-pipeline.yaml` - Learn basic sequential workflows with dependencies
2. **Then try**: `conditional-deploy.yaml` - Understand conditional execution and boolean logic
3. **Advanced**: `parallel-testing.yaml` - Master parallel execution, aggregation, and file operations

## Using These Examples

### Option 1: Inline Execution (Recommended for Testing)

Execute workflows directly from YAML files without registration:

```python
from pathlib import Path

# Load and execute
workflow_yaml = Path('./examples/simple-ci-pipeline.yaml').read_text()
result = await execute_inline_workflow(
    workflow_yaml=workflow_yaml,
    inputs={'project_path': '/path/to/project'}
)
```

**Advantages**: Quick testing, no registration needed, easy iteration

### Option 2: Register and Execute (Recommended for Reuse)

Register workflows for repeated use:

```python
# Registration happens by placing YAML files in the workflows directory
# Then execute by name
result = await execute_workflow(
    workflow='simple-ci-pipeline',
    inputs={'project_path': '/path/to/project'}
)
```

**Advantages**: Faster execution, discoverable via `list_workflows()`, reusable

## Modifying Examples

These examples are templates. Copy and modify them for your specific needs:

1. **Copy the example**: `cp ./examples/simple-ci-pipeline.yaml my-workflow.yaml`
2. **Modify inputs**: Adjust input types, defaults, and descriptions
3. **Update commands**: Change shell commands to match your tools
4. **Adjust conditions**: Modify boolean logic for your workflow
5. **Test inline**: Use `execute_inline_workflow` to test changes
6. **Register**: Move to workflows directory when ready for reuse

## Common Patterns Demonstrated

### Sequential Execution with Dependencies

```yaml
blocks:
  - id: step1
    type: Shell
    inputs: {command: "echo step1"}

  - id: step2
    type: Shell
    inputs: {command: "echo step2"}
    depends_on: [step1]  # Runs after step1
```

### Conditional Execution

```yaml
blocks:
  - id: tests
    type: Shell
    inputs: {command: "pytest"}

  - id: deploy
    type: Shell
    inputs: {command: "./deploy.sh"}
    condition: "{{blocks.tests.succeeded}}"
    depends_on: [tests]
```

### Parallel Execution

```yaml
blocks:
  # These run in parallel (no dependencies)
  - id: unit_tests
    type: Shell
    inputs: {command: "pytest tests/unit/"}

  - id: integration_tests
    type: Shell
    inputs: {command: "pytest tests/integration/"}
```

### Template Rendering and File Creation

```yaml
blocks:
  - id: render
    type: RenderTemplate
    inputs:
      template: "# Report\nStatus: {{ status }}"
      variables: {status: "{{blocks.tests.succeeded}}"}

  - id: save
    type: CreateFile
    inputs:
      path: "/tmp/report.md"
      content: "{{blocks.render.outputs.content}}"
    depends_on: [render]
```

## Additional Resources

- **Complete examples with documentation**: [`../references/examples.md`](../references/examples.md)
- **Variable syntax reference**: [`../references/variable-syntax.md`](../references/variable-syntax.md)
- **Block types reference**: [`../references/block-executors.md`](../references/block-executors.md)
- **Main skill documentation**: [`../SKILL.md`](../SKILL.md)

## Troubleshooting

**Variable not found**: Ensure you're using the correct namespace (`inputs.*`, `blocks.*`, `metadata.*`)

**Block not executing**: Check `depends_on` and `condition` - blocks may be skipped

**Template errors**: Verify Jinja2 syntax and that all variables exist in the `variables` dict

**File not created**: Check `output_path` in RenderTemplate or `path` in CreateFile, ensure parent directories exist or use `create_parents: true`
