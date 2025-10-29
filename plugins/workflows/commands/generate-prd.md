---
description: "Generate comprehensive PRD through interactive 6-phase conversation with workflow-guided process"
argument-hint: "[project-name | topic]"
allowed-tools: [mcp__plugin_workflows_workflows__execute_workflow, mcp__plugin_workflows_workflows__get_workflow_info, mcp__plugin_workflows_workflows__resume_workflow, mcp__plugin_workflows_workflows__list_checkpoints]
---

# generate-prd

Generate a comprehensive Product Requirements Document through an interactive workflow that guides both you and Claude through 6 structured architectural phases.

## Usage

```bash
# As a workflows plugin command
/workflows:generate-prd [project-name]

# Direct workflow execution via MCP tool
execute_workflow('prd-interactive-generation', {project_name: 'my-project'})
```

## What Happens

The **prd-interactive-generation** workflow:

1. **Creates isolated git worktree** (`prd/<project-name>` branch)
2. **Guides through 6 phases** with structured prompts:
   - Phase 1: System Discovery & Problem Context
   - Phase 2: Constraint Analysis & System Boundaries
   - Phase 3: Service Architecture & Component Design
   - Phase 4: Technology Stack & Infrastructure
   - Phase 5: Quality Attributes & Risk Assessment
   - Phase 6: Validation & Documentation

3. **Accumulates responses** into structured PRD format
4. **Generates PRD document** in worktree (PROJECT.md or ARCHITECTURE.md)
5. **Creates git commit** with semantic message
6. **Opens GitHub PR** for review
7. **Optionally extracts features** and creates GitHub issues

## Execution

Execute the workflow with minimal configuration:

```text
Tool: execute_workflow
Parameters:
  workflow: 'prd-interactive-generation'
  inputs:
    project_name: '$ARGUMENTS'  # Or provide directly
    output_filename: 'PROJECT.md'  # Optional: can use 'ARCHITECTURE.md'
  response_format: 'minimal'
```

## Interactive Flow

The workflow pauses at each phase using **Prompt blocks**:

1. **Prompts you** with structured questions
2. **You provide** detailed responses
3. **Workflow guides Claude** with instructions for analysis
4. **Confirmation step** allows refinement before proceeding
5. **Accumulates all data** for final PRD generation

**Example Interaction:**

```text
Workflow: "PHASE 1: System Discovery - Provide system name, core problem, users..."
You: "Payment Gateway system that processes credit card transactions..."
Workflow: "Phase 1 captured. Type 'proceed' or 'refine' to update..."
You: "proceed"
Workflow: "PHASE 2: Constraints - Define technical constraints, boundaries..."
```

## Resuming Interrupted Workflows

If workflow pauses, resume using checkpoints:

```text
# List available checkpoints
Tool: list_checkpoints
Parameters: {workflow_name: 'prd-interactive-generation'}

# Resume with your response
Tool: resume_workflow
Parameters:
  checkpoint_id: '<checkpoint_id>'
  response: '<your answer to the prompt>'
```

## Outputs

```yaml
prd_path: "/<worktree-path>/PROJECT.md"
commit_sha: "<git-commit-sha>"
pr_url: "https://github.com/<org>/<repo>/pull/<number>"
worktree_path: "/<absolute-path>/.../<project>/.worktrees/prd/<sanitized-name>"
branch_name: "prd/<sanitized-name>"
issue_count: "<number-of-issues-created>" # If feature extraction enabled
```

## Configuration Options

**Output Filename:**
```yaml
inputs:
  output_filename: "PROJECT.md"  # Default
  # OR
  output_filename: "ARCHITECTURE.md"  # Alternative
```

**Feature Extraction:**
At the end, workflow prompts whether to extract features from roadmap and create GitHub issues.

## Best Practices

### Providing Responses

- **Be comprehensive**: Include technical details, requirements, constraints
- **Be specific**: Use measurable targets (e.g., "< 200ms response time" not "fast")
- **Reference context**: Mention similar systems, industry patterns, standards
- **Consider trade-offs**: Acknowledge constraints and decisions

### For Claude/LLM

The workflow includes instructions at each phase:
- Research similar systems and patterns
- Validate technical feasibility
- Apply YAGNI/KISS/DRY principles
- Assess security, performance, quality implications
- Provide architectural recommendations

### Refinement Workflow

At each phase confirmation, you can:
- Type `proceed` to continue
- Type `refine <updates>` to revise current phase
- Type `expand <details>` to add more information

### Phase 6 - Final Review

After all phases, review the complete PRD data before generation:
- Type `generate` to create the document
- Type `refine-N` (N=1-6) to revise a specific phase
- Type `abort` to cancel

## File Location

PRD is generated in isolated worktree:

```text
.worktrees/prd/<sanitized-name>/PROJECT.md
```

After PR merge, cleanup:

```bash
git worktree remove .worktrees/prd/<sanitized-name>
git branch -d prd/<sanitized-name>
```

## Workflow Composition

This command orchestrates four workflows:

- **prd-setup**: Git worktree isolation
- **prd-interactive-generation**: Interactive 6-phase conversation (main)
- **prd-finalize**: Document generation, commit, PR creation
- **prd-extract-features**: Feature → GitHub issues (optional)

## Troubleshooting

**Workflow paused unexpectedly:**
```bash
# Check for checkpoints
list_checkpoints(workflow_name='prd-interactive-generation')

# Resume
resume_workflow(checkpoint_id='<id>', response='<your response>')
```

**Want to change responses:**
Use the confirmation steps at each phase to refine before proceeding.

**Generated PRD has placeholder text:**
Ensure you provided comprehensive responses at each phase. Re-run specific phases if needed.

**PR creation failed:**
- Ensure `gh` CLI is authenticated
- Verify remote repository is configured
- Check branch push succeeded

## Related Commands

**Note:** The following commands are from external command sets (if installed):

- `/qts:execute-prp` - Execute Project Requirements Plan
- `/qts:decide` - Multi-agent decision analysis
- `/qts:generate-prp` - Generate PRP from GitHub issues

## Architecture Notes

This workflow is **self-contained** and guides both user and Claude through the PRD creation process. Unlike traditional approaches that require extensive specialist coordination, this workflow:

- **Embeds guidance** directly in prompts for Claude
- **Structures user input** through clear questions
- **Accumulates data** progressively across phases
- **Generates document** directly from accumulated responses
- **Handles git operations** automatically

The result is a consistent, high-quality PRD generated through an interactive but structured process.
