# Workflow Examples

Complete examples demonstrating workflows-mcp usage patterns with tag-based discovery.

## Example 0: Tag-Based Workflow Discovery

**ALWAYS start with tag-based discovery** instead of guessing workflow names.

**Discover Python testing workflows:**
```text
Tool: list_workflows
Parameters: {tags: ['python', 'testing'], format: 'markdown'}
Returns: python-run-tests, python-ci-pipeline, etc.
```

**Discover Git commit workflows:**
```text
Tool: list_workflows
Parameters: {tags: ['git', 'commit'], format: 'json'}
Returns: ["git-commit", "git-commit-and-push"]
```

**Discover all CI workflows:**
```text
Tool: list_workflows
Parameters: {tags: ['ci'], format: 'markdown'}
Returns: All CI-tagged workflows
```

**Discover TDD workflows for specific phase:**
```text
Tool: list_workflows
Parameters: {tags: ['tdd', 'phase1'], format: 'json'}  # AND logic
Returns: ["tdd-phase1-analysis"]
```

**List all workflows (less efficient, use sparingly):**
```text
Tool: list_workflows
Parameters: {tags: [], format: 'json'}  # Empty = all workflows
Returns: All available workflows
```

**Tag categories:**
- **Languages**: `python`, `javascript`, `shell`
- **Task types**: `ci`, `git`, `testing`, `deployment`, `tdd`
- **Operations**: `setup`, `commit`, `checkout`, `lint`, `analysis`
- **Phases**: `phase1`, `phase2`, `phase3`, `phase4`, `phase5`

## Example 1: Run Python CI Pipeline

Complete workflow execution with tag-based discovery.

**Step 1: Discover Python CI workflows**
```text
Tool: list_workflows
Parameters: {tags: ['python', 'ci'], format: 'markdown'}
Shows: python-ci-pipeline, etc.
```

**Step 2: Get workflow details**
```text
Tool: get_workflow_info
Parameters: {workflow: 'python-ci-pipeline', format: 'markdown'}
Shows: Required inputs, outputs, blocks
```

**Step 3: Execute with required inputs**
```text
Tool: execute_workflow
Parameters: {
  workflow: 'python-ci-pipeline',
  inputs: {project_path: '/Users/user/my-project'},
  response_format: 'minimal'
}
```

**Step 4: Check result**
- If `status === 'success'` → CI passed!
- If `status === 'failure'` → Check `error` field for details

## Example 2: Custom Git Workflow

Create and execute inline workflow for feature branch development.

**Workflow YAML:**
```yaml
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
        branch: "feature/{{inputs.feature_name}}"
        create: true

  - id: commit_changes
    type: Workflow
    inputs:
      workflow: "git-commit-and-push"
      inputs:
        message: "{{inputs.commit_message}}"
    depends_on: [create_branch]
    condition: "{{blocks.create_branch.succeeded}}"

outputs:
  branch: "{{blocks.create_branch.outputs.branch}}"
  commit_sha: "{{blocks.commit_changes.outputs.commit_sha}}"
```

**Execute:**
```text
Tool: execute_inline_workflow
Parameters: {
  workflow_yaml: '<yaml above>',
  inputs: {
    feature_name: 'new-api',
    commit_message: 'feat: add new API endpoint'
  }
}
```

## Example 3: Multi-Stage Deployment Pipeline

Complex workflow with conditional deployment based on environment.

```yaml
name: multi-stage-deploy
description: Test, build, and deploy with environment-specific logic

inputs:
  environment:
    type: string
    required: true
    description: "staging or production"
  skip_tests:
    type: boolean
    default: false

blocks:
  # Stage 1: Testing
  - id: run_unit_tests
    type: Shell
    inputs:
      command: "pytest tests/unit/ -v"
    condition: "{{inputs.skip_tests}} == false"

  - id: run_integration_tests
    type: Shell
    inputs:
      command: "pytest tests/integration/ -v"
    condition: "{{inputs.skip_tests}} == false"

  # Stage 2: Build
  - id: build_app
    type: Shell
    inputs:
      command: "npm run build"
    depends_on: [run_unit_tests, run_integration_tests]
    condition: >
      {{inputs.skip_tests}} == true or
      ({{blocks.run_unit_tests.succeeded}} and {{blocks.run_integration_tests.succeeded}})

  # Stage 3: Environment-specific deployment
  - id: deploy_staging
    type: Shell
    inputs:
      command: "./deploy.sh staging"
    depends_on: [build_app]
    condition: >
      {{blocks.build_app.succeeded}} and
      {{inputs.environment}} == 'staging'

  - id: deploy_production
    type: Shell
    inputs:
      command: "./deploy.sh production"
    depends_on: [build_app]
    condition: >
      {{blocks.build_app.succeeded}} and
      {{inputs.environment}} == 'production'

  # Stage 4: Verification
  - id: verify_deployment
    type: Shell
    inputs:
      command: "curl -f https://{{inputs.environment}}.example.com/health"
    depends_on: [deploy_staging, deploy_production]
    condition: >
      {{blocks.deploy_staging.succeeded}} or
      {{blocks.deploy_production.succeeded}}

  # Stage 5: Rollback on failure
  - id: rollback
    type: Shell
    inputs:
      command: "./rollback.sh {{inputs.environment}}"
    depends_on: [verify_deployment]
    condition: "{{blocks.verify_deployment.failed}}"

outputs:
  deployed: "{{blocks.verify_deployment.succeeded}}"
  environment: "{{inputs.environment}}"
  rollback_executed: "{{blocks.rollback.status}} != 'skipped'"
```

## Example 4: File Processing Pipeline

Read, transform, and save data with state tracking.

```yaml
name: data-processor
description: Process input file and generate reports

inputs:
  input_file:
    type: string
    required: true
  output_dir:
    type: string
    default: "./output"

blocks:
  - id: read_input
    type: ReadFile
    inputs:
      path: "{{inputs.input_file}}"

  - id: validate_data
    type: Shell
    inputs:
      command: "python validate.py"
      env:
        DATA_CONTENT: "{{blocks.read_input.content}}"
    depends_on: [read_input]

  - id: process_data
    type: RenderTemplate
    inputs:
      template: |
        # Data Processing Report

        Input File: {{ input_file }}
        File Size: {{ file_size }} bytes
        Validation: {{ validation_status }}

        ## Processed Data
        {{ processed_content }}
      variables:
        input_file: "{{inputs.input_file}}"
        file_size: "{{blocks.read_input.size}}"
        validation_status: "{{blocks.validate_data.succeeded}}"
        processed_content: "{{blocks.read_input.content}}"
    depends_on: [validate_data]
    condition: "{{blocks.validate_data.succeeded}}"

  - id: save_report
    type: CreateFile
    inputs:
      path: "{{inputs.output_dir}}/report.md"
      content: "{{blocks.process_data.rendered}}"
    depends_on: [process_data]

  - id: save_state
    type: SaveState
    inputs:
      path: "{{inputs.output_dir}}/state.json"
      data:
        input_file: "{{inputs.input_file}}"
        input_size: "{{blocks.read_input.size}}"
        output_path: "{{blocks.save_report.path}}"
        validation_passed: "{{blocks.validate_data.succeeded}}"
        timestamp: "{{metadata.start_time}}"
    depends_on: [save_report]

  - id: error_report
    type: CreateFile
    inputs:
      path: "{{inputs.output_dir}}/error.log"
      content: |
        Validation failed for {{inputs.input_file}}
        Error: {{blocks.validate_data.outputs.stderr}}
    depends_on: [validate_data]
    condition: "{{blocks.validate_data.failed}}"

outputs:
  success: "{{blocks.save_state.succeeded}}"
  report_path: "{{blocks.save_report.path}}"
  error_log: "{{blocks.error_report.path}}"
```

## Example 5: Parallel Testing with Aggregation

Run multiple test suites in parallel and aggregate results.

```yaml
name: parallel-test-suite
description: Execute all test types in parallel and generate combined report

inputs:
  project_path:
    type: string
    required: true

blocks:
  # Parallel test execution
  - id: unit_tests
    type: Shell
    inputs:
      working_dir: "{{inputs.project_path}}"

  - id: integration_tests
    type: Shell
    inputs:
      command: "pytest tests/integration/ --junitxml=integration-results.xml"
      working_dir: "{{inputs.project_path}}"

  - id: e2e_tests
    type: Shell
    inputs:
      command: "pytest tests/e2e/ --junitxml=e2e-results.xml"
      working_dir: "{{inputs.project_path}}"

  - id: lint_check
    type: Shell
    inputs:
      command: "ruff check ."
      working_dir: "{{inputs.project_path}}"

  - id: type_check
    type: Shell
    inputs:
      command: "mypy src/"
      working_dir: "{{inputs.project_path}}"

  # Aggregate results
  - id: aggregate_results
    type: RenderTemplate
    inputs:
      template: |
        # Test Results Summary

        ## Test Suites
        - Unit Tests: {{ unit_status }}
        - Integration Tests: {{ integration_status }}
        - E2E Tests: {{ e2e_status }}

        ## Code Quality
        - Linting: {{ lint_status }}
        - Type Checking: {{ type_status }}

        ## Overall Status
        All Passed: {{ all_passed }}
      variables:
        unit_status: "{{blocks.unit_tests.succeeded}}"
        integration_status: "{{blocks.integration_tests.succeeded}}"
        e2e_status: "{{blocks.e2e_tests.succeeded}}"
        lint_status: "{{blocks.lint_check.succeeded}}"
        type_status: "{{blocks.type_check.succeeded}}"
        all_passed: >
          {{blocks.unit_tests.succeeded}} and
          {{blocks.integration_tests.succeeded}} and
          {{blocks.e2e_tests.succeeded}} and
          {{blocks.lint_check.succeeded}} and
          {{blocks.type_check.succeeded}}
    depends_on: [unit_tests, integration_tests, e2e_tests, lint_check, type_check]

  - id: save_summary
    type: CreateFile
    inputs:
      path: "{{inputs.project_path}}/test-summary.md"
      content: "{{blocks.aggregate_results.rendered}}"
    depends_on: [aggregate_results]

outputs:
  all_passed: >
    {{blocks.unit_tests.succeeded}} and
    {{blocks.integration_tests.succeeded}} and
    {{blocks.e2e_tests.succeeded}} and
    {{blocks.lint_check.succeeded}} and
    {{blocks.type_check.succeeded}}
  summary_path: "{{blocks.save_summary.path}}"
```

## Example 6: Interactive Deployment with Approval

Workflow that pauses for user confirmation before production deployment.

```yaml
name: interactive-deploy
description: Deploy with manual approval step

inputs:
  version:
    type: string
    required: true

blocks:
  - id: run_tests
    type: Workflow
    inputs:
      workflow: "python-ci-pipeline"
      inputs:
        project_path: "."

  - id: build_artifact
    type: Shell
    inputs:
      command: "docker build -t myapp:{{inputs.version}} ."
    depends_on: [run_tests]
    condition: "{{blocks.run_tests.succeeded}}"

  - id: ask_approval
    type: Prompt
    inputs:
      message: "Deploy version {{inputs.version}} to production? (yes/no)"
      default: "no"
    depends_on: [build_artifact]
    condition: "{{blocks.build_artifact.succeeded}}"

  - id: deploy_production
    type: Shell
    inputs:
      command: "kubectl apply -f k8s/production/"
    depends_on: [ask_approval]
    condition: "{{blocks.ask_approval.response}} == 'yes'"

  - id: verify_deployment
    type: Shell
    inputs:
      command: "kubectl rollout status deployment/myapp"
    depends_on: [deploy_production]
    condition: "{{blocks.deploy_production.succeeded}}"

outputs:
  deployed: "{{blocks.deploy_production.succeeded}}"
  verified: "{{blocks.verify_deployment.succeeded}}"
  version: "{{inputs.version}}"
```

## Common Usage Patterns

### Pattern: Cleanup Regardless of Success

```yaml
blocks:
  - id: main_operation
    type: Shell
    inputs:
      command: "make build"

  - id: cleanup
    type: Shell
    inputs:
      command: "rm -rf build-cache/"
    depends_on: [main_operation]
    condition: "{{blocks.main_operation.status}} == 'completed'"
```

### Pattern: Retry on Failure

```yaml
blocks:
  - id: attempt_1
    type: Shell
    inputs:
      command: "./flaky-operation.sh"

  - id: attempt_2
    type: Shell
    inputs:
      command: "./flaky-operation.sh"
    depends_on: [attempt_1]
    condition: "{{blocks.attempt_1.failed}}"

  - id: attempt_3
    type: Shell
    inputs:
      command: "./flaky-operation.sh"
    depends_on: [attempt_2]
    condition: "{{blocks.attempt_2.failed}}"

  - id: final_failure
    type: Shell
    inputs:
      command: "echo 'All attempts failed' && exit 1"
    depends_on: [attempt_3]
    condition: "{{blocks.attempt_3.failed}}"
```

### Pattern: Workflow Composition for Reusability

```yaml
blocks:
  - id: setup_env
    type: Workflow
    inputs:
      workflow: "setup-python-env"
      inputs:
        python_version: "{{inputs.python_version}}"

  - id: run_tests
    type: Workflow
    inputs:
            inputs:
              project_path: "{{inputs.project_path}}"
          depends_on: [setup_env]
  - id: run_linting
    type: Workflow
    inputs:
      workflow: "lint-python"
      inputs:
        project_path: "{{inputs.project_path}}"
    depends_on: [setup_env]
```

## Example 7: Real-World Tag-Based Discovery

Discovering and executing the right workflow for a complex task.

**Scenario:** User says "I need to run TDD analysis on my Python project"

**Step 1: Discover TDD workflows**
```text
Tool: list_workflows
Parameters: {tags: ['tdd'], format: 'markdown'}
Shows: tdd-master, tdd-phase1-analysis, tdd-phase2-architecture, etc.
```

**Step 2: Narrow down to analysis phase**
```text
Tool: list_workflows
Parameters: {tags: ['tdd', 'analysis'], format: 'markdown'}
Shows: tdd-phase1-analysis
```

**Step 3: Get workflow details**
```text
Tool: get_workflow_info
Parameters: {workflow: 'tdd-phase1-analysis', format: 'markdown'}
Shows: Required inputs - project_path, project_description
```

**Step 4: Execute**
```bash
Tool: execute_workflow
Parameters: {
  workflow: 'tdd-phase1-analysis',
  inputs: {
    project_path: '/Users/user/my-project',
    project_description: 'A web API for user management'
  },
  response_format: 'minimal'
}
```

**Step 5: Based on result, discover next phase**
```text
If status === 'success':
  Tool: list_workflows
  Parameters: {tags: ['tdd', 'phase2'], format: 'markdown'}
  Shows: tdd-phase2-architecture
```

**Key takeaway**: Tag-based discovery allows you to navigate complex workflow ecosystems without memorizing workflow names. Use broad tags first (`['tdd']`), then narrow down (`['tdd', 'analysis']`).
