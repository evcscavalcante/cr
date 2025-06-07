class SecureBackup {
  constructor(dbManager, cryptoHelper) {
    this.dbManager = dbManager;
    this.cryptoHelper = cryptoHelper;
    this.backupKey = null;
  }

  async init() {
    const storedKey = localStorage.getItem('backup_key');
    if (storedKey) {
      try {
        this.backupKey = await this.cryptoHelper.importKey(JSON.parse(storedKey));
      } catch (error) {
        console.error('Erro ao importar chave de backup:', error);
        this.backupKey = await this.cryptoHelper.generateKey();
        localStorage.setItem('backup_key', JSON.stringify(await this.cryptoHelper.exportKey(this.backupKey)));
      }
    } else {
      this.backupKey = await this.cryptoHelper.generateKey();
      localStorage.setItem('backup_key', JSON.stringify(await this.cryptoHelper.exportKey(this.backupKey)));
    }
  }

  async createBackup() {
    if (!this.backupKey) await this.init();
    try {
      const data = await this.dbManager.exportarDados();
      const dataWithIntegrity = {
        ...data,
        integrityHash: await this.generateIntegrityHash(data)
      };
      const encryptedData = await this.cryptoHelper.encrypt(dataWithIntegrity, this.backupKey);
      localStorage.setItem('encrypted_backup', JSON.stringify(encryptedData));
      localStorage.setItem('backup_timestamp', new Date().toISOString());
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      this.notifyBackupFailure(error);
      return { success: false, error: error.message };
    }
  }

  async restoreBackup() {
    if (!this.backupKey) await this.init();
    try {
      const encryptedBackup = localStorage.getItem('encrypted_backup');
      if (!encryptedBackup) throw new Error('Nenhum backup encontrado');
      const decryptedData = await this.cryptoHelper.decrypt(JSON.parse(encryptedBackup), this.backupKey);
      const storedHash = decryptedData.integrityHash;
      const { integrityHash, ...dataWithoutHash } = decryptedData;
      const calculatedHash = await this.generateIntegrityHash(dataWithoutHash);
      if (storedHash !== calculatedHash) throw new Error('Falha na verificação de integridade do backup');
      await this.dbManager.importarDados(dataWithoutHash);
      return { success: true, timestamp: decryptedData.dataExportacao };
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      return { success: false, error: error.message };
    }
  }

  async generateIntegrityHash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  notifyBackupFailure(error) {
    const notification = document.createElement('div');
    notification.className = 'backup-failure-notification';
    notification.innerHTML = `
      <div class="notification-header">
        <i class="fas fa-exclamation-triangle"></i>
        <h4>Falha no Backup</h4>
      </div>
      <div class="notification-body">
        <p>Ocorreu um erro ao realizar o backup automático:</p>
        <p class="error-message">${error.message}</p>
        <p>Recomendamos realizar um backup manual assim que possível.</p>
      </div>
      <div class="notification-actions">
        <button id="try-backup-again">Tentar Novamente</button>
        <button id="dismiss-notification">Dispensar</button>
      </div>
    `;

    document.body.appendChild(notification);
    document.getElementById('try-backup-again').addEventListener('click', async () => {
      notification.remove();
      await this.createBackup();
    });
    document.getElementById('dismiss-notification').addEventListener('click', () => {
      notification.remove();
    });
  }
}

window.SecureBackup = SecureBackup;
