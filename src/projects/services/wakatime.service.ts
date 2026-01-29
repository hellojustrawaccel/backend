import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WakatimeStats {
  totalSeconds: number;
  dailyAverage: number;
  lastSevenDays: number;
}

@Injectable()
export class WakatimeService {
  private readonly logger = new Logger(WakatimeService.name);
  private readonly baseUrl = 'https://wakatime.com/api/v1';
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('WAKATIME_API_KEY') || '';
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Basic ${Buffer.from(this.apiKey).toString('base64')}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

    if (!response.ok) {
      this.logger.error(`WakaTime API error: ${response.status} ${response.statusText}`);
      throw new Error(`WakaTime API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getProjectStats(projectName: string): Promise<WakatimeStats | null> {
    if (!this.apiKey) {
      this.logger.warn('WakaTime API key not configured');
      return null;
    }

    try {
      const [allTimeStats, last7DaysStats] = await Promise.all([
        this.getAllTimeStats(projectName),
        this.getLast7DaysStats(projectName),
      ]);

      return {
        totalSeconds: allTimeStats.totalSeconds,
        dailyAverage: allTimeStats.dailyAverage,
        lastSevenDays: last7DaysStats,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch WakaTime stats for project ${projectName}:`, error);
      return null;
    }
  }

  private async getAllTimeStats(projectName: string): Promise<{
    totalSeconds: number;
    dailyAverage: number;
  }> {
    try {
      const data = await this.fetch<any>(`/users/current/all_time_since_today`);

      const projectData = data.data?.projects?.find(
        (p: any) => p.name.toLowerCase() === projectName.toLowerCase()
      );

      if (!projectData) {
        return { totalSeconds: 0, dailyAverage: 0 };
      }

      const totalSeconds = projectData.total_seconds || 0;
      const dailyAverage = projectData.daily_average || 0;

      return { totalSeconds, dailyAverage };
    } catch {
      return { totalSeconds: 0, dailyAverage: 0 };
    }
  }

  private async getLast7DaysStats(projectName: string): Promise<number> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const data = await this.fetch<any>(
        `/users/current/summaries?start=${start}&end=${end}&project=${encodeURIComponent(projectName)}`
      );

      if (!data.data || !Array.isArray(data.data)) {
        return 0;
      }

      const totalSeconds = data.data.reduce((sum: number, day: any) => {
        return sum + (day.grand_total?.total_seconds || 0);
      }, 0);

      return totalSeconds;
    } catch {
      return 0;
    }
  }
}
