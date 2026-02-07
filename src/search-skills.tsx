import { List, ActionPanel, Action, Icon, Color, Detail } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useMemo, useState } from "react";

import { SkillDetail } from "./components/SkillDetail";
import {
  type SearchResponse,
  API_BASE_URL,
  formatInstalls,
  buildInstallCommand,
  buildIssueUrl,
  getCompany,
} from "./shared";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [company, setCompany] = useState("all");

  const searchUrl = searchText.length >= 2 ? `${API_BASE_URL}/search?q=${encodeURIComponent(searchText)}&limit=50` : "";

  const { data, isLoading, error, revalidate } = useFetch<SearchResponse>(searchUrl, {
    execute: searchText.length >= 2,
    keepPreviousData: true,
  });

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
        markdown={`# API Error\n\nFailed to fetch data from the skills.sh API.\n\n**Error:** ${error.message}\n\n---\n\nIf the problem persists, please report it via **Report Issue on GitHub**.`}
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
      throttle
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
          {skills.map((skill, index) => (
            <List.Item
              key={skill.id}
              title={skill.name}
              subtitle={skill.source}
              icon={{
                source: Icon.MagnifyingGlass,
                tintColor: index < 3 ? Color.Yellow : Color.Blue,
              }}
              accessories={[{ text: formatInstalls(skill.installs), icon: Icon.Download }]}
              actions={
                <ActionPanel>
                  <Action.Push title="View Details" icon={Icon.Eye} target={<SkillDetail skill={skill} />} />
                  <Action.CopyToClipboard
                    title="Copy Install Command"
                    content={buildInstallCommand(skill)}
                    icon={Icon.Terminal}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  <Action.OpenInBrowser
                    title="Open Repository"
                    url={`https://github.com/${skill.source}`}
                    icon={Icon.Globe}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
