//src/lib/tools.ts

import { toolsData } from "@/config/tools-data";
import type {
  ToolCategory,
  ToolDefinition,
  ToolTag,
} from "@/config/tools-data";

export type ToolSortKey = "alphabetical" | "recent" | "created";
export type ToolCategoryFilter = "All" | ToolCategory;
export type LiveTool = ToolDefinition & { path: string };

export const TOOL_SORT_OPTIONS: { key: ToolSortKey; label: string }[] = [
  { key: "alphabetical", label: "A–Z" },
  { key: "recent", label: "Recently updated" },
  { key: "created", label: "Creation date" },
];

export const NEW_TOOL_WINDOW_DAYS = 7;
export const FEATURED_TOOL_LIMIT = 2;

export const TOOL_CATEGORY_FILTERS: ToolCategoryFilter[] = [
  "All",
  ...Array.from(new Set(toolsData.map((tool) => tool.category))),
];

function normalizePath(path: ToolDefinition["path"]): string | null {
  if (typeof path !== "string") return null;
  const trimmed = path.trim();
  return trimmed.length ? trimmed : null;
}

export function isToolLive(tool: ToolDefinition): tool is LiveTool {
  const normalized = normalizePath(tool.path);
  return Boolean(normalized);
}

export function getLivePath(tool: ToolDefinition): string | null {
  return normalizePath(tool.path);
}

export function getLiveTools(data: ToolDefinition[] = toolsData): LiveTool[] {
  return data.filter(isToolLive);
}

export function hasToolTag(tool: ToolDefinition, tag: ToolTag): boolean {
  return Boolean(tool.tags?.includes(tag));
}

export function getFeaturedTools(
  data: ToolDefinition[] = toolsData,
): ToolDefinition[] {
  return data.filter((tool) => hasToolTag(tool, "FEATURED"));
}

function getDaysAgo(dateString: string): number | null {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function formatToolUpdated(dateString: string): string {
  const days = getDaysAgo(dateString);
  if (days === null) return "Updated";
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated 1 day ago";
  if (days < 30) return `Updated ${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "Updated 1 month ago";
  return `Updated ${months} months ago`;
}

export function isNewTool(dateString: string, windowDays = NEW_TOOL_WINDOW_DAYS) {
  const daysAgo = getDaysAgo(dateString);
  return daysAgo !== null && daysAgo <= windowDays;
}

export function sortTools(
  tools: ToolDefinition[],
  sortKey: ToolSortKey,
): ToolDefinition[] {
  const cloned = [...tools];
  switch (sortKey) {
    case "recent":
      return cloned.sort(
        (a, b) => +new Date(b.lastUpdated) - +new Date(a.lastUpdated),
      );
    case "created":
      return cloned.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();

        const aInvalid = Number.isNaN(aTime);
        const bInvalid = Number.isNaN(bTime);

        if (aInvalid && bInvalid) return 0;
        if (aInvalid) return 1;
        if (bInvalid) return -1;

        if (aTime === bTime) {
          return a.name.localeCompare(b.name);
        }

        return aTime - bTime;
      });
    case "alphabetical":
    default:
      return cloned.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function filterTools<T extends ToolDefinition>(
  tools: T[],
  {
    query = "",
    category = "All",
  }: { query?: string; category?: ToolCategoryFilter },
): T[] {
  const lowered = query.toLowerCase();
  return tools.filter((tool) => {
    const matchesCategory = category === "All" || tool.category === category;
    if (!lowered) return matchesCategory;
    return (
      matchesCategory &&
      (tool.name.toLowerCase().includes(lowered) ||
        tool.description.toLowerCase().includes(lowered))
    );
  });
}
