# Calculadora de Compacidade

Aplicativo web para cálculos de ensaios geotécnicos conforme as normas NBR 6457:2024 e NBR 9813:2016.

## Estrutura do Projeto

O projeto foi estruturado com uma arquitetura modular, utilizando HTML5, CSS3 e JavaScript puro para garantir compatibilidade e desempenho em diversos dispositivos.

### Diretórios e Arquivos

- `/docs`: Código-fonte do aplicativo
  - `/css`: Estilos CSS
  - `/js`: Scripts JavaScript
  - `/assets`: Recursos estáticos (imagens, ícones)
  - `index.html`: Página principal

### Módulos JavaScript

- `app.js`: Inicialização e navegação principal
- `calculos.js`: Implementação das fórmulas normativas
- `form-integration.js`: Integração entre formulários e cálculos
- `reference-system.js`: Sistema de referência cruzada entre registros
- `pdf-generator.js`: Geração de relatórios em PDF
- `main.js`: Integração de todos os módulos

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

## Tecnologias Utilizadas

- HTML5
- CSS3 (Grid e Flexbox)
- JavaScript (ES6+)
- LocalStorage para persistência de dados
- Biblioteca para geração de PDF

## Instruções de Uso

1. Acesse o menu principal
2. Selecione o tipo de ensaio desejado
3. Preencha os dados de entrada
4. Clique em "Calcular" para obter os resultados
5. Salve o ensaio ou gere um relatório em PDF

## Execução Local

Para servir a aplicação durante o desenvolvimento, utilize o script Node já incluído:

```bash
npm start
```

Ele executa `http-server` na pasta `docs` ouvindo a porta `8000`. Usuários Linux ou macOS também podem utilizar o script `start-server.sh`:

```bash
./start-server.sh
```

Esse script possui o mesmo comportamento do arquivo `iniciar-servidor.bat` para Windows.

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
   - **Windows:** execute `iniciar-servidor.bat` para abrir o navegador e iniciar `python -m http.server` na pasta `docs`.
   - **Outros sistemas:** acesse o diretório `docs` e rode `python3 -m http.server 8000`, depois visite `http://localhost:8000`.

## Próximos Passos

- Hospedagem do aplicativo para testes do usuário
- Coleta de feedback e ajustes finais
- Implementação de melhorias conforme necessidade
