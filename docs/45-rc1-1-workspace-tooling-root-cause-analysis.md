# RC1.1 Workspace Tooling Root Cause Analysis

## Verdict

The Turbo workspace failure is environment-specific. The repository declares a
valid pnpm workspace and a valid pinned package-manager version. No repository
change is required or appropriate to work around this local Windows/Corepack
shim issue.

## Symptom

Running `corepack pnpm lint` starts Turbo, but Turbo stops before running
package tasks with:

```text
Unable to find package manager binary: cannot find binary path
```

## Evidence and assessment

| Possible cause | Evidence | Likelihood | Impact | Recommended fix |
| --- | --- | --- | --- | --- |
| Repository configuration | Root pins `pnpm@10.14.0`; `corepack pnpm --version` returns `10.14.0`. | Low | None | No repository change. |
| Turbo configuration | Turbo starts, discovers all 11 packages, and executes successfully once `pnpm` is on `PATH`. | Low | Blocks task execution only when the shim is absent. | No `turbo.json` workaround. |
| pnpm workspace configuration | `pnpm-workspace.yaml` has valid package globs and Turbo discovers the expected packages. | Low | None | No change. |
| Corepack | `corepack pnpm` works, but it does not materialize a standalone `pnpm` command for child processes. | High | Turbo cannot run workspace package scripts. | Run `corepack enable pnpm` from an elevated shell or install a user-level Corepack shim. |
| Windows PATH | `Get-Command pnpm` and `where pnpm` failed before the test; `corepack` and `node` were present. | High | Direct root cause. | Put the Corepack shim directory on `PATH`. |
| Local machine configuration | A temporary Corepack shim made `pnpm` resolvable and `turbo lint` completed successfully. | High | Local-only. | Persist the shim installation for this developer machine. |
| Node installation | Node `v24.11.1` and Corepack `0.34.2` are installed and functional. | Low | Indirect only. | Keep Node 24.11.1. |
| Known upstream issue | Turbo shells out to `pnpm` to execute package scripts. Windows/Corepack shim resolution has known reports, including Turbo issue #5976. | Medium-high | Reproduces when no shim is on `PATH`. | Use a Corepack-managed shim rather than a repository script workaround. |

## Reproduction and proof

Before the workaround:

```powershell
Get-Command pnpm
# command not found
corepack pnpm exec turbo lint
# Unable to find package manager binary
```

With a temporary, process-only shim:

```powershell
$shimDir = Join-Path $env:TEMP "hamd-corepack-shim"
New-Item -ItemType Directory -Force -Path $shimDir
corepack enable --install-directory $shimDir pnpm
$env:PATH = "$shimDir;$env:PATH"
corepack pnpm exec turbo lint
# completed successfully across all workspace packages
```

This proves that repository configuration, workspace discovery, and package
scripts are not the cause.

## Permanent solution

Run this once from an elevated PowerShell prompt, then open a new terminal:

```powershell
corepack enable pnpm
```

If the Node installation directory is not writable, create a user-owned shim
directory and add it to the user `PATH`:

```powershell
$shimDir = "$env:LOCALAPPDATA\hamd-corepack-bin"
New-Item -ItemType Directory -Force -Path $shimDir
corepack enable --install-directory $shimDir pnpm
[Environment]::SetEnvironmentVariable(
  "Path",
  "$shimDir;" + [Environment]::GetEnvironmentVariable("Path", "User"),
  "User"
)
```

Restart Cursor and PowerShell, then verify:

```powershell
Get-Command pnpm
pnpm --version
pnpm lint
```

## Temporary workaround

Use this only for the current PowerShell process:

```powershell
$shimDir = Join-Path $env:TEMP "hamd-corepack-shim"
New-Item -ItemType Directory -Force -Path $shimDir
corepack enable --install-directory $shimDir pnpm
$env:PATH = "$shimDir;$env:PATH"
pnpm lint
```

## Repository decision

No change to `package.json`, Turbo, pnpm workspace settings, or application
code is recommended for this incident. A repository workaround would conceal a
developer-machine PATH/Corepack installation defect and could interfere with
other developer or CI environments.
