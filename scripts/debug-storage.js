#!/usr/bin/env node

/**
 * Script para debugar problemas de acesso ao Supabase Storage
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://jlqjgsnjthrhapiaespq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscWpnc25qdGhyaGFwaWFlc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMzQzNDcsImV4cCI6MjA1NjcxMDM0N30.fO6CVy2nIo6FWAvQeVL7h2Y5YmO0y4rabSffd4EZStQ';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 === DEBUG SUPABASE STORAGE ===\n');

async function debugStorage() {
  try {
    // 1. Testar diferentes métodos de listar buckets
    console.log('🪣 1. Testando listagem de buckets...');
    
    // Método 1: listBuckets()
    console.log('\n📋 Método 1: supabase.storage.listBuckets()');
    const { data: buckets1, error: error1 } = await supabase.storage.listBuckets();
    console.log('Resultado:', { buckets: buckets1?.length || 0, error: error1?.message });
    
    // Método 2: Tentar acessar bucket específico
    console.log('\n📋 Método 2: Tentando acessar bucket "lookbucket" diretamente');
    const { data: files2, error: error2 } = await supabase.storage
      .from('lookbucket')
      .list('', { limit: 5 });
    console.log('Resultado:', { files: files2?.length || 0, error: error2?.message });
    
    // Método 3: Tentar acessar pasta específica
    console.log('\n📋 Método 3: Tentando acessar pasta "CalcaaAladin"');
    const { data: files3, error: error3 } = await supabase.storage
      .from('lookbucket')
      .list('CalcaaAladin', { limit: 5 });
    console.log('Resultado:', { files: files3?.length || 0, error: error3?.message });
    
    // Método 4: Testar com fetch direto
    console.log('\n📋 Método 4: Testando com fetch direto');
    try {
      const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });
      
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Resultado:', data);
    } catch (fetchError) {
      console.log('Erro no fetch:', fetchError.message);
    }
    
    // 2. Testar autenticação
    console.log('\n🔐 2. Testando autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Usuário autenticado:', user ? 'Sim' : 'Não');
    console.log('Erro de auth:', authError?.message);
    
    // 3. Testar permissões
    console.log('\n🔑 3. Testando permissões...');
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    console.log('Permissão no banco:', testError ? 'Negada' : 'OK');
    console.log('Erro:', testError?.message);
    
    // 4. Mostrar informações úteis
    console.log('\n💡 4. Informações para debug:');
    console.log('URL:', SUPABASE_URL);
    console.log('Key (primeiros 20 chars):', SUPABASE_ANON_KEY.substring(0, 20) + '...');
    console.log('Timestamp:', new Date().toISOString());
    
    // 5. Sugestões
    console.log('\n🔧 5. Sugestões para resolver:');
    console.log('1. Verifique se o Storage está habilitado no painel do Supabase');
    console.log('2. Verifique as políticas RLS dos buckets');
    console.log('3. Tente criar um bucket público no painel');
    console.log('4. Verifique se as credenciais estão corretas');
    console.log('5. Teste no Postman com as URLs fornecidas');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar debug
debugStorage().catch(console.error);
