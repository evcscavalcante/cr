class CryptoHelper {
  constructor() {
    this.algorithm = {
      name: 'AES-GCM',
      length: 256
    };
  }

  async generateKey() {
    return window.crypto.subtle.generateKey(
      this.algorithm,
      true,
      ['encrypt', 'decrypt']
    );
  }

  async exportKey(key) {
    const exported = await window.crypto.subtle.exportKey('jwk', key);
    return exported;
  }

  async importKey(keyData) {
    return window.crypto.subtle.importKey(
      'jwk',
      keyData,
      this.algorithm,
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: this.algorithm.name,
        iv
      },
      key,
      dataBuffer
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedData))
    };
  }

  async decrypt(encryptedData, key) {
    const iv = new Uint8Array(encryptedData.iv);
    const data = new Uint8Array(encryptedData.data);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: this.algorithm.name,
        iv
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedBuffer));
  }
}

window.CryptoHelper = CryptoHelper;
