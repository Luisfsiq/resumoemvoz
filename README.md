# 🎙️ Resumo em Áudio

Aplicação web que transforma **textos e documentos** em áudio narrado com **voz neural de inteligência artificial** em português brasileiro.

Cole um texto ou faça upload de arquivos (DOCX, PPTX, PDF, XLSX, TXT) e gere um resumo em áudio com vozes realistas da Microsoft Neural TTS.

![Preview da aplicação](https://img.shields.io/badge/Status-Funcionando-22c55e?style=for-the-badge) ![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)

---

## ✨ Funcionalidades

- 📝 **Entrada por texto** — Cole qualquer resumo na área de texto (até 10.000 caracteres)
- 📎 **Upload de arquivos** — Arraste e solte ou selecione documentos:
  - `.docx` (Microsoft Word)
  - `.pptx` (Microsoft PowerPoint)
  - `.pdf` (PDF)
  - `.xlsx` (Microsoft Excel)
  - `.txt` (Texto puro)
- 🗣️ **Vozes neurais de IA** — 2 vozes em português brasileiro:
  - **Francisca** (feminina)
  - **Antonio** (masculina)
- ⚡ **Controle de velocidade** — Ajuste de 0.5x até 2.0x
- 🎵 **Player integrado** — Reprodução com visualização de ondas sonoras
- 💾 **Download MP3** — Baixe o áudio gerado

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **Python 3.10+** | Linguagem principal |
| **Flask** | Servidor web |
| **edge-tts** | Vozes neurais da Microsoft (gratuito) |
| **python-docx** | Leitura de arquivos Word (.docx) |
| **python-pptx** | Leitura de apresentações PowerPoint (.pptx) |
| **PyPDF2** | Leitura de arquivos PDF |
| **openpyxl** | Leitura de planilhas Excel (.xlsx) |

---

## 🚀 Como Rodar

### Pré-requisitos

- **Python 3.10** ou superior instalado
- **pip** (gerenciador de pacotes do Python)
- Conexão com a internet (necessária para gerar as vozes neurais)

### Passo a passo

**1. Clone o repositório:**

```bash
git clone https://github.com/Luisfsiq/resumoemvoz.git
cd resumoemvoz
```

**2. (Opcional) Crie um ambiente virtual:**

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

**3. Instale as dependências:**

```bash
pip install -r requirements.txt
```

**4. Execute a aplicação:**

```bash
python app.py
```

**5. Acesse no navegador:**

```
http://localhost:5000
```

---

## 📖 Como Usar

1. **Escolha o modo de entrada:**
   - **Texto** — Cole o resumo diretamente na área de texto
   - **Arquivo** — Faça upload de um documento (.docx, .pptx, .pdf, .xlsx, .txt)

2. **Configure a voz:**
   - Selecione entre voz feminina (Francisca) ou masculina (Antonio)
   - Ajuste a velocidade de narração conforme preferir

3. **Gere o áudio:**
   - Clique em **"Gerar Áudio"**
   - Aguarde o processamento (pode levar alguns segundos dependendo do tamanho do texto)

4. **Ouça e baixe:**
   - Use o player integrado para ouvir o resultado
   - Clique em **"Baixar MP3"** para salvar o arquivo

---

## 📁 Estrutura do Projeto

```
resumoemvoz/
├── app.py                  # Backend Flask (rotas e geração de áudio)
├── text_extractor.py       # Módulo de extração de texto de documentos
├── requirements.txt        # Dependências Python
├── templates/
│   └── index.html          # Interface web (HTML)
├── static/
│   ├── css/
│   │   └── style.css       # Estilos (dark mode + glassmorphism)
│   └── js/
│       └── app.js          # Lógica do frontend (player, upload, etc.)
└── temp/                   # Arquivos temporários de áudio (criado automaticamente)
```

---

## ⚙️ Configurações

| Variável | Valor Padrão | Descrição |
|----------|-------------|-----------|
| Porta | `5000` | Porta do servidor Flask |
| Tamanho máximo de upload | `16 MB` | Limite para arquivos enviados |
| Limite de texto | `10.000 caracteres` | Máximo de caracteres por geração |
| Limpeza automática | `1 hora` | Áudios temporários são removidos após 1h |

---

## 📝 Licença

Este projeto é de uso livre para fins pessoais e educacionais.

> **Nota:** A biblioteca `edge-tts` utiliza o serviço de Text-to-Speech do Microsoft Edge. Para uso comercial em larga escala, considere a [API oficial do Azure Cognitive Services](https://azure.microsoft.com/pt-br/products/ai-services/text-to-speech/).
