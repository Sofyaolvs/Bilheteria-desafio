import { CatalogItem } from './catalog-item.interface';

// Catálogo local usado como fallback quando TICKETMASTER_API_KEY não está
// configurada (ex.: avaliação offline, sem depender de uma chave externa).
// Decisão registrada no README: sem isso, o organizador ficaria sem nada
// para montar um evento em ambientes sem a chave.
export const LOCAL_CATALOG_FIXTURES: CatalogItem[] = [
  {
    externalId: 'local-1',
    source: 'local',
    title: 'Noite de Rock Nacional',
    subtitle: 'Turnê 2026',
    imageUrl: 'https://picsum.photos/seed/rock-nacional/600/400',
    venueName: 'Arena Music Hall',
    venueCity: 'São Paulo',
    suggestedDate: null,
    classification: 'Música',
  },
  {
    externalId: 'local-2',
    source: 'local',
    title: 'Stand Up: Risadas Garantidas',
    subtitle: 'Especial de comédia',
    imageUrl: 'https://picsum.photos/seed/standup/600/400',
    venueName: 'Teatro Central',
    venueCity: 'Rio de Janeiro',
    suggestedDate: null,
    classification: 'Comédia',
  },
  {
    externalId: 'local-3',
    source: 'local',
    title: 'Festival de Jazz e Blues',
    subtitle: 'Edição de verão',
    imageUrl: 'https://picsum.photos/seed/jazzblues/600/400',
    venueName: 'Parque das Artes',
    venueCity: 'Curitiba',
    suggestedDate: null,
    classification: 'Música',
  },
];
