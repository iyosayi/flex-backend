import { Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';

interface OverviewQuery {
  location?: string | string[];
  from?: string | string[];
  to?: string | string[];
  sections?: string | string[];
}

type SectionKey =
  | 'totals'
  | 'recent'
  | 'topGood'
  | 'topBad'
  | 'types'
  | 'period'
  | 'stays'
  | 'insights';

const SECTION_ALIASES: Record<SectionKey, string[]> = {
  totals: ['total', 'totals'],
  recent: ['recent'],
  topGood: ['top', 'good', 'topgood'],
  topBad: ['bottom', 'bad', 'topbad'],
  types: ['types', 'type'],
  period: ['period', 'histogram'],
  stays: ['stays', 'length'],
  insights: ['insights', 'cards'],
};

@Injectable()
export class OverviewService {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async getOverview(query: OverviewQuery) {
    const filters = await this.analyticsService.createFilters({
      location: query.location,
      from: query.from,
      to: query.to,
    });
    const filteredReviews = await this.analyticsService.filterReviews(filters);

    const sectionsMeta = this.buildSectionsMeta(query);

    const response: Record<string, unknown> = {
      meta: {
        filters: sectionsMeta,
        generatedAt: new Date().toISOString(),
      },
    };

    const sectionsFilter = this.parseSections(query.sections);
    const include = (section: SectionKey) => this.shouldInclude(section, sectionsFilter);

    if (include('totals')) {
      response.totals = this.analyticsService.aggregateTotals(filteredReviews);
    }

    if (include('recent')) {
      response.recent = await this.analyticsService.aggregateRecent(filteredReviews, {
        page: 1,
        limit: 5,
      }).then((result) => result.data);
    }

    const propertyStats = await this.analyticsService.computePropertyStats(filteredReviews);

    if (include('topGood')) {
      response.topGood = this.analyticsService.pickTop(propertyStats, 'desc', {
        limit: 5,
      });
    }

    if (include('topBad')) {
      response.topBad = this.analyticsService.pickTop(propertyStats, 'asc', {
        limit: 5,
      });
    }

    let typesSection: { goodPct: number; neutralPct: number; badPct: number; timeSeries: unknown[] } | undefined;
    if (include('types')) {
      typesSection = this.analyticsService.aggregateTypes(filteredReviews, 'month');
      response.types = typesSection;
    }

    if (include('period')) {
      response.period = this.analyticsService.aggregateVolume(filteredReviews, 'week');
    }

    if (include('stays')) {
      response.stays = await this.analyticsService.aggregateStays(filteredReviews);
    }

    if (include('insights')) {
      const insightsTypes = typesSection ?? this.analyticsService.aggregateTypes(filteredReviews, 'month');
      response.insights = await this.analyticsService.aggregateInsights(filteredReviews, insightsTypes);
    }

    return response;
  }

  private buildSectionsMeta(query: OverviewQuery) {
    const filters: Record<string, string> = {};
    const location = this.unwrapQueryParam(query.location)?.trim();
    const from = this.unwrapQueryParam(query.from)?.trim();
    const to = this.unwrapQueryParam(query.to)?.trim();

    if (location) {
      filters.location = location;
    }
    if (from && !Number.isNaN(new Date(from).valueOf())) {
      filters.from = from;
    }
    if (to && !Number.isNaN(new Date(to).valueOf())) {
      filters.to = to;
    }

    return filters;
  }

  private parseSections(value: string | string[] | undefined) {
    const segments = this.unwrapAll(value)
      .flatMap((entry) => entry.split(','))
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);

    return segments.length ? new Set(segments) : undefined;
  }

  private unwrapQueryParam(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private unwrapAll(value: string | string[] | undefined) {
    if (!value) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  private shouldInclude(section: SectionKey, sections?: Set<string>) {
    if (!sections || sections.size === 0) {
      return true;
    }

    const aliases = SECTION_ALIASES[section];
    return aliases.some((alias) => sections.has(alias));
  }
}
