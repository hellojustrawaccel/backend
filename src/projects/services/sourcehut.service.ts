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
export class SourcehutService {
  private readonly logger = new Logger(SourcehutService.name);
  private readonly baseUrl = 'https://git.sr.ht/api';
  private readonly token: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('SOURCEHUT_TOKEN') || '';
  }

  private parseRepoUrl(url: string): RepoInfo {
    const match = url.match(/git\.sr\.ht\/~([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('invalid SourceHut repository URL');
    }
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

    if (!response.ok) {
      this.logger.error(`SourceHut API error: ${response.status} ${response.statusText}`);
      throw new Error(`SourceHut API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getRepoStats(repositoryUrl: string) {
    const { owner, repo } = this.parseRepoUrl(repositoryUrl);

    try {
      const [repoData, commits] = await Promise.all([
        this.getRepoData(owner, repo),
        this.getCommits(owner, repo),
      ]);

      const commitActivity = this.processCommitActivity(commits);

      return {
        commitActivity,
        languages: {},
        stars: 0,
        forks: 0,
        openIssues: 0,
        openPullRequests: 0,
        contributors: [],
        lastCommitDate: commits.length > 0 ? new Date(commits[0].timestamp) : null,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch SourceHut stats for ~${owner}/${repo}:`, error);
      throw error;
    }
  }

  private async getRepoData(owner: string, repo: string) {
    return this.fetch<any>(`/~${owner}/repos/${repo}`);
  }

  private async getCommits(owner: string, repo: string) {
    try {
      return await this.fetch<any[]>(`/~${owner}/repos/${repo}/log`);
    } catch {
      return [];
    }
  }

  private processCommitActivity(commits: any[]): {
    weeks: CommitActivityWeek[];
    totalCommits: number;
  } {
    const weekMap = new Map<string, number>();

    commits.forEach((commit) => {
      const commitDate = new Date(commit.timestamp || commit.created_at);
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
}
