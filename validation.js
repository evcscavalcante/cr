// Módulo de validação para a Calculadora de Compacidade
// Implementa validação em tempo real para todos os campos de entrada

document.addEventListener('DOMContentLoaded', () => {
    // Namespace para validação
    window.calculadora = window.calculadora || {};
    
    // Módulo de validação
    window.calculadora.validacao = (() => {
        // Regras de validação por tipo de campo
        const regras = {
            // Campos numéricos
            numero: {
                validar: (valor, min, max) => {
                    if (valor === '') return { valido: true, mensagem: '' }; // Campo vazio é permitido
                    
                    const num = parseFloat(valor);
                    if (isNaN(num)) return { valido: false, mensagem: 'Digite um número válido' };
                    
                    if (min !== undefined && num < min) return { valido: false, mensagem: `Valor mínimo: ${min}` };
                    if (max !== undefined && num > max) return { valido: false, mensagem: `Valor máximo: ${max}` };
                    
                    return { valido: true, mensagem: '' };
                }
            },
            
            // Campos de texto
            texto: {
                validar: (valor, obrigatorio = false, maxLength) => {
                    if (obrigatorio && (!valor || valor.trim() === '')) {
                        return { valido: false, mensagem: 'Campo obrigatório' };
                    }
                    
                    if (maxLength && valor && valor.length > maxLength) {
                        return { valido: false, mensagem: `Máximo de ${maxLength} caracteres` };
                    }
                    
                    return { valido: true, mensagem: '' };
                }
            },
            
            // Campos de data
            data: {
                validar: (valor, obrigatorio = false) => {
                    if (obrigatorio && (!valor || valor.trim() === '')) {
                        return { valido: false, mensagem: 'Data obrigatória' };
                    }
                    
                    if (valor && !isValidDate(valor)) {
                        return { valido: false, mensagem: 'Data inválida' };
                    }
                    
                    return { valido: true, mensagem: '' };
                }
            }
        };
        
        // Função auxiliar para verificar se uma data é válida
        function isValidDate(dateString) {
            // Verificar formato YYYY-MM-DD (HTML5 date input)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                const parts = dateString.split('-');
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Meses em JS são 0-11
                const day = parseInt(parts[2], 10);
                
                const date = new Date(year, month, day);
                return date.getFullYear() === year && 
                       date.getMonth() === month && 
                       date.getDate() === day;
            }
            
            // Verificar formato DD/MM/YYYY
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                const parts = dateString.split('/');
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Meses em JS são 0-11
                const year = parseInt(parts[2], 10);
                
                const date = new Date(year, month, day);
                return date.getFullYear() === year && 
                       date.getMonth() === month && 
                       date.getDate() === day;
            }
            
            return false;
        }
        
        // Configurar validação para um campo específico
        function configurarValidacao(campo, tipo, opcoes = {}) {
            if (!campo || !tipo || !regras[tipo]) return;
            
            // Adicionar classe para estilização
            campo.classList.add('campo-validavel');
            
            // Criar elemento para mensagem de erro
            const mensagemErro = document.createElement('div');
            mensagemErro.className = 'mensagem-erro';
            campo.parentNode.appendChild(mensagemErro);
            
            // Função para validar o campo
            const validarCampo = () => {
                const valor = campo.value;
                let resultado;
                
                switch (tipo) {
                    case 'numero':
                        resultado = regras.numero.validar(valor, opcoes.min, opcoes.max);
                        break;
                    case 'texto':
                        resultado = regras.texto.validar(valor, opcoes.obrigatorio, opcoes.maxLength);
                        break;
                    case 'data':
                        resultado = regras.data.validar(valor, opcoes.obrigatorio);
                        break;
                    default:
                        resultado = { valido: true, mensagem: '' };
                }
                
                // Atualizar estado visual do campo
                if (resultado.valido) {
                    campo.classList.remove('campo-invalido');
                    campo.classList.add('campo-valido');
                    mensagemErro.textContent = '';
                    mensagemErro.style.display = 'none';
                } else {
                    campo.classList.remove('campo-valido');
                    campo.classList.add('campo-invalido');
                    mensagemErro.textContent = resultado.mensagem;
                    mensagemErro.style.display = 'block';
                }
                
                return resultado.valido;
            };
            
            // Adicionar event listeners
            campo.addEventListener('input', validarCampo);
            campo.addEventListener('blur', validarCampo);
            
            // Armazenar função de validação no campo
            campo.validar = validarCampo;
        }
        
        // Configurar validação para todos os campos de um formulário
        function configurarValidacaoFormulario(formulario, mapeamento) {
            if (!formulario || !mapeamento) return;
            
            Object.keys(mapeamento).forEach(seletor => {
                const campo = formulario.querySelector(seletor);
                if (campo) {
                    configurarValidacao(campo, mapeamento[seletor].tipo, mapeamento[seletor].opcoes);
                }
            });
            
            // Adicionar método para validar todo o formulário
            formulario.validarTudo = function() {
                let todosValidos = true;
                
                Object.keys(mapeamento).forEach(seletor => {
                    const campo = formulario.querySelector(seletor);
                    if (campo && campo.validar) {
                        const valido = campo.validar();
                        todosValidos = todosValidos && valido;
                    }
                });
                
                return todosValidos;
            };
        }
        
        // Configurar validação para formulário de Densidade In Situ
        function configurarValidacaoDensidadeInSitu(formulario) {
            const mapeamento = {
                // Informações Gerais
                '#registro': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 20 } },
                '#data': { tipo: 'data', opcoes: { obrigatorio: true } },
                '#operador': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 50 } },
                '#responsavel': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 50 } },
                '#verificador': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 50 } },
                '#material': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 50 } },
                '#origem': { tipo: 'texto', opcoes: { maxLength: 50 } },
                '#norte': { tipo: 'texto', opcoes: { maxLength: 20 } },
                '#este': { tipo: 'texto', opcoes: { maxLength: 20 } },
                '#cota': { tipo: 'texto', opcoes: { maxLength: 20 } },
                '#quadrante': { tipo: 'texto', opcoes: { maxLength: 50 } },
                '#camada': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#hora': { tipo: 'texto', opcoes: { maxLength: 10 } },
                
                // Dispositivos de Precisão
                '#balanca': { tipo: 'texto', opcoes: { maxLength: 20 } },
                '#estufa': { tipo: 'texto', opcoes: { maxLength: 20 } },
                
                // Densidade In Situ - Cilindro de Cravação
                '#numero-cilindro': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#molde-solo': { tipo: 'numero', opcoes: { min: 0 } },
                '#molde': { tipo: 'numero', opcoes: { min: 0 } },
                '#volume': { tipo: 'numero', opcoes: { min: 0 } },
                
                // Teor de Umidade - Topo
                '#capsula-topo': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#solo-umido-tara-topo': { tipo: 'numero', opcoes: { min: 0 } },
                '#solo-seco-tara-topo': { tipo: 'numero', opcoes: { min: 0 } },
                '#tara-topo': { tipo: 'numero', opcoes: { min: 0 } },
                
                // Teor de Umidade - Base
                '#capsula-base': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#solo-umido-tara-base': { tipo: 'numero', opcoes: { min: 0 } },
                '#solo-seco-tara-base': { tipo: 'numero', opcoes: { min: 0 } },
                '#tara-base': { tipo: 'numero', opcoes: { min: 0 } }
            };
            
            configurarValidacaoFormulario(formulario, mapeamento);
        }
        
        // Configurar validação para formulário de Densidade Real
        function configurarValidacaoDensidadeReal(formulario) {
            const mapeamento = {
                // Informações Gerais
                '#registro-real': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 20 } },
                '#data-real': { tipo: 'data', opcoes: { obrigatorio: true } },
                '#operador-real': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 50 } },
                '#material-real': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 50 } },
                '#origem-real': { tipo: 'texto', opcoes: { maxLength: 50 } },
                
                // Teor de Umidade
                '#capsula-real-1': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#solo-umido-tara-real-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#solo-seco-tara-real-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#tara-real-1': { tipo: 'numero', opcoes: { min: 0 } },
                
                '#capsula-real-2': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#solo-umido-tara-real-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#solo-seco-tara-real-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#tara-real-2': { tipo: 'numero', opcoes: { min: 0 } },
                
                '#capsula-real-3': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#solo-umido-tara-real-3': { tipo: 'numero', opcoes: { min: 0 } },
                '#solo-seco-tara-real-3': { tipo: 'numero', opcoes: { min: 0 } },
                '#tara-real-3': { tipo: 'numero', opcoes: { min: 0 } },
                
                // Picnômetro
                '#picnometro-1': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#massa-pic-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#massa-pic-amostra-agua-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#temperatura-1': { tipo: 'numero', opcoes: { min: 0, max: 100 } },
                '#massa-pic-agua-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#massa-solo-umido-1': { tipo: 'numero', opcoes: { min: 0 } },
                
                '#picnometro-2': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#massa-pic-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#massa-pic-amostra-agua-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#temperatura-2': { tipo: 'numero', opcoes: { min: 0, max: 100 } },
                '#massa-pic-agua-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#massa-solo-umido-2': { tipo: 'numero', opcoes: { min: 0 } }
            };
            
            configurarValidacaoFormulario(formulario, mapeamento);
        }
        
        // Configurar validação para formulário de Densidade Máxima e Mínima
        function configurarValidacaoDensidadeMaxMin(formulario) {
            const mapeamento = {
                // Informações Gerais
                '#registro-max-min': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 20 } },
                '#data-max-min': { tipo: 'data', opcoes: { obrigatorio: true } },
                '#operador-max-min': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 50 } },
                '#material-max-min': { tipo: 'texto', opcoes: { obrigatorio: true, maxLength: 50 } },
                '#origem-max-min': { tipo: 'texto', opcoes: { maxLength: 50 } },
                
                // Densidade Máxima
                '#numero-cilindro-max-1': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#molde-solo-max-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#molde-max-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#volume-max-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#w-max-1': { tipo: 'numero', opcoes: { min: 0 } },
                
                '#numero-cilindro-max-2': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#molde-solo-max-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#molde-max-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#volume-max-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#w-max-2': { tipo: 'numero', opcoes: { min: 0 } },
                
                '#numero-cilindro-max-3': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#molde-solo-max-3': { tipo: 'numero', opcoes: { min: 0 } },
                '#molde-max-3': { tipo: 'numero', opcoes: { min: 0 } },
                '#volume-max-3': { tipo: 'numero', opcoes: { min: 0 } },
                '#w-max-3': { tipo: 'numero', opcoes: { min: 0 } },
                
                // Densidade Mínima
                '#numero-cilindro-min-1': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#molde-solo-min-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#molde-min-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#volume-min-1': { tipo: 'numero', opcoes: { min: 0 } },
                '#w-min-1': { tipo: 'numero', opcoes: { min: 0 } },
                
                '#numero-cilindro-min-2': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#molde-solo-min-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#molde-min-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#volume-min-2': { tipo: 'numero', opcoes: { min: 0 } },
                '#w-min-2': { tipo: 'numero', opcoes: { min: 0 } },
                
                '#numero-cilindro-min-3': { tipo: 'texto', opcoes: { maxLength: 10 } },
                '#molde-solo-min-3': { tipo: 'numero', opcoes: { min: 0 } },
                '#molde-min-3': { tipo: 'numero', opcoes: { min: 0 } },
                '#volume-min-3': { tipo: 'numero', opcoes: { min: 0 } },
                '#w-min-3': { tipo: 'numero', opcoes: { min: 0 } }
            };
            
            configurarValidacaoFormulario(formulario, mapeamento);
        }
        
        // Inicializar validação quando o formulário for carregado
        document.addEventListener('formLoaded', (event) => {
            const { form, tipo } = event.detail;
            
            switch (tipo) {
                case 'in-situ':
                    configurarValidacaoDensidadeInSitu(form);
                    break;
                case 'real':
                    configurarValidacaoDensidadeReal(form);
                    break;
                case 'max-min':
                    configurarValidacaoDensidadeMaxMin(form);
                    break;
            }
            
            console.log(`Validação configurada para formulário de ${tipo}`);
        });
        
        // API pública
        return {
            configurarValidacao,
            configurarValidacaoFormulario,
            configurarValidacaoDensidadeInSitu,
            configurarValidacaoDensidadeReal,
            configurarValidacaoDensidadeMaxMin
        };
    })();
});
