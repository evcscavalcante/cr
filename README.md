# Calculadora de Compacidade

Aplicativo web para cálculos de ensaios geotécnicos conforme as normas NBR 6457:2024 e NBR 9813:2016.

## Início Rápido

Execute os comandos abaixo para instalar as dependências e rodar a suíte de testes:

```bash
npm install
npm test
```

Caso o Jest não seja encontrado durante a execução dos testes, verifique se todas as dependências foram instaladas corretamente com `npm install`.

## Estrutura do Projeto

O projeto foi estruturado com uma arquitetura modular, utilizando HTML5, CSS3 e JavaScript puro para garantir compatibilidade e desempenho em diversos dispositivos.

### Diretórios e Arquivos

- `/docs`: Código-fonte do aplicativo
  - `/css`: Estilos CSS
  - `/js`: Scripts JavaScript
  - `/assets`: Recursos estáticos (imagens, ícones)
  - `index.html`: Página principal
  - `/templates`: Formulários HTML carregados dinamicamente

Os templates de cada calculadora ficam na pasta `/docs/templates` e
são carregados em tempo de execução pelo script `template-loader.js`.
Isso reduz o tamanho do `index.html` e facilita a manutenção dos formulários.

### Módulos JavaScript

- `app.js`: Inicialização e navegação principal
- `calculos.js`: Implementação das fórmulas normativas
- `form-integration.js`: Integração entre formulários e cálculos
- `reference-system.js`: Sistema de referência cruzada entre registros
- `pdf-generator.js`: Geração de relatórios em PDF

## Funcionalidades Implementadas

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

8. **Responsividade**
   - Layout adaptável para smartphones e tablets
   - Uso de CSS Grid e Flexbox para organização responsiva

## Cabeçalhos dos Formulários

| Calculadora                | Campos do Cabeçalho                                                                             |
|----------------------------|------------------------------------------------------------------------------------------------|
| Densidade In Situ          | Número do Registro, Data, Operador, Responsável, Verificador, Material, Origem, Norte, Este, Cota, Quadrante, Camada, Hora |
| Densidade Real dos Grãos   | Número do Registro, Data, Operador, Material, Origem                                            |
| Densidade Máxima e Mínima  | Número do Registro, Data, Operador, Material, Origem                                            |

## Tecnologias Utilizadas

- HTML5
- CSS3 (Grid e Flexbox)
- JavaScript (ES6+)
- LocalStorage para persistência de dados
- Biblioteca para geração de PDF

## Servidor de Desenvolvimento

Execute `iniciar-servidor.bat` no diretório raiz do projeto para abrir o aplicativo em `http://localhost:8000`. O script usa `http-server` com cache desabilitado para que as alterações apareçam imediatamente.

## Instruções de Uso

1. Acesse o menu principal
2. Selecione o tipo de ensaio desejado
3. Preencha os dados de entrada
4. Os cálculos serão realizados automaticamente
5. Salve o ensaio ou gere um relatório em PDF

> **Atenção**: não abra `index.html` diretamente pelo navegador. As calculadoras
são carregadas via `fetch` e, se o arquivo for acessado usando `file://`, os
templates não serão encontrados e as páginas aparecerão em branco. Sempre utilize
`npm start` ou outro servidor local para executar a aplicação.

Ao publicar em serviços como **GitHub Pages**, defina a pasta `docs` como raiz do
site. Os formulários são buscados em `./templates` e precisam estar acessíveis no
mesmo caminho para que a aplicação funcione corretamente.

## Execução Local

Para servir a aplicação durante o desenvolvimento, utilize o script Node já incluído:

```bash
npm start
```

Ele executa `http-server` na pasta `docs` com cache desabilitado (opção `-c-1`) ouvindo a porta `8000`. Usuários Linux ou macOS também podem utilizar o script `start-server.sh`:

```bash
./start-server.sh
```

Esse script possui o mesmo comportamento do arquivo `iniciar-servidor.bat` para Windows.

## Geração de PDF

Ao gerar relatórios o sistema utiliza a biblioteca **html2pdf**, que encapsula
as dependências **html2canvas** e **jsPDF** para compor e salvar o arquivo PDF.
Esse script é carregado automaticamente em tempo de execução caso ainda não
esteja presente na página. É necessário conexão com a internet ou cópias locais
dessas bibliotecas para que o processo funcione corretamente. Caso o PDF seja
gerado em branco, certifique-se de estar executando a aplicação via servidor
(por exemplo, com `npm start`) para evitar problemas de CORS durante a captura
da página.

## Compatibilidade

O aplicativo foi testado e é compatível com:
- Google Chrome (versão 90+)
- Mozilla Firefox (versão 88+)
- Microsoft Edge (versão 90+)
- Safari (versão 14+)
- Chrome para Android
- Safari para iOS

## Desenvolvimento

1. Instale as dependências do projeto:
   ```bash
   npm install
   ```
   Isso baixa as bibliotecas listadas em `package.json`.

2. Rode a suíte de testes automatizados:
   ```bash
   npm test
   ```
   O comando executa o Jest conforme configurado no script `test`.

3. Inicie a aplicação localmente:
   - **Windows:** execute `iniciar-servidor.bat` para abrir o navegador. O script chama `http-server` na pasta `docs` sem cache.
   - **Outros sistemas:** rode `./start-server.sh` ou `npm start` para iniciar `http-server` na pasta `docs`.

## Próximos Passos

- Hospedagem do aplicativo para testes do usuário
- Coleta de feedback e ajustes finais
- Implementação de melhorias conforme necessidade
