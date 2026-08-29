const UTM_SOURCE = 'personal_outline';

export function withUtm(url: string): string {
    const parsed = new URL(url);
    parsed.searchParams.set('utm_source', UTM_SOURCE);
    return parsed.toString();
}
