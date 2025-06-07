// Módulo de banco de dados usando IndexedDB para a Calculadora de Compacidade
// Implementa funções para salvar, carregar, atualizar e excluir registros

// Namespace para calculadora
window.calculadora = window.calculadora || {};

// Módulo de banco de dados
window.calculadora.db = (() => {
        const DB_NAME = 'CalculadoraCompacidadeDB';
        const DB_VERSION = 1;
        const STORES = {
            IN_SITU: 'densidadeInSitu',
            REAL: 'densidadeReal',
            MAX_MIN: 'densidadeMaxMin'
        };
        
        let db = null;
        
        // Inicializar banco de dados
        function init() {
            return new Promise((resolve, reject) => {
                if (db) {
                    resolve(db);
                    return;
                }
                
                console.log('Inicializando banco de dados...');
                
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                
                request.onerror = (event) => {
                    console.error('Erro ao abrir banco de dados:', event.target.error);
                    reject(event.target.error);
                };
                
                request.onsuccess = (event) => {
                    db = event.target.result;
                    console.log('Banco de dados inicializado com sucesso');
                    
                    // Configurar backup automático
                    configurarBackupAutomatico();
                    
                    resolve(db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Criar object stores se não existirem
                    if (!db.objectStoreNames.contains(STORES.IN_SITU)) {
                        const inSituStore = db.createObjectStore(STORES.IN_SITU, { keyPath: 'registro' });
                        inSituStore.createIndex('data', 'data', { unique: false });
                        inSituStore.createIndex('operador', 'operador', { unique: false });
                        inSituStore.createIndex('material', 'material', { unique: false });
                    }
                    
                    if (!db.objectStoreNames.contains(STORES.REAL)) {
                        const realStore = db.createObjectStore(STORES.REAL, { keyPath: 'registro' });
                        realStore.createIndex('data', 'data', { unique: false });
                        realStore.createIndex('operador', 'operador', { unique: false });
                        realStore.createIndex('material', 'material', { unique: false });
                    }
                    
                    if (!db.objectStoreNames.contains(STORES.MAX_MIN)) {
                        const maxMinStore = db.createObjectStore(STORES.MAX_MIN, { keyPath: 'registro' });
                        maxMinStore.createIndex('data', 'data', { unique: false });
                        maxMinStore.createIndex('operador', 'operador', { unique: false });
                        maxMinStore.createIndex('material', 'material', { unique: false });
                    }
                    
                    console.log('Estrutura do banco de dados criada/atualizada');
                };
            });
        }
        
        // Configurar backup automático a cada 10 minutos
        function configurarBackupAutomatico() {
            setInterval(() => {
                exportarDados()
                    .then(dados => {
                        localStorage.setItem('calculadora_backup', JSON.stringify(dados));
                        console.log('Backup automático realizado:', new Date().toLocaleString());
                    })
                    .catch(error => {
                        console.error('Erro ao realizar backup automático:', error);
                    });
            }, 10 * 60 * 1000); // 10 minutos
        }
        
        // Salvar registro
        function salvarRegistro(tipo, dados) {
            return new Promise((resolve, reject) => {
                init()
                    .then(() => {
                        const store = getStoreByTipo(tipo);
                        if (!store) {
                            reject(new Error(`Tipo de ensaio inválido: ${tipo}`));
                            return;
                        }
                        
                        const transaction = db.transaction([store], 'readwrite');
                        const objectStore = transaction.objectStore(store);
                        
                        // Adicionar timestamp
                        dados.timestamp = new Date().getTime();
                        
                        const request = objectStore.put(dados);
                        
                        request.onsuccess = () => {
                            console.log(`Registro salvo com sucesso: ${dados.registro}`);
                            salvarRegistroFirestore(tipo, dados);
                            resolve(dados);
                        };
                        
                        request.onerror = (event) => {
                            console.error('Erro ao salvar registro:', event.target.error);
                            reject(event.target.error);
                        };
                    })
                    .catch(reject);
            });
        }
        
        // Carregar registro por ID
        function carregarRegistro(tipo, registro) {
            return new Promise((resolve, reject) => {
                init()
                    .then(() => {
                        const store = getStoreByTipo(tipo);
                        if (!store) {
                            reject(new Error(`Tipo de ensaio inválido: ${tipo}`));
                            return;
                        }
                        
                        const transaction = db.transaction([store], 'readonly');
                        const objectStore = transaction.objectStore(store);
                        const request = objectStore.get(registro);
                        
                        request.onsuccess = (event) => {
                            const resultado = event.target.result;
                            if (resultado) {
                                console.log(`Registro carregado: ${registro}`);
                                resolve(resultado);
                            } else {
                                console.log(`Registro não encontrado: ${registro}`);
                                resolve(null);
                            }
                        };
                        
                        request.onerror = (event) => {
                            console.error('Erro ao carregar registro:', event.target.error);
                            reject(event.target.error);
                        };
                    })
                    .catch(reject);
            });
        }
        
        // Listar todos os registros
        function listarRegistros(tipo) {
            return new Promise((resolve, reject) => {
                init()
                    .then(() => {
                        const store = getStoreByTipo(tipo);
                        if (!store) {
                            reject(new Error(`Tipo de ensaio inválido: ${tipo}`));
                            return;
                        }
                        
                        const transaction = db.transaction([store], 'readonly');
                        const objectStore = transaction.objectStore(store);
                        const request = objectStore.getAll();
                        
                        request.onsuccess = (event) => {
                            const registros = event.target.result;
                            console.log(`${registros.length} registros encontrados para ${tipo}`);
                            resolve(registros);
                        };
                        
                        request.onerror = (event) => {
                            console.error('Erro ao listar registros:', event.target.error);
                            reject(event.target.error);
                        };
                    })
                    .catch(reject);
            });
        }
        
        // Excluir registro
        function excluirRegistro(tipo, registro) {
            return new Promise((resolve, reject) => {
                init()
                    .then(() => {
                        const store = getStoreByTipo(tipo);
                        if (!store) {
                            reject(new Error(`Tipo de ensaio inválido: ${tipo}`));
                            return;
                        }
                        
                        const transaction = db.transaction([store], 'readwrite');
                        const objectStore = transaction.objectStore(store);
                        const request = objectStore.delete(registro);
                        
                        request.onsuccess = () => {
                            console.log(`Registro excluído: ${registro}`);
                            resolve(true);
                        };
                        
                        request.onerror = (event) => {
                            console.error('Erro ao excluir registro:', event.target.error);
                            reject(event.target.error);
                        };
                    })
                    .catch(reject);
            });
        }
        
        // Exportar todos os dados
        function exportarDados() {
            return new Promise((resolve, reject) => {
                init()
                    .then(() => {
                        const promises = [
                            listarRegistros('in-situ'),
                            listarRegistros('real'),
                            listarRegistros('max-min')
                        ];
                        
                        Promise.all(promises)
                            .then(([inSitu, real, maxMin]) => {
                                const dados = {
                                    inSitu,
                                    real,
                                    maxMin,
                                    dataExportacao: new Date().toISOString()
                                };
                                
                                resolve(dados);
                            })
                            .catch(reject);
                    })
                    .catch(reject);
            });
        }
        
        // Importar dados
        function importarDados(dados) {
            return new Promise((resolve, reject) => {
                if (!dados || !dados.inSitu || !dados.real || !dados.maxMin) {
                    reject(new Error('Dados inválidos para importação'));
                    return;
                }
                
                init()
                    .then(() => {
                        const promises = [];
                        
                        // Importar registros de densidade in situ
                        dados.inSitu.forEach(registro => {
                            promises.push(salvarRegistro('in-situ', registro));
                        });
                        
                        // Importar registros de densidade real
                        dados.real.forEach(registro => {
                            promises.push(salvarRegistro('real', registro));
                        });
                        
                        // Importar registros de densidade máxima e mínima
                        dados.maxMin.forEach(registro => {
                            promises.push(salvarRegistro('max-min', registro));
                        });
                        
                        Promise.all(promises)
                            .then(() => {
                                console.log('Importação concluída com sucesso');
                                resolve(true);
                            })
                            .catch(error => {
                                console.error('Erro durante a importação:', error);
                                reject(error);
                            });
                    })
                    .catch(reject);
            });
        }
        
        // Recuperar backup
        function recuperarBackup() {
            return new Promise((resolve, reject) => {
                const backup = localStorage.getItem('calculadora_backup');
                if (!backup) {
                    reject(new Error('Nenhum backup encontrado'));
                    return;
                }
                
                try {
                    const dados = JSON.parse(backup);
                    importarDados(dados)
                        .then(resolve)
                        .catch(reject);
                } catch (error) {
                    console.error('Erro ao processar backup:', error);
                    reject(error);
                }
            });
        }
        
        // Obter store pelo tipo de ensaio
        function getStoreByTipo(tipo) {
            switch (tipo) {
                case 'in-situ':
                    return STORES.IN_SITU;
                case 'real':
                    return STORES.REAL;
                case 'max-min':
                    return STORES.MAX_MIN;
                default:
                    return null;
            }
        }

        function salvarRegistroFirestore(tipo, dados) {
            if (!window.firebaseDB) return;
            const store = getStoreByTipo(tipo);
            if (!store) return;
            try {
                window.firebaseDB.collection(store).doc(String(dados.registro)).set(dados);
            } catch (e) {
                console.error('Erro ao salvar no Firestore:', e);
            }
        }
        
        // Verificar se o banco de dados está disponível
        function verificarDisponibilidade() {
            return new Promise((resolve) => {
                if (!window.indexedDB) {
                    console.error('Seu navegador não suporta IndexedDB');
                    resolve(false);
                    return;
                }
                
                init()
                    .then(() => resolve(true))
                    .catch(() => resolve(false));
            });
        }
        
        // API pública
               // Alias para carregar todos os ensaios (utilizado em form-integration.js)
        function carregarTodosEnsaios(tipo) {
            return listarRegistros(tipo);
        }

        // API pública
        return {
            init,
            salvarRegistro,
            carregarRegistro,
            listarRegistros,
            excluirRegistro,
            exportarDados,
            importarDados,
            recuperarBackup,
            verificarDisponibilidade,
            carregarTodosEnsaios // ✅ agora incluída aqui
        };
    })();
    
// Inicializar banco de dados automaticamente somente fora de testes
function autoInit() {
    window.calculadora.db.init()
        .then(() => {
            console.log('Banco de dados inicializado e pronto para uso');
            const event = new CustomEvent('dbReady');
            document.dispatchEvent(event);
        })
        .catch(error => {
            console.error('Falha ao inicializar banco de dados:', error);
        });
}

if (!(typeof process !== 'undefined' && process.env.JEST_WORKER_ID)) {
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', autoInit);
        } else {
            autoInit();
        }
    }
}
