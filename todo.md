# Reestruturação do App de Calculadora de Compacidade

## Tarefas Gerais
- [x] Analisar requisitos e referências
- [x] Definir estrutura e campos de cada aba
- [x] Planejar estrutura de armazenamento e exportação
- [x] Criar interface HTML5 responsiva
- [x] Implementar lógica de cálculo e validação normativa
- [x] Adicionar sistema de referência cruzada e filtros
- [x] Implementar geração de relatório PDF
- [x] Validar funcionalidades e layout em múltiplos dispositivos
- [x] Atualizar documentação
- [x] Implementar geração de PDF com jsPDF
- [x] Implementar navegação de retorno
- [x] Corrigir campo "Número do Cilindro" faltante na densidade máxima
- [x] Implementar lógica de cálculo automático conforme normas
- [x] Hospedar aplicativo e fornecer link para testes
- [x] Reportar status final ao usuário

## Estrutura de Abas e Campos

### Menu Principal
- [ ] Botão "Densidade In Situ"
- [ ] Botão "Densidade Real dos Grãos"
- [ ] Botão "Densidade Máxima e Mínima"

### Aba: Densidade In Situ (NBR 9813:2016)
#### Campos de Entrada
- [ ] Informações Gerais
  - [ ] Registro (ex: CR-225)
  - [ ] Data (ex: 22/05/2025)
  - [ ] Operador
  - [ ] Responsável pelo cálculo
  - [ ] Verificador
  - [ ] Material
  - [ ] Origem
  - [ ] Localização (Norte, Este, Cota, Quadrante)
  - [ ] Camada N°
  - [ ] Hora

- [ ] Dispositivos de Precisão
  - [ ] Balança
  - [ ] Estufa

- [ ] Densidade In Situ - Cilindro de Cravação
  - [ ] Número do Cilindro
  - [ ] Molde + Solo (g)
  - [ ] Molde (g)
  - [ ] Solo (g) (calculado)
  - [ ] Volume (cm³)
  - [ ] γnat (g/cm³) (calculado)

- [ ] Teor de Umidade
  - [ ] Cápsula N° (para Topo e Base)
  - [ ] Solo Úmido + Tara (g)
  - [ ] Solo Seco + Tara (g)
  - [ ] Tara (g)
  - [ ] Solo Seco (g) (calculado)
  - [ ] Água (g) (calculado)
  - [ ] Umidade (%) (calculado)
  - [ ] Umidade Média (%) (calculado)

- [ ] Seleção de Registros
  - [ ] Seleção de Registro da Densidade Real
  - [ ] Seleção de Registro da Densidade Máxima/Mínima

#### Campos de Saída
- [ ] γd (g/cm³) (calculado)
- [ ] Índice de Vazios (IV) para Topo e Base (calculado)
- [ ] Compacidade Relativa (CR) (calculado)
- [ ] Status do Ensaio (Aprovado/Reprovado)

### Aba: Densidade Real dos Grãos (NBR 6457:2024)
#### Campos de Entrada
- [ ] Informações Gerais
  - [ ] Registro (ex: MRG-018)
  - [ ] Data
  - [ ] Operador
  - [ ] Material
  - [ ] Origem

- [ ] Teor de Umidade
  - [ ] Cápsula N° (3 determinações)
  - [ ] Solo Úmido + Tara (g)
  - [ ] Solo Seco + Tara (g)
  - [ ] Tara (g)
  - [ ] Solo Seco (g) (calculado)
  - [ ] Água (g) (calculado)
  - [ ] Umidade (%) (calculado)
  - [ ] Umidade Média (%) (calculado)

- [ ] Picnômetro (2 determinações)
  - [ ] Picnômetro N°
  - [ ] Massa do Picnômetro (g)
  - [ ] Massa do Pic. + Amostra + Água (g)
  - [ ] Temperatura (°C)
  - [ ] Massa do Pic. + Água (g)
  - [ ] Densidade da Água à Temperatura (g/cm³) (calculado)
  - [ ] Massa do Solo Úmido (g)
  - [ ] Massa do Solo Seco (g) (calculado)

#### Campos de Saída
- [ ] Densidade Real dos Grãos (g/cm³) (calculado para cada determinação)
- [ ] Diferença (g/cm³) (calculado)
- [ ] Média - Densidade Real dos Grãos (g/cm³) (calculado)

### Aba: Densidade Máxima e Mínima
#### Campos de Entrada
- [ ] Informações Gerais
  - [ ] Registro
  - [ ] Data
  - [ ] Operador
  - [ ] Material
  - [ ] Origem

- [ ] Densidade Seca Máxima
  - [ ] Determinação N° (3 determinações)
  - [ ] Molde + Solo (g)
  - [ ] Molde (g)
  - [ ] Solo (g) (calculado)
  - [ ] Volume (cm³)
  - [ ] γd (g/cm³) (calculado)
  - [ ] w (%)
  - [ ] γs (g/cm³) (calculado)
  - [ ] γdmax (g/cm³) (calculado - média)

- [ ] Densidade Seca Mínima
  - [ ] Número do Cilindro (3 determinações)
  - [ ] Molde + Solo (g)
  - [ ] Molde (g)
  - [ ] Solo (g) (calculado)
  - [ ] Volume (cm³)
  - [ ] γd (g/cm³) (calculado)
  - [ ] w (%)
  - [ ] γs (g/cm³) (calculado)
  - [ ] γdmin (g/cm³) (calculado - média)

## Sistema de Armazenamento e Exportação
- [ ] Estrutura JSON para armazenamento local
- [ ] Sistema de referência cruzada entre registros
- [ ] Filtros por data e registro
- [ ] Exportação de relatórios em PDF
- [ ] Backup de dados

## Interface e Responsividade
- [ ] Layout responsivo para smartphones e tablets
- [ ] Grid e flexbox para organização dos elementos
- [ ] Validação de campos em tempo real
- [ ] Feedback visual para erros e sucessos
- [ ] Botões de navegação intuitivos
