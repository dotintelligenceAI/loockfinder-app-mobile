import { supabase } from './supabase';

export type Region = 'BR' | 'US' | 'EU' | 'OTHER';
export type Currency = 'BRL' | 'USD' | 'EUR';

export interface GeolocationData {
  country: string;
  countryCode: string;
  region: Region;
  currency: Currency;
  timezone: string;
  city?: string;
  regionName?: string;
}

export interface CurrencyConfig {
  currency: Currency;
  symbol: string;
  locale: string;
  region: Region;
}

// Mapeamento de países para regiões e moedas
const COUNTRY_MAPPING: Record<string, { region: Region; currency: Currency }> = {
  // Brasil
  'BR': { region: 'BR', currency: 'BRL' },
  
  // Estados Unidos
  'US': { region: 'US', currency: 'USD' },
  
  // Europa (EUR)
  'AT': { region: 'EU', currency: 'EUR' }, // Áustria
  'BE': { region: 'EU', currency: 'EUR' }, // Bélgica
  'CY': { region: 'EU', currency: 'EUR' }, // Chipre
  'EE': { region: 'EU', currency: 'EUR' }, // Estônia
  'FI': { region: 'EU', currency: 'EUR' }, // Finlândia
  'FR': { region: 'EU', currency: 'EUR' }, // França
  'DE': { region: 'EU', currency: 'EUR' }, // Alemanha
  'GR': { region: 'EU', currency: 'EUR' }, // Grécia
  'IE': { region: 'EU', currency: 'EUR' }, // Irlanda
  'IT': { region: 'EU', currency: 'EUR' }, // Itália
  'LV': { region: 'EU', currency: 'EUR' }, // Letônia
  'LT': { region: 'EU', currency: 'EUR' }, // Lituânia
  'LU': { region: 'EU', currency: 'EUR' }, // Luxemburgo
  'MT': { region: 'EU', currency: 'EUR' }, // Malta
  'NL': { region: 'EU', currency: 'EUR' }, // Holanda
  'PT': { region: 'EU', currency: 'EUR' }, // Portugal
  'SK': { region: 'EU', currency: 'EUR' }, // Eslováquia
  'SI': { region: 'EU', currency: 'EUR' }, // Eslovênia
  'ES': { region: 'EU', currency: 'EUR' }, // Espanha
  
  // Outros países (fallback para USD)
  'CA': { region: 'OTHER', currency: 'USD' }, // Canadá
  'GB': { region: 'OTHER', currency: 'USD' }, // Reino Unido
  'AU': { region: 'OTHER', currency: 'USD' }, // Austrália
  'JP': { region: 'OTHER', currency: 'USD' }, // Japão
  'MX': { region: 'OTHER', currency: 'USD' }, // México
  'AR': { region: 'OTHER', currency: 'USD' }, // Argentina
  'CL': { region: 'OTHER', currency: 'USD' }, // Chile
  'CO': { region: 'OTHER', currency: 'USD' }, // Colômbia
  'PE': { region: 'OTHER', currency: 'USD' }, // Peru
};

// Configurações de moeda para formatação
export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  BRL: {
    currency: 'BRL',
    symbol: 'R$',
    locale: 'pt-BR',
    region: 'BR'
  },
  USD: {
    currency: 'USD',
    symbol: '$',
    locale: 'en-US',
    region: 'US'
  },
  EUR: {
    currency: 'EUR',
    symbol: '€',
    locale: 'en-EU',
    region: 'EU'
  }
};

class GeolocationService {
  private cache: GeolocationData | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Detecta a localização do usuário usando múltiplas APIs
   */
  async detectLocation(): Promise<GeolocationData> {
    console.log('🔍 Iniciando detecção de localização...');
    
    // Verificar cache primeiro
    if (this.isCacheValid() && this.cache) {
      console.log('✅ Usando localização em cache:', this.cache.countryCode);
      return this.cache;
    }

    try {
      // Tentar múltiplas APIs de geolocalização
      const apis = [
        () => this.tryIpapiCo(),
        () => this.tryIpInfo(),
        () => this.tryIpGeolocation(),
        () => this.tryFallbackLocation()
      ];

      for (const api of apis) {
        try {
          const result = await api();
          if (result) {
            console.log('✅ Localização detectada com sucesso:', result.countryCode);
            this.cache = result;
            this.cacheTimestamp = Date.now();
            return result;
          }
        } catch (error) {
          console.warn('Geolocation API failed:', error);
          continue;
        }
      }

      // Fallback final: Brasil
      console.log('⚠️ Todas as APIs falharam, usando fallback Brasil');
      return this.getFallbackLocation();
    } catch (error) {
      console.error('All geolocation APIs failed:', error);
      console.log('⚠️ Erro crítico, usando fallback Brasil');
      return this.getFallbackLocation();
    }
  }

  /**
   * API 1: ipapi.co (gratuita, boa precisão)
   */
  private async tryIpapiCo(): Promise<GeolocationData | null> {
    console.log('🌍 Tentando API: ipapi.co');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    try {
      const response = await fetch('https://ipapi.co/json/', {
        headers: {
          'User-Agent': 'LookfinderApp/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log('❌ ipapi.co retornou status:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('✅ ipapi.co sucesso:', data.country_code || data.country);
      return this.parseLocationData(data);
    } catch (error) {
      clearTimeout(timeoutId);
      console.log('❌ ipapi.co falhou:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * API 2: ipinfo.io (gratuita, boa precisão)
   */
  private async tryIpInfo(): Promise<GeolocationData | null> {
    console.log('🌍 Tentando API: ipinfo.io');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    try {
      const response = await fetch('https://ipinfo.io/json', {
        headers: {
          'User-Agent': 'LookfinderApp/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log('❌ ipinfo.io retornou status:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('✅ ipinfo.io sucesso:', data.country);
      return this.parseLocationData({
        country_code: data.country,
        country_name: data.country,
        city: data.city,
        region: data.region,
        timezone: data.timezone
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.log('❌ ipinfo.io falhou:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * API 3: ipgeolocation.io (gratuita, boa precisão)
   */
  private async tryIpGeolocation(): Promise<GeolocationData | null> {
    console.log('🌍 Tentando API: ipgeolocation.io');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    try {
      const response = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=free', {
        headers: {
          'User-Agent': 'LookfinderApp/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log('❌ ipgeolocation.io retornou status:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('✅ ipgeolocation.io sucesso:', data.country_code2 || data.country_name);
      return this.parseLocationData({
        country_code: data.country_code2,
        country_name: data.country_name,
        city: data.city,
        region: data.state_prov,
        timezone: data.time_zone?.name
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.log('❌ ipgeolocation.io falhou:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * API 4: Fallback usando timezone do navegador
   */
  private async tryFallbackLocation(): Promise<GeolocationData | null> {
    console.log('🌍 Tentando fallback por timezone');
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('⏰ Timezone detectado:', timezone);
      
      const countryCode = this.getCountryFromTimezone(timezone);
      
      if (countryCode) {
        console.log('✅ Fallback por timezone sucesso:', countryCode);
        return this.parseLocationData({
          country_code: countryCode,
          country_name: countryCode,
          timezone: timezone
        });
      } else {
        console.log('❌ Timezone não mapeado para país:', timezone);
      }
    } catch (error) {
      console.log('❌ Fallback por timezone falhou:', error instanceof Error ? error.message : String(error));
    }
    
    return null;
  }

  /**
   * Parse dos dados de localização para formato padronizado
   */
  private parseLocationData(data: any): GeolocationData {
    const countryCode = (data.country_code || data.country || 'BR').toUpperCase();
    const mapping = COUNTRY_MAPPING[countryCode] || { region: 'OTHER', currency: 'USD' };
    
    return {
      country: data.country_name || data.country || countryCode,
      countryCode,
      region: mapping.region,
      currency: mapping.currency,
      timezone: data.timezone || 'America/Sao_Paulo',
      city: data.city,
      regionName: data.region
    };
  }

  /**
   * Fallback final: Brasil
   */
  private getFallbackLocation(): GeolocationData {
    return {
      country: 'Brazil',
      countryCode: 'BR',
      region: 'BR',
      currency: 'BRL',
      timezone: 'America/Sao_Paulo'
    };
  }

  /**
   * Mapeia timezone para país (fallback)
   */
  private getCountryFromTimezone(timezone: string): string | null {
    const timezoneMap: Record<string, string> = {
      'America/Sao_Paulo': 'BR',
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES',
      'Europe/Rome': 'IT',
      'Europe/Amsterdam': 'NL',
      'Europe/Brussels': 'BE',
      'Europe/Vienna': 'AT',
      'Europe/Lisbon': 'PT',
      'Europe/Dublin': 'IE',
      'Europe/Helsinki': 'FI',
      'Europe/Athens': 'GR',
      'Europe/Copenhagen': 'DK',
      'Europe/Stockholm': 'SE',
      'Europe/Oslo': 'NO',
      'Europe/Zurich': 'CH',
      'Europe/Prague': 'CZ',
      'Europe/Warsaw': 'PL',
      'Europe/Budapest': 'HU',
      'Europe/Bucharest': 'RO',
      'Europe/Sofia': 'BG',
      'Europe/Zagreb': 'HR',
      'Europe/Ljubljana': 'SI',
      'Europe/Bratislava': 'SK',
      'Europe/Tallinn': 'EE',
      'Europe/Riga': 'LV',
      'Europe/Vilnius': 'LT',
      'Europe/Luxembourg': 'LU',
      'Europe/Valletta': 'MT',
      'Europe/Nicosia': 'CY',
      'Europe/Malta': 'MT'
    };
    
    return timezoneMap[timezone] || null;
  }

  /**
   * Verifica se o cache ainda é válido
   */
  private isCacheValid(): boolean {
    return this.cache !== null && 
           (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Formata valor monetário baseado na moeda
   */
  formatCurrency(value: number, currency: Currency): string {
    const config = CURRENCY_CONFIGS[currency];
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency
    }).format(value);
  }

  /**
   * Obtém configuração de moeda
   */
  getCurrencyConfig(currency: Currency): CurrencyConfig {
    return CURRENCY_CONFIGS[currency];
  }

  /**
   * Limpa o cache (útil para testes ou mudança de localização)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Salva localização do usuário no perfil (opcional)
   */
  async saveUserLocation(userId: string, location: GeolocationData): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({
          country_code: location.countryCode,
          region: location.region,
          currency: location.currency,
          timezone: location.timezone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.warn('Failed to save user location:', error);
    }
  }
}

export const geolocationService = new GeolocationService();
