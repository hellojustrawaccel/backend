import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RepoInfo {
  owner: string;
  repo: string;
}

interface CommitActivityWeek {
  week: string;
  total: number;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly baseUrl = 'https://api.github.com';
  private readonly token: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('GITHUB_TOKEN') || '';
  }

  private parseRepoUrl(url: string): RepoInfo {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('invalid GitHub repository URL');
    }
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

    if (!response.ok) {
      this.logger.error(`GitHub API error: ${response.status} ${response.statusText}`);
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getRepoStats(repositoryUrl: string) {
    const { owner, repo } = this.parseRepoUrl(repositoryUrl);

    try {
      const [repoData, languages, contributors, commitActivity] = await Promise.all([
        this.getRepoData(owner, repo),
        this.getLanguages(owner, repo),
        this.getContributors(owner, repo),
        this.getCommitActivity(owner, repo),
      ]);

      return {
        commitActivity,
        languages,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        openPullRequests: await this.getOpenPRsCount(owner, repo),
        contributors,
        lastCommitDate: repoData.pushed_at ? new Date(repoData.pushed_at) : null,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch GitHub stats for ${owner}/${repo}:`, error);
      throw error;
    }
  }

  private async getRepoData(owner: string, repo: string) {
    return this.fetch<any>(`/repos/${owner}/${repo}`);
  }

  private async getLanguages(owner: string, repo: string) {
    const languagesData = await this.fetch<Record<string, number>>(
      `/repos/${owner}/${repo}/languages`
    );

    const total = Object.values(languagesData).reduce((sum, bytes) => sum + bytes, 0);

    const languages: Record<string, number> = {};
    for (const [lang, bytes] of Object.entries(languagesData)) {
      languages[lang] = parseFloat(((bytes / total) * 100).toFixed(2));
    }

    return languages;
  }

  private async getContributors(owner: string, repo: string) {
    const contributorsData = await this.fetch<any[]>(
      `/repos/${owner}/${repo}/contributors?per_page=10`
    );

    return contributorsData.map((contributor) => ({
      login: contributor.login,
      avatar: contributor.avatar_url,
      commits: contributor.contributions,
    }));
  }

  private async getCommitActivity(owner: string, repo: string) {
    const activity = await this.fetch<any[]>(`/repos/${owner}/${repo}/stats/participation`);

    const weeks: CommitActivityWeek[] = [];
    const now = new Date();

    if (activity && Array.isArray(activity)) {
      const allCommits = (activity as any).all || [];

      allCommits.forEach((total: number, index: number) => {
        const weekDate = new Date(now);
        weekDate.setDate(weekDate.getDate() - (allCommits.length - index) * 7);

        weeks.push({
          week: weekDate.toISOString().split('T')[0],
          total,
        });
      });
    }

    const totalCommits = weeks.reduce((sum, week) => sum + week.total, 0);

    return {
      weeks,
      totalCommits,
    };
  }

  private async getOpenPRsCount(owner: string, repo: string): Promise<number> {
    try {
      const prs = await this.fetch<any[]>(
        `/repos/${owner}/${repo}/pulls?state=open&per_page=1`
      );
      return Array.isArray(prs) ? prs.length : 0;
    } catch {
      return 0;
    }
  }
}
