import { List, ActionPanel, Action, Icon, Color, Detail } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";

type Skill = {
  id: string;
  name: string;
  installs: number;
  topSource: string;
};

type SearchResponse = {
  query: string;
  searchType: string;
  skills: Skill[];
};

type SkillsResponse = {
  skills: Skill[];
  hasMore: boolean;
};

const API_BASE_URL = "https://skills.sh/api";

function formatInstalls(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

function SkillDetail({ skill, onBack }: { skill: Skill; onBack: () => void }) {
  const readmeUrl = `https://raw.githubusercontent.com/${skill.topSource}/main/README.md`;
  const { data: readme, isLoading } = useFetch<string>(readmeUrl, {
    parseResponse: (response) => response.text(),
    failureToastOptions: { title: "" },
    onError: () => {},
  });

  const fallbackReadmeUrl = `https://raw.githubusercontent.com/${skill.topSource}/master/README.md`;
  const { data: fallbackReadme } = useFetch<string>(fallbackReadmeUrl, {
    execute: !readme && !isLoading,
    parseResponse: (response) => response.text(),
    failureToastOptions: { title: "" },
    onError: () => {},
  });

  const content = readme || fallbackReadme;

  const markdown = content
    ? content
    : `# ${skill.name}

**Repository:** [${skill.topSource}](https://github.com/${skill.topSource})

**Installs:** ${formatInstalls(skill.installs)}

---

\`\`\`bash
npx skills add ${skill.topSource}
\`\`\`
`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle={skill.name}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Name" text={skill.name} />
          <Detail.Metadata.Label title="Installs" text={formatInstalls(skill.installs)} icon={Icon.Download} />
          <Detail.Metadata.Link
            title="Repository"
            target={`https://github.com/${skill.topSource}`}
            text={skill.topSource}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Install Command" text={`npx skills add ${skill.topSource}`} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Install Command"
            content={`npx skills add ${skill.topSource}`}
            icon={Icon.Terminal}
          />
          <Action.OpenInBrowser
            title="Open Repository"
            url={`https://github.com/${skill.topSource}`}
            icon={Icon.Globe}
          />
          <Action.CopyToClipboard
            title="Copy Skill Name"
            content={skill.name}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action
            title="Back to List"
            icon={Icon.ArrowLeft}
            onAction={onBack}
            shortcut={{ modifiers: ["cmd"], key: "backspace" }}
          />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const searchUrl =
    searchText.length > 0
      ? `${API_BASE_URL}/search?q=${encodeURIComponent(searchText)}&limit=50`
      : `${API_BASE_URL}/skills`;

  const { data, isLoading } = useFetch<SearchResponse | SkillsResponse>(searchUrl, {
    keepPreviousData: true,
  });

  const skills = data?.skills ?? [];
  const isSearching = searchText.length > 0;

  if (selectedSkill) {
    return <SkillDetail skill={selectedSkill} onBack={() => setSelectedSkill(null)} />;
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search skills..." onSearchTextChange={setSearchText} throttle>
      {skills.length === 0 && !isLoading ? (
        <List.EmptyView
          title="No Skills Found"
          description={searchText ? `No results for "${searchText}"` : "Start typing to search"}
          icon={Icon.MagnifyingGlass}
        />
      ) : (
        <List.Section
          title={isSearching ? `Results for "${searchText}"` : "Top Skills"}
          subtitle={`${skills.length} skills`}
        >
          {skills.map((skill, index) => (
            <List.Item
              key={skill.id}
              title={isSearching ? skill.name : `#${index + 1} ${skill.name}`}
              subtitle={skill.topSource}
              icon={{
                source: isSearching ? Icon.MagnifyingGlass : Icon.Trophy,
                tintColor: !isSearching && index < 3 ? Color.Yellow : Color.Blue,
              }}
              accessories={[{ text: formatInstalls(skill.installs), icon: Icon.Download }]}
              actions={
                <ActionPanel>
                  <Action title="View Details" icon={Icon.Eye} onAction={() => setSelectedSkill(skill)} />
                  <Action.CopyToClipboard
                    title="Copy Install Command"
                    content={`npx skills add ${skill.topSource}`}
                    icon={Icon.Terminal}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  <Action.OpenInBrowser
                    title="Open Repository"
                    url={`https://github.com/${skill.topSource}`}
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
