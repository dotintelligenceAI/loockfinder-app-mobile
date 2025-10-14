// Configuração do Supabase
export const supabaseConfig = {
  url: 'https://jlqjgsnjthrhapiaespq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscWpnc25qdGhyaGFwaWFlc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMzQzNDcsImV4cCI6MjA1NjcxMDM0N30.fO6CVy2nIo6FWAvQeVL7h2Y5YmO0y4rabSffd4EZStQ',
};

// Configuração de IAP (Apple & Google)
export const iapConfig = {
  // Apple Shared Secret (para validação de receipts de assinaturas)
  // Obtenha em: App Store Connect → Apps → In-App Purchases → App-Specific Shared Secret
  appleSharedSecret: 'f009327964134c78bd9faab34ed6cfa7', // ✅ Shared Secret obtido!
};

// Configuração S3 para upload direto (melhor performance)
export const s3Config = {
  endpoint: 'https://jlqjgsnjthrhapiaespq.storage.supabase.co/storage/v1/s3',
  region: 'project_region',
  accessKeyId: '4d0c1dd423eaff66f50b7f1edb64dca6',
  secretAccessKey: '5ddae4ed27954e2e8e9962fefb7184517512ded798920ecc585803663992571e',
  bucket: 'user-uploads',
  forcePathStyle: true
}; 