import { List, ActionPanel, Action, Icon, Color, Detail } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";

type Skill = {
  id: string;
  name: string;
  installs: number;
  topSource: string;
};

type SkillsResponse = {
  skills: Skill[];
  hasMore: boolean;
};

const API_BASE_URL = "https://skills.sh/api/skills";

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
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const { data, isLoading } = useFetch<SkillsResponse>(API_BASE_URL, {
    keepPreviousData: true,
  });

  const skills = data?.skills ?? [];

  if (selectedSkill) {
    return <SkillDetail skill={selectedSkill} onBack={() => setSelectedSkill(null)} />;
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter skills...">
      <List.Section title="All Time Ranking" subtitle={`${skills.length} skills`}>
        {skills.map((skill, index) => (
          <List.Item
            key={skill.id}
            title={`#${index + 1} ${skill.name}`}
            subtitle={skill.topSource}
            keywords={[skill.name, skill.topSource, skill.id]}
            icon={{
              source: Icon.Trophy,
              tintColor: index < 3 ? Color.Yellow : Color.SecondaryText,
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
                <Action.OpenInBrowser
                  title="Open skills.sh"
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
