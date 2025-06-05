class AuditLogger {
  constructor(api) {
    this.api = api;
    this.pendingLogs = [];
    this.syncInterval = 60000;
    setInterval(() => this.syncLogs(), this.syncInterval);
    window.addEventListener('beforeunload', () => this.syncLogs());
  }

  log(action, resource, details = {}) {
    const logEntry = {
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
      userId: this.api.getCurrentUserId() || 'anonymous',
      clientInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      }
    };
    this.pendingLogs.push(logEntry);
    if (this.isCriticalAction(action)) {
      this.syncLogs();
    }
    return logEntry;
  }

  isCriticalAction(action) {
    const criticalActions = ['login', 'logout', 'create', 'delete', 'update_sensitive'];
    return criticalActions.includes(action);
  }

  async syncLogs() {
    if (this.pendingLogs.length === 0) return;
    try {
      const logsToSync = [...this.pendingLogs];
      this.pendingLogs = [];
      await this.api.sendAuditLogs(logsToSync);
    } catch (error) {
      console.error('Erro ao sincronizar logs de auditoria:', error);
      this.pendingLogs = [...this.pendingLogs, ...logsToSync];
    }
  }
}

window.AuditLogger = AuditLogger;
