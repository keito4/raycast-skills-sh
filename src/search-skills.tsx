import { List, ActionPanel, Action, Icon, Detail } from "@raycast/api";
import { useMemo, useState } from "react";

import { SkillListItem } from "./components/SkillListItem";
import { useDebouncedSearch } from "./hooks/useDebouncedSearch";
import { buildIssueUrl, getCompany } from "./shared";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [company, setCompany] = useState("all");

  const { data, isLoading, error, revalidate, searchUrl } = useDebouncedSearch(searchText);

  const allSkills = data?.skills ?? [];
  const companyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of allSkills) {
      const c = getCompany(s);
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return new Map([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
  }, [allSkills]);
  const skills = company === "all" ? allSkills : allSkills.filter((s) => getCompany(s) === company);

  if (error && !data) {
    return (
      <Detail
        markdown={`# API Error\n\nFailed to fetch data from the Skills API.\n\n**Error:** ${error.message}\n\n---\n\nIf the problem persists, please report it via **Report Issue on GitHub**.`}
        actions={
          <ActionPanel>
            <Action title="Clear Cache & Retry" onAction={revalidate} icon={Icon.RotateClockwise} />
            <Action.OpenInBrowser
              title="Report Issue on GitHub"
              url={buildIssueUrl(searchUrl, error)}
              icon={Icon.Bug}
            />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search skills..."
      onSearchTextChange={setSearchText}
      searchBarAccessory={
        <List.Dropdown tooltip="Filter by Company" storeValue onChange={setCompany}>
          <List.Dropdown.Item title="All Companies" value="all" />
          <List.Dropdown.Section title="Companies">
            {[...companyCounts.entries()].map(([c, count]) => (
              <List.Dropdown.Item key={c} title={`${c} (${count})`} value={c} />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {searchText.length < 2 || (skills.length === 0 && !isLoading) ? (
        <List.EmptyView
          title={searchText.length >= 2 ? "No Skills Found" : "Search Skills"}
          description={
            searchText.length >= 2 ? `No results for "${searchText}"` : "Type at least 2 characters to search"
          }
          icon={Icon.MagnifyingGlass}
        />
      ) : (
        <List.Section title={`Results for "${searchText}"`} subtitle={`${skills.length} skills`}>
          {skills.map((skill) => (
            <SkillListItem key={skill.id} skill={skill} />
          ))}
        </List.Section>
      )}
    </List>
  );
}
