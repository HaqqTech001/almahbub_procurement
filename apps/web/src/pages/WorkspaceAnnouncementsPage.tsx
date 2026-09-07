import { AnnouncementsPage } from "./AnnouncementsPage.js";

export function WorkspaceAnnouncementsPage() {
  return (
    <div className="hamd-workspace-announcements hamd-list-queue">
      <AnnouncementsPage basePath="/app/announcements" />
    </div>
  );
}
