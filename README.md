# 🎙️ Resumo em Áudio

Aplicação web que transforma **textos e documentos** em áudio narrado com **voz neural de inteligência artificial** em português brasileiro. Também permite **clonar sua própria voz** para narrar o resumo.

Cole um texto ou faça upload de arquivos (DOCX, PPTX, PDF, XLSX, TXT) e gere um resumo em áudio com vozes realistas.

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
- 🎤 **Clonagem de voz** *(opcional)* — Grave sua própria voz e o sistema clona para narrar o resumo:
  - Gravação guiada com 3 frases de referência
  - Interface intuitiva com timer, playback e regravação
  - Usa **Coqui TTS XTTS-v2** para clonagem neural
- ⚡ **Controle de velocidade** — Ajuste de 0.5x até 2.0x (modo neural)
- 🎵 **Player integrado** — Reprodução com visualização de ondas sonoras
- 💾 **Download** — Baixe o áudio gerado (MP3 ou WAV)

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **Python 3.10+** | Linguagem principal |
| **Flask** | Servidor web |
| **edge-tts** | Vozes neurais da Microsoft (gratuito) |
| **Coqui TTS** *(opcional)* | Clonagem de voz com XTTS-v2 |
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

**4. (Opcional) Habilite a clonagem de voz:**

> ⚠️ A clonagem de voz requer a biblioteca **Coqui TTS**, que instala o PyTorch (~2GB de download). Só instale se quiser usar o recurso "Sua Voz".

```bash
pip install TTS
```

**5. Execute a aplicação:**

```bash
python app.py
```

**6. Acesse no navegador:**

```
http://localhost:5000
```

---

## 📖 Como Usar

### Modo Voz Neural (padrão)

1. **Escolha o modo de entrada:**
   - **Texto** — Cole o resumo diretamente na área de texto
   - **Arquivo** — Faça upload de um documento (.docx, .pptx, .pdf, .xlsx, .txt)

2. **Configure a voz:**
   - Selecione entre voz feminina (Francisca) ou masculina (Antonio)
   - Ajuste a velocidade de narração conforme preferir

3. **Gere o áudio:**
   - Clique em **"Gerar Áudio"** e aguarde o processamento

4. **Ouça e baixe:**
   - Use o player integrado para ouvir o resultado
   - Clique em **"Baixar MP3"** para salvar o arquivo

### Modo Sua Voz (clonagem)

1. Na seção **"Configurações de Voz"**, clique na aba **"Sua Voz"**
2. Grave as **3 frases** exibidas na tela:
   - Clique no botão de microfone de cada frase
   - Leia em voz alta, de forma natural
   - Cada gravação dura até 10 segundos
3. Após gravar as 3 frases, clique em **"Gerar Áudio"**
4. Aguarde o processamento (pode levar alguns minutos com clonagem de voz)

> 💡 **Dica:** Grave em um ambiente silencioso, a ~20cm do microfone, para melhores resultados.

---

## 📁 Estrutura do Projeto

```
resumoemvoz/
├── app.py                  # Backend Flask (rotas e geração de áudio)
├── text_extractor.py       # Módulo de extração de texto de documentos
├── voice_cloner.py         # Módulo de clonagem de voz (Coqui TTS XTTS-v2)
├── requirements.txt        # Dependências Python
├── templates/
│   └── index.html          # Interface web (HTML)
├── static/
│   ├── css/
│   │   └── style.css       # Estilos (dark mode + glassmorphism)
│   └── js/
│       └── app.js          # Lógica do frontend (player, upload, gravação, etc.)
└── temp/                   # Arquivos temporários de áudio (criado automaticamente)
```

---

## ⚙️ Configurações

| Variável | Valor Padrão | Descrição |
|----------|-------------|-----------|
| Porta | `5000` | Porta do servidor Flask |
| Tamanho máximo de upload | `16 MB` | Limite para arquivos enviados |
| Limite de texto (neural) | `10.000 caracteres` | Máximo de caracteres por geração |
| Limite de texto (clone) | `3.000 caracteres` | Máximo para clonagem (mais lento) |
| Limpeza automática | `1 hora` | Áudios temporários são removidos após 1h |

---

## 📝 Licença

Este projeto é de uso livre para fins pessoais e educacionais.

> **Nota:** A biblioteca `edge-tts` utiliza o serviço de Text-to-Speech do Microsoft Edge. A biblioteca `TTS` (Coqui) é open-source sob licença MPL-2.0. Para uso comercial em larga escala, considere as APIs oficiais dos respectivos provedores.
