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

const BROWSE_URL = `${API_BASE_URL}/search?q=skill&limit=50`;

export default function Command() {
  const [company, setCompany] = useState("all");

  const { data, isLoading, error, revalidate } = useFetch<SearchResponse>(BROWSE_URL, {
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
              url={buildIssueUrl(BROWSE_URL, error)}
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
      searchBarPlaceholder="Filter skills..."
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
      <List.Section title="Popular Skills" subtitle={`${skills.length} skills`}>
        {skills.map((skill, index) => (
          <List.Item
            key={skill.id}
            title={`#${index + 1} ${skill.name}`}
            subtitle={skill.source}
            keywords={[skill.name, skill.source, skill.id]}
            icon={{
              source: Icon.Trophy,
              tintColor: index < 3 ? Color.Yellow : Color.SecondaryText,
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
                <Action.OpenInBrowser
                  title="Open Skills.sh"
                  url="https://skills.sh/"
                  icon={Icon.Link}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
                <Action.CopyToClipboard
                  title="Copy Skill Name"
                  content={skill.name}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
