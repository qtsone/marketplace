# Workflow Examples

This directory contains sample workflow YAML files demonstrating common patterns and use cases.

## Available Examples

### simple-ci-pipeline.yaml
Basic CI pipeline that runs tests, linting, and builds only if quality checks pass.

**Use case**: Simple continuous integration
**Demonstrates**: Sequential execution, conditional builds

**Execute with**:
```javascript
await use_mcp_tool('workflows', 'execute_inline_workflow', {
  workflow_yaml: fs.readFileSync('examples/simple-ci-pipeline.yaml', 'utf8'),
  inputs: {
    project_path: '/path/to/project'
  }
})
```

### conditional-deploy.yaml
Environment-based deployment with conditional logic.

**Use case**: Multi-environment deployments
**Demonstrates**: Complex conditions, environment-specific logic, emergency skip options

**Execute with**:
```javascript
await use_mcp_tool('workflows', 'execute_inline_workflow', {
  workflow_yaml: fs.readFileSync('examples/conditional-deploy.yaml', 'utf8'),
  inputs: {
    environment: 'staging',  // or 'production'
    skip_tests: false
  }
})
```

### parallel-testing.yaml
Run multiple test suites in parallel and generate aggregated report.

**Use case**: Fast test execution with comprehensive coverage
**Demonstrates**: Parallel execution, result aggregation, template rendering

**Execute with**:
```javascript
await use_mcp_tool('workflows', 'execute_inline_workflow', {
  workflow_yaml: fs.readFileSync('examples/parallel-testing.yaml', 'utf8'),
  inputs: {
    project_path: '/path/to/project'
  }
})
```

## Learning Path

1. **Start with**: `simple-ci-pipeline.yaml` - Learn basic sequential workflows
2. **Then try**: `conditional-deploy.yaml` - Understand conditional execution
3. **Advanced**: `parallel-testing.yaml` - Master parallel execution and aggregation

## Modifying Examples

These examples are templates. Copy and modify them for your specific needs:

1. Copy the example: `cp examples/simple-ci-pipeline.yaml my-workflow.yaml`
2. Modify inputs, commands, and conditions
3. Test with inline execution
4. Register as a workflow if you'll reuse it

## Additional Resources

- Complete examples with documentation: [references/examples.md](../references/examples.md)
- Variable syntax reference: [references/variable-syntax.md](../references/variable-syntax.md)
- Block types reference: [references/block-executors.md](../references/block-executors.md)
