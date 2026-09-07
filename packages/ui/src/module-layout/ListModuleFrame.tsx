import { ModuleWorkspace, type ModuleWorkspaceProps } from "./ModuleWorkspace.js";

export type ListModuleFrameProps = ModuleWorkspaceProps;

/**
 * Standard workspace list: static header + toolbar, scrolling records only.
 */
export function ListModuleFrame(props: ListModuleFrameProps) {
  return <ModuleWorkspace {...props} />;
}
