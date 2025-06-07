# Calculadora de Compacidade (Versão Melhorada)

Aplicativo web para cálculos de ensaios geotécnicos conforme as normas NBR 6457:2024 e NBR 9813:2016.

## Melhorias Implementadas

Esta versão inclui diversas melhorias em relação à versão original:

1. **Arquitetura Moderna**
   - Sistema de build completo com Webpack
   - Suporte para módulos ES (import/export)
   - Bundling, minificação e otimizações
   - Lazy loading para carregamento sob demanda

2. **Segurança Aprimorada**
   - Sanitização de HTML com DOMPurify
   - Content Security Policy (CSP) implementada
   - Validação robusta de dados de entrada
   - Proteção contra ataques XSS

3. **Novas Funcionalidades**
   - Visualizações gráficas com Chart.js
   - Exportação de dados em CSV e JSON
   - Interface responsiva aprimorada
   - Sistema de testes integrado

4. **Otimizações de Desempenho**
   - Consultas otimizadas ao IndexedDB
   - Redução de manipulações desnecessárias do DOM
   - Carregamento sob demanda de recursos

## Início Rápido

Execute os comandos abaixo para instalar as dependências e iniciar o projeto:

```bash
# Instalar dependências
npm install

# Executar testes
npm test

# Iniciar servidor de desenvolvimento
npm start

# Construir versão de produção
npm run build
```

## Estrutura do Projeto

O projeto foi reestruturado com uma arquitetura modular mais robusta:

### Diretórios e Arquivos

- `/src`: Código-fonte do aplicativo
  - `/css`: Estilos CSS
  - `/js`: Scripts JavaScript modularizados
  - `/img`: Recursos estáticos (imagens, ícones)
  - `/templates`: Formulários HTML carregados dinamicamente
  - `index.html`: Página principal
  - `test.html`: Página de testes das melhorias
- `/dist`: Código compilado e otimizado (gerado pelo Webpack)
- `/docs`: Versão de produção para deploy

### Módulos JavaScript

- **Módulos Originais Refatorados:**
  - `app.js`: Inicialização e navegação principal
  - `calculos.js`: Implementação das fórmulas normativas
  - `form-integration.js`: Integração entre formulários e cálculos
  - `reference-system.js`: Sistema de referência cruzada entre registros
  - `pdf-generator.js`: Geração de relatórios em PDF

- **Novos Módulos:**
  - `data-visualization.js`: Visualizações gráficas com Chart.js
  - `data-exporter.js`: Exportação de dados em diferentes formatos
  - `security-manager.js`: Gerenciamento de segurança e CSP
  - `testes.js`: Sistema de testes para verificar as modificações

## Funcionalidades Implementadas

### Funcionalidades Originais

1. **Menu Principal**
   - Navegação entre as três calculadoras principais

2. **Densidade In Situ**
   - Cálculo de γ_in_situ = (massa solo) / volume
   - Cálculo de IV = (γ_real / γ_in_situ) - 1 (para topo e base)
   - Validação de resultados conforme NBR 9813:2016

3. **Densidade Real dos Grãos**
   - Implementação completa conforme planilha Excel de referência
   - Cálculo de média e validação de diferenças

4. **Densidade Máxima e Mínima**
   - Três determinações para cada densidade
   - Cálculo de médias e validação

5. **Sistema de Referência Cruzada**
   - Seleção de registros de Densidade Real para cálculos de In Situ
   - Seleção de registros de Densidade Máxima/Mínima para cálculos de In Situ

6. **Filtros e Busca**
   - Filtros por data e registro
   - Busca por texto em múltiplos campos

7. **Geração de Relatórios**
   - Exportação em PDF formatada por tipo de ensaio
   - Inclusão de fórmulas, dados de entrada e resultados

### Novas Funcionalidades

1. **Visualização de Dados**
   - Gráficos de barras, linhas e dispersão
   - Visualização interativa dos resultados
   - Comparação visual entre diferentes ensaios

2. **Exportação de Dados**
   - Exportação em formato CSV para uso em planilhas
   - Exportação em formato JSON para integração com outros sistemas
   - Opções de personalização da exportação

3. **Segurança Aprimorada**
   - Sanitização de HTML para prevenir ataques XSS
   - Content Security Policy para prevenir injeção de código malicioso
   - Validação robusta de dados de entrada
   - Monitoramento de violações de segurança

4. **Sistema de Testes**
   - Testes automatizados para verificar funcionalidades
   - Testes de carga de templates
   - Testes de integração com o banco de dados
   - Testes de segurança

## Tecnologias Utilizadas

- HTML5
- CSS3 (Grid e Flexbox)
- JavaScript (ES6+)
- Webpack (sistema de build)
- Babel (transpilação)
- Chart.js (visualização de dados)
- DOMPurify (sanitização de HTML)
- IndexedDB para persistência de dados
- Jest para testes automatizados

## Servidor de Desenvolvimento

O projeto agora inclui um servidor de desenvolvimento configurado com Webpack:

```bash
npm start
```

Este comando inicia o servidor de desenvolvimento com hot-reload, permitindo que as alterações sejam refletidas automaticamente no navegador.

## Build de Produção

Para gerar uma versão otimizada para produção:

```bash
npm run build
```

Este comando gera os arquivos otimizados na pasta `/dist`, prontos para deploy.

## Testes

Execute os testes automatizados com:

```bash
npm test
```

Além disso, uma página de testes interativa está disponível em `/test.html`, permitindo testar as novas funcionalidades diretamente no navegador.

## Compatibilidade

O aplicativo foi testado e é compatível com:
- Google Chrome (versão 90+)
- Mozilla Firefox (versão 88+)
- Microsoft Edge (versão 90+)
- Safari (versão 14+)
- Chrome para Android
- Safari para iOS

## Desenvolvimento

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/calculadora-compacidade.git
   cd calculadora-compacidade
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```

4. Execute os testes:
   ```bash
   npm test
   ```

5. Gere a versão de produção:
   ```bash
   npm run build
   ```

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests com melhorias.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença ISC - veja o arquivo LICENSE para mais detalhes.

