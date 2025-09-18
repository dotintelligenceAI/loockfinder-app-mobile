// =====================================================
// TESTE DE GEOLOCALIZAÇÃO - LOOKFINDER
// =====================================================

// Este arquivo pode ser executado no console do navegador para testar a detecção de localização

console.log('🧪 Iniciando teste de geolocalização...');

// Função para testar detecção de localização
async function testGeolocation() {
  try {
    console.log('🔍 Testando APIs de geolocalização...');
    
    // Teste 1: ipapi.co
    try {
      const response1 = await fetch('https://ipapi.co/json/');
      const data1 = await response1.json();
      console.log('✅ ipapi.co:', {
        country: data1.country_name,
        countryCode: data1.country_code,
        currency: data1.currency,
        timezone: data1.timezone
      });
    } catch (error) {
      console.log('❌ ipapi.co falhou:', error.message);
    }
    
    // Teste 2: ipinfo.io
    try {
      const response2 = await fetch('https://ipinfo.io/json');
      const data2 = await response2.json();
      console.log('✅ ipinfo.io:', {
        country: data2.country,
        city: data2.city,
        region: data2.region,
        timezone: data2.timezone
      });
    } catch (error) {
      console.log('❌ ipinfo.io falhou:', error.message);
    }
    
    // Teste 3: ipgeolocation.io
    try {
      const response3 = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=free');
      const data3 = await response3.json();
      console.log('✅ ipgeolocation.io:', {
        country: data3.country_name,
        countryCode: data3.country_code2,
        city: data3.city,
        timezone: data3.time_zone?.name
      });
    } catch (error) {
      console.log('❌ ipgeolocation.io falhou:', error.message);
    }
    
    // Teste 4: Timezone do navegador
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('✅ Timezone do navegador:', timezone);
    } catch (error) {
      console.log('❌ Timezone falhou:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Função para simular diferentes regiões
function simulateRegions() {
  console.log('🌍 Simulando diferentes regiões...');
  
  const regions = [
    { country: 'Brazil', countryCode: 'BR', region: 'BR', currency: 'BRL' },
    { country: 'United States', countryCode: 'US', region: 'US', currency: 'USD' },
    { country: 'France', countryCode: 'FR', region: 'EU', currency: 'EUR' },
    { country: 'Germany', countryCode: 'DE', region: 'EU', currency: 'EUR' },
    { country: 'Spain', countryCode: 'ES', region: 'EU', currency: 'EUR' },
    { country: 'Canada', countryCode: 'CA', region: 'OTHER', currency: 'USD' }
  ];
  
  regions.forEach(region => {
    console.log(`📍 ${region.country} (${region.countryCode}):`, {
      region: region.region,
      currency: region.currency,
      expectedPrice: region.currency === 'BRL' ? 'R$ 39,90' : 
                    region.currency === 'USD' ? '$7.90' : '€7,90'
    });
  });
}

// Função para testar formatação de moeda
function testCurrencyFormatting() {
  console.log('💰 Testando formatação de moeda...');
  
  const prices = [
    { value: 3990, currency: 'BRL' },
    { value: 790, currency: 'USD' },
    { value: 790, currency: 'EUR' }
  ];
  
  prices.forEach(price => {
    const formatted = new Intl.NumberFormat(
      price.currency === 'BRL' ? 'pt-BR' : 
      price.currency === 'USD' ? 'en-US' : 'en-EU',
      { style: 'currency', currency: price.currency }
    ).format(price.value / 100);
    
    console.log(`${price.currency}: ${formatted}`);
  });
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Executando todos os testes...\n');
  
  await testGeolocation();
  console.log('\n');
  
  simulateRegions();
  console.log('\n');
  
  testCurrencyFormatting();
  console.log('\n');
  
  console.log('✅ Testes concluídos!');
  console.log('📝 Verifique se a detecção está funcionando corretamente.');
  console.log('🔧 Se algum teste falhar, verifique sua conexão com a internet.');
}

// Executar automaticamente
runAllTests();

// =====================================================
// INSTRUÇÕES DE USO
// =====================================================

/*
COMO USAR ESTE ARQUIVO:

1. Abra o console do navegador (F12)
2. Cole este código e pressione Enter
3. Verifique os resultados dos testes
4. Se algum teste falhar, pode ser problema de CORS ou conexão

RESULTADOS ESPERADOS:

✅ ipapi.co: { country: "Brazil", countryCode: "BR", currency: "BRL" }
✅ ipinfo.io: { country: "BR", city: "São Paulo", region: "SP" }
✅ ipgeolocation.io: { country: "Brazil", countryCode: "BR" }
✅ Timezone do navegador: "America/Sao_Paulo"

📍 Brazil (BR): { region: "BR", currency: "BRL", expectedPrice: "R$ 39,90" }
📍 United States (US): { region: "US", currency: "USD", expectedPrice: "$7.90" }
📍 France (FR): { region: "EU", currency: "EUR", expectedPrice: "€7,90" }

💰 BRL: R$ 39,90
💰 USD: $7.90
💰 EUR: €7,90

SE ALGUM TESTE FALHAR:

1. Verifique sua conexão com a internet
2. Teste em um navegador diferente
3. Verifique se não há bloqueadores de anúncios interferindo
4. Tente usar uma VPN para simular diferentes regiões

PARA TESTAR NO APP:

1. Abra a tela de planos
2. Verifique o console para logs como:
   - "🔍 Detectando localização do usuário..."
   - "📍 Localização detectada: { country: 'France', region: 'EU', currency: 'EUR' }"
   - "💳 Carregando planos para região: EU"
   - "✅ Encontrados 3 planos para EU"
*/
