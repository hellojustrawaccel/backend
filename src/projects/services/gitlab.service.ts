import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RepoInfo {
  projectId: string;
}

interface CommitActivityWeek {
  week: string;
  total: number;
}

@Injectable()
export class GitlabService {
  private readonly logger = new Logger(GitlabService.name);
  private readonly baseUrl = 'https://gitlab.com/api/v4';
  private readonly token: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('GITLAB_TOKEN') || '';
  }

  private parseRepoUrl(url: string): RepoInfo {
    const match = url.match(/gitlab\.com\/([^\/]+\/[^\/]+)/);
    if (!match) {
      throw new Error('invalid GitLab repository URL');
    }
    const projectPath = match[1].replace(/\.git$/, '');
    return { projectId: encodeURIComponent(projectPath) };
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['PRIVATE-TOKEN'] = this.token;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

    if (!response.ok) {
      this.logger.error(`GitLab API error: ${response.status} ${response.statusText}`);
      throw new Error(`GitLab API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getRepoStats(repositoryUrl: string) {
    const { projectId } = this.parseRepoUrl(repositoryUrl);

    try {
      const [projectData, languages, contributors, commits] = await Promise.all([
        this.getProjectData(projectId),
        this.getLanguages(projectId),
        this.getContributors(projectId),
        this.getCommits(projectId),
      ]);

      const commitActivity = this.processCommitActivity(commits);

      return {
        commitActivity,
        languages,
        stars: projectData.star_count || 0,
        forks: projectData.forks_count || 0,
        openIssues: projectData.open_issues_count || 0,
        openPullRequests: await this.getOpenMRsCount(projectId),
        contributors,
        lastCommitDate: projectData.last_activity_at
          ? new Date(projectData.last_activity_at)
          : null,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch GitLab stats for project ${projectId}:`, error);
      throw error;
    }
  }

  private async getProjectData(projectId: string) {
    return this.fetch<any>(`/projects/${projectId}`);
  }

  private async getLanguages(projectId: string) {
    const languagesData = await this.fetch<Record<string, number>>(
      `/projects/${projectId}/languages`
    );

    const languages: Record<string, number> = {};
    for (const [lang, percentage] of Object.entries(languagesData)) {
      languages[lang] = parseFloat(percentage.toFixed(2));
    }

    return languages;
  }

  private async getContributors(projectId: string) {
    const contributorsData = await this.fetch<any[]>(
      `/projects/${projectId}/repository/contributors?per_page=10`
    );

    return contributorsData.map((contributor) => ({
      login: contributor.name,
      avatar: contributor.avatar_url || '',
      commits: contributor.commits,
    }));
  }

  private async getCommits(projectId: string) {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);

    return this.fetch<any[]>(
      `/projects/${projectId}/repository/commits?since=${since.toISOString()}&per_page=100`
    );
  }

  private processCommitActivity(commits: any[]): {
    weeks: CommitActivityWeek[];
    totalCommits: number;
  } {
    const weekMap = new Map<string, number>();

    commits.forEach((commit) => {
      const commitDate = new Date(commit.created_at);
      const weekStart = new Date(commitDate);
      weekStart.setDate(commitDate.getDate() - commitDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
    });

    const weeks: CommitActivityWeek[] = Array.from(weekMap.entries())
      .map(([week, total]) => ({ week, total }))
      .sort((a, b) => a.week.localeCompare(b.week));

    const totalCommits = commits.length;

    return { weeks, totalCommits };
  }

  private async getOpenMRsCount(projectId: string): Promise<number> {
    try {
      const mrs = await this.fetch<any[]>(
        `/projects/${projectId}/merge_requests?state=opened&per_page=1`
      );
      return Array.isArray(mrs) ? mrs.length : 0;
    } catch {
      return 0;
    }
  }
}
