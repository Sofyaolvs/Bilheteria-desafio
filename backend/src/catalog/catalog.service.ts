import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CatalogItem } from './catalog-item.interface';
import { LOCAL_CATALOG_FIXTURES } from './catalog.fixtures';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly config: ConfigService) {}

  async search(keyword?: string, city?: string): Promise<{
    source: 'ticketmaster' | 'local';
    items: CatalogItem[];
  }> {
    const apiKey = this.config.get<string>('TICKETMASTER_API_KEY');

    if (!apiKey) {
      return { source: 'local', items: this.filterLocal(keyword, city) };
    }

    try {
      const { data } = await axios.get(
        'https://app.ticketmaster.com/discovery/v2/events.json',
        {
          params: {
            apikey: apiKey,
            keyword,
            city,
            size: 20,
            locale: '*',
          },
          timeout: 8000,
        },
      );

      const events = data?._embedded?.events ?? [];
      const items: CatalogItem[] = events.map((event: any) => {
        const venue = event._embedded?.venues?.[0];
        const image =
          event.images?.find((img: any) => img.width >= 500)?.url ??
          event.images?.[0]?.url ??
          null;
        return {
          externalId: event.id,
          source: 'ticketmaster',
          title: event.name,
          subtitle: event.info ?? event.classifications?.[0]?.segment?.name ?? null,
          imageUrl: image,
          venueName: venue?.name ?? 'Local a definir',
          venueCity: venue?.city?.name ?? 'Cidade a definir',
          suggestedDate: event.dates?.start?.dateTime ?? null,
          classification: event.classifications?.[0]?.segment?.name ?? null,
        };
      });
      return { source: 'ticketmaster', items };
    } catch (err) {
      // Não deixamos a falha da API externa derrubar o fluxo do organizador:
      // caímos no catálogo local e sinalizamos o problema no log/README.
      this.logger.warn(
        `Falha ao consultar Ticketmaster Discovery API, usando catálogo local. Motivo: ${err?.message}`,
      );
      return { source: 'local', items: this.filterLocal(keyword, city) };
    }
  }

  private filterLocal(keyword?: string, city?: string): CatalogItem[] {
    return LOCAL_CATALOG_FIXTURES.filter((item) => {
      const matchesKeyword = keyword
        ? item.title.toLowerCase().includes(keyword.toLowerCase())
        : true;
      const matchesCity = city
        ? item.venueCity.toLowerCase().includes(city.toLowerCase())
        : true;
      return matchesKeyword && matchesCity;
    });
  }
}
