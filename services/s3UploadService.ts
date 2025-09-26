import { s3Config } from '@/config/supabase';
import { supabase } from './supabase';

/**
 * Serviço para upload direto ao S3 da Supabase
 * Melhor performance para arquivos grandes
 */

interface S3UploadOptions {
  file: Blob;
  fileName: string;
  contentType: string;
  userId?: string;
  folder?: string;
}

interface S3UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Gera uma assinatura para upload direto ao S3
 */
async function generateS3Signature(
  fileName: string, 
  contentType: string, 
  folder: string = 'foto_perfil'
): Promise<{ url: string; fields: Record<string, string> }> {
  const timestamp = Date.now();
  const key = `${folder}/${fileName}`;
  
  // Política de upload (24 horas de validade)
  const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const policy = {
    expiration,
    conditions: [
      { bucket: s3Config.bucket },
      ['starts-with', '$key', `${folder}/`],
      ['starts-with', '$Content-Type', contentType.split('/')[0] + '/'],
      ['content-length-range', 0, 10485760], // 10MB max
    ]
  };
  
  const policyBase64 = btoa(JSON.stringify(policy));
  
  // Para implementação simplificada, vamos usar upload direto via fetch
  const uploadUrl = `${s3Config.endpoint}/${s3Config.bucket}`;
  
  return {
    url: uploadUrl,
    fields: {
      key,
      'Content-Type': contentType,
      bucket: s3Config.bucket,
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${s3Config.accessKeyId}/${new Date().toISOString().slice(0, 8)}/auto/s3/aws4_request`,
      'X-Amz-Date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, ''),
      policy: policyBase64,
    }
  };
}

/**
 * Upload usando a API oficial do Supabase Storage
 */
export async function uploadViaSupabaseAPI(options: S3UploadOptions): Promise<S3UploadResult> {
  try {
    const { file, fileName, contentType, userId, folder = 'foto_perfil' } = options;
    
    console.log('🚀 Iniciando upload via Supabase API:', {
      fileName,
      contentType,
      size: file.size,
      folder
    });

    // Gerar nome único do arquivo
    const timestamp = Date.now();
    const uniqueFileName = `${userId || 'user'}_${timestamp}_${fileName}`;
    const filePath = `${folder}/${uniqueFileName}`;
    
    console.log('📤 Fazendo upload para:', filePath);
    
    // Upload usando o SDK oficial do Supabase
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: contentType
      });

    if (error) {
      console.error('❌ Erro no upload Supabase:', error);
      throw new Error(`Upload falhou: ${error.message}`);
    }

    console.log('✅ Upload Supabase concluído:', data);

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('🔗 URL pública gerada:', publicUrl);
    
    return {
      success: true,
      url: publicUrl
    };
    
  } catch (error) {
    console.error('❌ Erro no uploadViaSupabaseAPI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload';
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Upload usando URL assinada (para casos especiais)
 */
export async function uploadViaSignedURL(options: S3UploadOptions): Promise<S3UploadResult> {
  try {
    const { file, fileName, contentType, userId, folder = 'foto_perfil' } = options;
    
    console.log('🚀 Iniciando upload via URL assinada:', {
      fileName,
      contentType,
      size: file.size,
      folder
    });

    // Gerar nome único do arquivo
    const timestamp = Date.now();
    const uniqueFileName = `${userId || 'user'}_${timestamp}_${fileName}`;
    const filePath = `${folder}/${uniqueFileName}`;
    
    // Criar URL assinada para upload (válida por 60 segundos)
    const { data: signedData, error: signError } = await supabase.storage
      .from('user-uploads')
      .createSignedUploadUrl(filePath);

    if (signError) {
      console.error('❌ Erro ao criar URL assinada:', signError);
      throw new Error(`Erro na URL assinada: ${signError.message}`);
    }

    console.log('📝 URL assinada criada:', signedData.signedUrl);

    // Upload usando a URL assinada
    const formData = new FormData();
    formData.append('file', file, fileName);

    const response = await fetch(signedData.signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro no upload via URL assinada:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Upload falhou: ${response.status} - ${errorText}`);
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('✅ Upload via URL assinada concluído:', publicUrl);
    
    return {
      success: true,
      url: publicUrl
    };
    
  } catch (error) {
    console.error('❌ Erro no uploadViaSignedURL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload';
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Upload alternativo usando FormData (para compatibilidade)
 */
export async function uploadToS3FormData(options: S3UploadOptions): Promise<S3UploadResult> {
  try {
    const { file, fileName, contentType, userId, folder = 'foto_perfil' } = options;
    
    console.log('🚀 Iniciando upload S3 via FormData:', {
      fileName,
      contentType,
      size: file.size,
      folder
    });

    // Gerar assinatura
    const { url, fields } = await generateS3Signature(fileName, contentType, folder);
    
    // Criar FormData
    const formData = new FormData();
    
    // Adicionar campos da assinatura
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Adicionar o arquivo por último
    formData.append('file', file, fileName);
    
    console.log('📤 Fazendo upload via FormData para:', url);
    
    // Fazer upload
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro no upload S3 FormData:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      throw new Error(`Upload falhou: ${response.status} - ${errorText}`);
    }

    // URL pública do arquivo
    const publicUrl = `${s3Config.endpoint}/${s3Config.bucket}/${fields.key}`;
    
    console.log('✅ Upload S3 FormData concluído:', publicUrl);
    
    return {
      success: true,
      url: publicUrl
    };
    
  } catch (error) {
    console.error('❌ Erro no uploadToS3FormData:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload';
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Função principal de upload com fallback
 */
export async function uploadAvatar(file: Blob, fileName: string, userId?: string): Promise<S3UploadResult> {
  try {
    // Determinar tipo de conteúdo
    const contentType = file.type || 'image/jpeg';
    
    // Tentar upload via URL assinada primeiro (melhor compatibilidade React Native)
    console.log('🔄 Tentando upload via URL assinada...');
    const signedResult = await uploadViaSignedURL({
      file,
      fileName,
      contentType,
      userId,
      folder: 'foto_perfil'
    });
    
    if (signedResult.success) {
      return signedResult;
    }
    
    // Se falhar, tentar com API oficial do Supabase
    console.log('🔄 Tentando upload via Supabase API...');
    const supabaseResult = await uploadViaSupabaseAPI({
      file,
      fileName,
      contentType,
      userId,
      folder: 'foto_perfil'
    });
    
    return supabaseResult;
    
  } catch (error) {
    console.error('❌ Erro geral no uploadAvatar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload';
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

export default {
  uploadAvatar,
  uploadViaSupabaseAPI,
  uploadViaSignedURL,
  uploadToS3FormData
};
