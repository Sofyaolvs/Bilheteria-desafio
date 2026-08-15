export interface CatalogItem {
  externalId: string;
  source: 'ticketmaster' | 'local';
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  venueName: string;
  venueCity: string;
  suggestedDate: string | null; // ISO date sugerida pelo catálogo (organizador pode alterar)
  classification: string | null;
}
