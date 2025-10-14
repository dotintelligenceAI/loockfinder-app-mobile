#!/usr/bin/env node

/**
 * Script para criar looks automaticamente a partir de imagens no Supabase Storage
 * 
 * Funcionalidades:
 * - Listar buckets disponíveis
 * - Navegar pelas pastas do bucket
 * - Escolher categoria e subcategoria
 * - Criar looks automaticamente na tabela
 */

const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://jlqjgsnjthrhapiaespq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscWpnc25qdGhyaGFwaWFlc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMzQzNDcsImV4cCI6MjA1NjcxMDM0N30.fO6CVy2nIo6FWAvQeVL7h2Y5YmO0y4rabSffd4EZStQ';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Interface para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para fazer pergunta ao usuário
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Função para listar buckets
async function listBuckets() {
  try {
    console.log('\n🪣 Buscando buckets disponíveis...\n');
    
    // Lista de buckets conhecidos (baseado no que vimos no painel)
    const knownBuckets = [
      { name: 'lookbucket', public: true },
      { name: 'user-uploads', public: true },
      { name: 'cupons', public: true },
      { name: 'catagories', public: true },
      { name: 'imageLinks', public: true }
    ];
    
    console.log('📦 Buckets disponíveis (baseado no painel do Supabase):');
    knownBuckets.forEach((bucket, index) => {
      console.log(`  ${index + 1}. ${bucket.name} (${bucket.public ? 'Público' : 'Privado'})`);
    });
    
    return knownBuckets;
  } catch (error) {
    console.error('❌ Erro ao listar buckets:', error.message);
    return [];
  }
}

// Função para criar novo bucket
async function createNewBucket(bucketName) {
  try {
    console.log(`\n🆕 Criando bucket "${bucketName}"...\n`);
    
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 52428800 // 50MB
    });
    
    if (error) {
      console.error('❌ Erro ao criar bucket:', error.message);
      return [];
    }
    
    console.log('✅ Bucket criado com sucesso!');
    return [{ name: bucketName, public: true }];
  } catch (error) {
    console.error('❌ Erro ao criar bucket:', error.message);
    return [];
  }
}

// Função para listar pastas de um bucket
async function listFolders(bucketName) {
  try {
    console.log(`\n📁 Buscando pastas no bucket "${bucketName}"...\n`);
    
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1000 });
    
    if (error) {
      console.error('❌ Erro ao buscar pastas:', error.message);
      return [];
    }
    
    console.log('🔍 Debug - Arquivos encontrados:', files?.length || 0);
    console.log('🔍 Debug - Primeiros arquivos:', files?.slice(0, 3));
    
    if (!files || files.length === 0) {
      console.log('⚠️  Nenhuma pasta encontrada');
      return [];
    }
    
    // Filtrar apenas pastas (não arquivos) - arquivos têm extensão
    const folders = files.filter(file => {
      const hasExtension = /\.[a-zA-Z0-9]+$/.test(file.name);
      const isFolder = !hasExtension && file.metadata?.size === undefined;
      console.log(`🔍 ${file.name}: hasExtension=${hasExtension}, isFolder=${isFolder}`);
      return isFolder;
    });
    
    console.log('📂 Pastas encontradas:');
    folders.forEach((folder, index) => {
      console.log(`  ${index + 1}. ${folder.name}`);
    });
    
    return folders;
  } catch (error) {
    console.error('❌ Erro ao listar pastas:', error.message);
    return [];
  }
}

// Função para listar imagens de uma pasta (com suporte a subpastas)
async function listImages(bucketName, folderName) {
  try {
    console.log(`\n🖼️  Buscando imagens na pasta "${folderName}"...\n`);
    
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(folderName, { limit: 1000 });
    
    if (error) {
      console.error('❌ Erro ao buscar imagens:', error.message);
      return [];
    }
    
    console.log('🔍 Debug - Arquivos encontrados:', files?.length || 0);
    console.log('🔍 Debug - Primeiros arquivos:', files?.slice(0, 3));
    
    if (!files || files.length === 0) {
      console.log('⚠️  Nenhuma imagem encontrada');
      return [];
    }
    
    // Verificar se há subpastas
    const hasSubfolders = files.some(file => !file.name.includes('.'));
    
    if (hasSubfolders) {
      console.log('📁 Esta pasta contém subpastas. Vamos listá-las:');
      
      const subfolders = files.filter(file => !file.name.includes('.'));
      console.log('📂 Subpastas encontradas:');
      subfolders.forEach((subfolder, index) => {
        console.log(`  ${index + 1}. ${subfolder.name}`);
      });
      
      // Perguntar qual subpasta usar
      const subfolderChoice = await askQuestion('\nEscolha uma subpasta (número) ou pressione Enter para buscar em todas: ');
      
      if (subfolderChoice.trim() !== '') {
        const selectedSubfolder = subfolders[parseInt(subfolderChoice) - 1];
        if (selectedSubfolder) {
          console.log(`\n✅ Subpasta selecionada: ${selectedSubfolder.name}`);
          return await listImages(bucketName, `${folderName}/${selectedSubfolder.name}`);
        }
      } else {
        // Buscar em todas as subpastas
        console.log('\n🔍 Buscando imagens em todas as subpastas...');
        return await searchImagesInAllSubfolders(bucketName, folderName, subfolders);
      }
    }
    
    // Filtrar apenas imagens
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const images = files.filter(file => 
      imageExtensions.some(ext => file.name.toLowerCase().includes(ext))
    );
    
    console.log(`📸 ${images.length} imagens encontradas:`);
    images.forEach((image, index) => {
      console.log(`  ${index + 1}. ${image.name}`);
    });
    
    return images;
  } catch (error) {
    console.error('❌ Erro ao listar imagens:', error.message);
    return [];
  }
}

// Função para buscar imagens em todas as subpastas
async function searchImagesInAllSubfolders(bucketName, parentFolder, subfolders) {
  const allImages = [];
  
  for (const subfolder of subfolders) {
    console.log(`\n🔍 Buscando em ${subfolder.name}...`);
    
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(`${parentFolder}/${subfolder.name}`, { limit: 1000 });
    
    if (error) {
      console.error(`❌ Erro ao buscar em ${subfolder.name}:`, error.message);
      continue;
    }
    
    if (files && files.length > 0) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const images = files.filter(file => 
        imageExtensions.some(ext => file.name.toLowerCase().includes(ext))
      );
      
      console.log(`📸 ${images.length} imagens encontradas em ${subfolder.name}`);
      
      // Adicionar informações da subpasta às imagens
      images.forEach(image => {
        allImages.push({
          ...image,
          subfolder: subfolder.name,
          fullPath: `${parentFolder}/${subfolder.name}/${image.name}`
        });
      });
    }
  }
  
  console.log(`\n📊 Total de imagens encontradas: ${allImages.length}`);
  allImages.forEach((image, index) => {
    console.log(`  ${index + 1}. ${image.subfolder}/${image.name}`);
  });
  
  return allImages;
}

// Função para listar categorias
async function listCategories() {
  try {
    console.log('\n🏷️  Buscando categorias...\n');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('title', { ascending: true });
    
    if (error) {
      console.error('❌ Erro ao buscar categorias:', error.message);
      return [];
    }
    
    if (!categories || categories.length === 0) {
      console.log('⚠️  Nenhuma categoria encontrada');
      return [];
    }
    
    console.log('📋 Categorias disponíveis:');
    categories.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.title} (${category.type})`);
    });
    
    return categories;
  } catch (error) {
    console.error('❌ Erro ao listar categorias:', error.message);
    return [];
  }
}

// Função para listar subcategorias de uma categoria
async function listSubcategories(categoryId) {
  try {
    console.log('\n🏷️  Buscando subcategorias...\n');
    
    const { data: subcategories, error } = await supabase
      .from('subcategorias')
      .select('*')
      .eq('categoria_id', categoryId)
      .order('title', { ascending: true });
    
    if (error) {
      console.error('❌ Erro ao buscar subcategorias:', error.message);
      return [];
    }
    
    if (!subcategories || subcategories.length === 0) {
      console.log('⚠️  Nenhuma subcategoria encontrada para esta categoria');
      return [];
    }
    
    console.log('📋 Subcategorias disponíveis:');
    subcategories.forEach((subcategory, index) => {
      console.log(`  ${index + 1}. ${subcategory.title} (${subcategory.type})`);
    });
    
    return subcategories;
  } catch (error) {
    console.error('❌ Erro ao listar subcategorias:', error.message);
    return [];
  }
}

// Função para criar look
async function createLook(imageUrl, title, description, categoryId, subcategoryId = null) {
  try {
    const lookData = {
      title,
      description,
      image_url: imageUrl,
      categories_id: categoryId,
      subcategorias_id: subcategoryId,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('looks')
      .insert([lookData])
      .select();
    
    if (error) {
      console.error('❌ Erro ao criar look:', error.message);
      return false;
    }
    
    console.log('✅ Look criado com sucesso:', data[0].id);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar look:', error.message);
    return false;
  }
}

// Função para obter URL pública da imagem
function getPublicImageUrl(bucketName, folderName, imageName) {
  // Se imageName já contém o caminho completo (com subpasta)
  const fullPath = imageName.includes('/') ? imageName : `${folderName}/${imageName}`;
  
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fullPath);
  
  return data.publicUrl;
}

// Função para testar conexão
async function testConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...\n');
    
    // Testar conexão básica
    const { data, error } = await supabase.from('categories').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão com o banco:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com banco de dados OK');
    
    // Testar storage
    console.log('🔍 Testando Storage API...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('❌ Erro na conexão com Storage:', storageError.message);
      console.error('🔍 Detalhes:', storageError);
      return false;
    }
    
    console.log('✅ Conexão com Storage OK');
    console.log(`📊 Buckets encontrados: ${buckets?.length || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🎨 === CRIADOR AUTOMÁTICO DE LOOKS ===\n');
  console.log('Este script irá ajudá-lo a criar looks automaticamente a partir de imagens no Supabase Storage.\n');
  
  // Testar conexão primeiro
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Falha na conexão. Verifique suas credenciais do Supabase.');
    console.log('💡 Dica: Verifique se as credenciais em config/supabase.ts estão corretas.');
    rl.close();
    return;
  }
  
  try {
    // 1. Listar e escolher bucket
    const buckets = await listBuckets();
    if (buckets.length === 0) {
      console.log('❌ Nenhum bucket disponível. Encerrando...');
      rl.close();
      return;
    }
    
    const bucketChoice = await askQuestion('\nEscolha o bucket (número): ');
    const selectedBucket = buckets[parseInt(bucketChoice) - 1];
    
    if (!selectedBucket) {
      console.log('❌ Bucket inválido. Encerrando...');
      rl.close();
      return;
    }
    
    console.log(`\n✅ Bucket selecionado: ${selectedBucket.name}`);
    
    // 2. Listar e escolher pasta
    const folders = await listFolders(selectedBucket.name);
    if (folders.length === 0) {
      console.log('❌ Nenhuma pasta encontrada. Encerrando...');
      rl.close();
      return;
    }
    
    const folderChoice = await askQuestion('\nEscolha a pasta (número): ');
    const selectedFolder = folders[parseInt(folderChoice) - 1];
    
    if (!selectedFolder) {
      console.log('❌ Pasta inválida. Encerrando...');
      rl.close();
      return;
    }
    
    console.log(`\n✅ Pasta selecionada: ${selectedFolder.name}`);
    
    // 3. Listar imagens da pasta
    const images = await listImages(selectedBucket.name, selectedFolder.name);
    if (images.length === 0) {
      console.log('❌ Nenhuma imagem encontrada. Encerrando...');
      rl.close();
      return;
    }
    
    // 4. Listar e escolher categoria
    const categories = await listCategories();
    if (categories.length === 0) {
      console.log('❌ Nenhuma categoria encontrada. Encerrando...');
      rl.close();
      return;
    }
    
    const categoryChoice = await askQuestion('\nEscolha a categoria (número): ');
    const selectedCategory = categories[parseInt(categoryChoice) - 1];
    
    if (!selectedCategory) {
      console.log('❌ Categoria inválida. Encerrando...');
      rl.close();
      return;
    }
    
    console.log(`\n✅ Categoria selecionada: ${selectedCategory.title}`);
    
    // 5. Listar e escolher subcategoria (opcional)
    const subcategories = await listSubcategories(selectedCategory.id);
    let selectedSubcategory = null;
    
    if (subcategories.length > 0) {
      const subcategoryChoice = await askQuestion('\nEscolha a subcategoria (número) ou pressione Enter para pular: ');
      
      if (subcategoryChoice.trim() !== '') {
        const subcategoryIndex = parseInt(subcategoryChoice) - 1;
        if (subcategoryIndex >= 0 && subcategoryIndex < subcategories.length) {
          selectedSubcategory = subcategories[subcategoryIndex];
          console.log(`\n✅ Subcategoria selecionada: ${selectedSubcategory.title}`);
        }
      }
    }
    
    // 6. Confirmar criação dos looks
    console.log(`\n📋 RESUMO:`);
    console.log(`   Bucket: ${selectedBucket.name}`);
    console.log(`   Pasta: ${selectedFolder.name}`);
    console.log(`   Categoria: ${selectedCategory.title}`);
    if (selectedSubcategory) {
      console.log(`   Subcategoria: ${selectedSubcategory.title}`);
    }
    console.log(`   Imagens: ${images.length}`);
    
    const confirm = await askQuestion('\nDeseja criar os looks? (s/n): ');
    
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'sim') {
      console.log('❌ Operação cancelada.');
      rl.close();
      return;
    }
    
    // 7. Criar looks
    console.log('\n🚀 Criando looks...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Usar fullPath se disponível (para imagens com subpasta)
      const imagePath = image.fullPath || image.name;
      const imageUrl = getPublicImageUrl(selectedBucket.name, selectedFolder.name, imagePath);
      
      // Gerar título e descrição baseados no nome da imagem
      const imageName = image.name.replace(/\.[^/.]+$/, ''); // Remove extensão
      const title = imageName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const description = `Look criado automaticamente a partir de ${image.name}${image.subfolder ? ` (${image.subfolder})` : ''}`;
      
      console.log(`📸 Processando ${i + 1}/${images.length}: ${image.subfolder ? `${image.subfolder}/` : ''}${image.name}`);
      
      const success = await createLook(
        imageUrl,
        title,
        description,
        selectedCategory.id,
        selectedSubcategory?.id || null
      );
      
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Pequena pausa para não sobrecarregar o servidor
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 8. Resumo final
    console.log('\n🎉 === PROCESSO CONCLUÍDO ===');
    console.log(`✅ Looks criados com sucesso: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total processado: ${images.length}`);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  } finally {
    rl.close();
  }
}

// Executar script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  listBuckets,
  listFolders,
  listImages,
  listCategories,
  listSubcategories,
  createLook,
  getPublicImageUrl
};
