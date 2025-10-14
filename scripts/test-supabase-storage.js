#!/usr/bin/env node

/**
 * Script para testar conexão com Supabase Storage
 * Mostra exatamente como fazer as requisições no Postman
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://jlqjgsnjthrhapiaespq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscWpnc25qdGhyaGFwaWFlc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMzQzNDcsImV4cCI6MjA1NjcxMDM0N30.fO6CVy2nIo6FWAvQeVL7h2Y5YmO0y4rabSffd4EZStQ';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 === TESTE DE CONEXÃO SUPABASE STORAGE ===\n');

async function testStorageConnection() {
  try {
    console.log('📡 Testando conexão com Supabase...');
    console.log(`URL: ${SUPABASE_URL}`);
    console.log(`Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    
    // 1. Testar listagem de buckets
    console.log('\n🪣 1. Testando listagem de buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
      console.log('1. Verifique se o Storage está habilitado no painel do Supabase');
      console.log('2. Verifique se as credenciais estão corretas');
      console.log('3. Verifique se o projeto está ativo');
      return;
    }
    
    console.log('✅ Conexão com Storage OK!');
    console.log(`📊 Buckets encontrados: ${buckets?.length || 0}`);
    
    if (buckets && buckets.length > 0) {
      console.log('\n📦 Buckets disponíveis:');
      buckets.forEach((bucket, index) => {
        console.log(`  ${index + 1}. ${bucket.name} (${bucket.public ? 'Público' : 'Privado'})`);
      });
      
      // 2. Testar listagem de arquivos do primeiro bucket
      const firstBucket = buckets[0];
      console.log(`\n📁 2. Testando listagem de arquivos no bucket "${firstBucket.name}"...`);
      
      const { data: files, error: filesError } = await supabase.storage
        .from(firstBucket.name)
        .list('', { limit: 10 });
      
      if (filesError) {
        console.error('❌ Erro ao listar arquivos:', filesError);
      } else {
        console.log('✅ Listagem de arquivos OK!');
        console.log(`📊 Arquivos encontrados: ${files?.length || 0}`);
        
        if (files && files.length > 0) {
          console.log('\n📄 Primeiros arquivos:');
          files.slice(0, 5).forEach((file, index) => {
            console.log(`  ${index + 1}. ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
          });
        }
      }
    } else {
      console.log('\n⚠️  Nenhum bucket encontrado');
      console.log('💡 Para criar um bucket, use o painel do Supabase ou execute:');
      console.log('   npm run create-bucket');
    }
    
    // 3. Mostrar como testar no Postman
    console.log('\n🌐 === COMO TESTAR NO POSTMAN ===');
    console.log('\n📋 Para listar buckets:');
    console.log(`GET ${SUPABASE_URL}/storage/v1/bucket`);
    console.log('\n📋 Headers necessários:');
    console.log(`Authorization: Bearer ${SUPABASE_ANON_KEY}`);
    console.log(`apikey: ${SUPABASE_ANON_KEY}`);
    
    console.log('\n📋 Para listar arquivos de um bucket:');
    console.log(`GET ${SUPABASE_URL}/storage/v1/object/list/BUCKET_NAME`);
    console.log('\n📋 Para listar arquivos de uma pasta:');
    console.log(`GET ${SUPABASE_URL}/storage/v1/object/list/BUCKET_NAME/FOLDER_NAME`);
    
    console.log('\n📋 Para obter URL pública de um arquivo:');
    console.log(`GET ${SUPABASE_URL}/storage/v1/object/public/BUCKET_NAME/FILE_PATH`);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    console.error('🔍 Stack trace:', error.stack);
  }
}

// Executar teste
testStorageConnection().catch(console.error);
