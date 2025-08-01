// Polyfills básicos para React Native

// Polyfill simples para btoa/atob usando base64
if (typeof global.btoa === 'undefined') {
  global.btoa = function(str) {
    // Implementação simples usando base64
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    let i = 0;
    
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  };
}

if (typeof global.atob === 'undefined') {
  global.atob = function(b64) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    let i = 0;
    
    b64 = b64.replace(/[^A-Za-z0-9+/]/g, '');
    
    while (i < b64.length) {
      const encoded1 = chars.indexOf(b64.charAt(i++));
      const encoded2 = chars.indexOf(b64.charAt(i++));
      const encoded3 = chars.indexOf(b64.charAt(i++));
      const encoded4 = chars.indexOf(b64.charAt(i++));
      
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
      
      result += String.fromCharCode((bitmap >> 16) & 255);
      if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
      if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
    }
    
    return result;
  };
} 