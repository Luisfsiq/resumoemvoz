"""
Resumo em Áudio — Backend Flask
Converte texto ou documentos em áudio com voz neural de IA.
"""

import os
import asyncio
import uuid
import time
import re
from flask import Flask, render_template, request, jsonify, send_file
import edge_tts

from text_extractor import extract_text, is_allowed_file, get_supported_extensions

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'temp')

# Criar pasta temporária
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Vozes disponíveis em PT-BR
VOICES = {
    'francisca': {
        'id': 'pt-BR-FranciscaNeural',
        'name': 'Francisca',
        'gender': 'Feminina',
    },
    'antonio': {
        'id': 'pt-BR-AntonioNeural',
        'name': 'Antonio',
        'gender': 'Masculina',
    }
}


def cleanup_old_files(max_age_seconds=3600):
    """Remove arquivos temporários com mais de 1 hora"""
    temp_dir = app.config['UPLOAD_FOLDER']
    now = time.time()
    for filename in os.listdir(temp_dir):
        filepath = os.path.join(temp_dir, filename)
        if os.path.isfile(filepath):
            if now - os.path.getmtime(filepath) > max_age_seconds:
                try:
                    os.remove(filepath)
                except OSError:
                    pass


def process_text_for_narration(text: str) -> str:
    """
    Processa o texto para narração:
    - Limpa formatação excessiva
    - Organiza em pontos claros
    - Adiciona pausas naturais
    """
    # Remove múltiplas quebras de linha
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove caracteres especiais excessivos
    text = re.sub(r'[*_#>]{2,}', '', text)
    
    # Remove URLs
    text = re.sub(r'https?://\S+', '', text)
    
    # Limpa espaços extras
    text = re.sub(r' {2,}', ' ', text)
    
    # Divide em sentenças
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    # Remove sentenças muito curtas (menos de 10 caracteres)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    # Reconstroi o texto com pausas naturais
    processed = '. '.join(sentences)
    
    # Garante que termina com pontuação
    if processed and processed[-1] not in '.!?':
        processed += '.'
    
    return processed


def extract_key_points(text: str) -> str:
    """
    Extrai os pontos principais do texto e formata para narração.
    """
    # Introdução
    intro = "Aqui estão os principais pontos do resumo.\n\n"
    
    # Processa o texto
    processed = process_text_for_narration(text)
    
    # Se o texto é muito longo, tenta dividir em seções
    paragraphs = [p.strip() for p in processed.split('\n') if p.strip()]
    
    if len(paragraphs) > 1:
        narration_parts = []
        for i, para in enumerate(paragraphs):
            if len(para) > 10:
                narration_parts.append(para)
        narration = '\n\n'.join(narration_parts)
    else:
        narration = processed
    
    # Conclusão
    conclusion = "\n\nEsses foram os principais pontos do resumo."
    
    return intro + narration + conclusion


async def generate_audio_async(text: str, voice_id: str, rate: str, output_path: str):
    """Gera áudio usando edge-tts de forma assíncrona"""
    communicate = edge_tts.Communicate(text, voice_id, rate=rate)
    await communicate.save(output_path)


@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')


@app.route('/voices', methods=['GET'])
def get_voices():
    """Retorna as vozes disponíveis"""
    return jsonify(VOICES)


@app.route('/supported-formats', methods=['GET'])
def supported_formats():
    """Retorna os formatos de arquivo suportados"""
    return jsonify({'formats': get_supported_extensions()})


@app.route('/check-tts', methods=['GET'])
def check_tts():
    """Verifica se o modulo de clonagem de voz (Coqui TTS) esta disponivel"""
    try:
        from voice_cloner import is_available
        return jsonify({'available': is_available()})
    except Exception:
        return jsonify({'available': False})


@app.route('/generate', methods=['POST'])
def generate_audio():
    """
    Gera áudio a partir de texto ou arquivo.
    Aceita:
      - JSON com campo 'text'
      - FormData com campo 'file' (upload de documento)
    """
    cleanup_old_files()
    
    text = None
    voice_key = 'francisca'
    rate = '+0%'
    
    # Verificar se é upload de arquivo
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado.'}), 400
        
        if not is_allowed_file(file.filename):
            return jsonify({
                'error': f'Formato não suportado. Use: {", ".join(get_supported_extensions())}'
            }), 400
        
        # Salvar arquivo temporariamente
        temp_filename = f"{uuid.uuid4()}_{file.filename}"
        temp_filepath = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
        file.save(temp_filepath)
        
        try:
            text = extract_text(temp_filepath)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        finally:
            # Remover arquivo temporário
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
        
        voice_key = request.form.get('voice', 'francisca')
        rate_value = request.form.get('rate', '0')
    
    # Texto direto
    elif request.is_json:
        data = request.get_json()
        text = data.get('text', '').strip()
        voice_key = data.get('voice', 'francisca')
        rate_value = data.get('rate', '0')
    
    # FormData com texto
    elif 'text' in request.form:
        text = request.form.get('text', '').strip()
        voice_key = request.form.get('voice', 'francisca')
        rate_value = request.form.get('rate', '0')
    
    else:
        return jsonify({'error': 'Nenhum texto ou arquivo fornecido.'}), 400
    
    if not text:
        return jsonify({'error': 'O texto está vazio ou não foi possível extrair conteúdo.'}), 400
    
    # Limitar texto a 10000 caracteres
    if len(text) > 10000:
        text = text[:10000]
    
    # Configurar voz
    voice = VOICES.get(voice_key, VOICES['francisca'])
    voice_id = voice['id']
    
    # Configurar velocidade
    try:
        rate_int = int(rate_value)
        rate = f"+{rate_int}%" if rate_int >= 0 else f"{rate_int}%"
    except (ValueError, TypeError):
        rate = '+0%'
    
    # Processar texto para narração
    narration_text = extract_key_points(text)
    
    # Gerar áudio
    audio_filename = f"{uuid.uuid4()}.mp3"
    audio_path = os.path.join(app.config['UPLOAD_FOLDER'], audio_filename)
    
    try:
        asyncio.run(generate_audio_async(narration_text, voice_id, rate, audio_path))
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar áudio: {str(e)}'}), 500
    
    if not os.path.exists(audio_path):
        return jsonify({'error': 'Falha ao gerar o arquivo de áudio.'}), 500
    
    return send_file(
        audio_path,
        mimetype='audio/mpeg',
        as_attachment=False,
        download_name='resumo_audio.mp3'
    )


@app.route('/generate-clone', methods=['POST'])
def generate_audio_clone():
    """
    Gera audio usando clonagem de voz a partir de uma amostra do usuario.
    Recebe:
      - voice_sample: arquivo WAV com a voz do usuario
      - text ou file: conteudo para narrar
    """
    cleanup_old_files()

    # Verificar disponibilidade do TTS
    try:
        from voice_cloner import is_available, generate as clone_generate
        if not is_available():
            return jsonify({
                'error': 'Clonagem de voz indisponivel. Instale com: pip install TTS'
            }), 500
    except ImportError:
        return jsonify({
            'error': 'Modulo de clonagem de voz nao encontrado.'
        }), 500

    # Verificar amostra de voz
    if 'voice_sample' not in request.files:
        return jsonify({'error': 'Nenhuma amostra de voz fornecida.'}), 400

    voice_sample = request.files['voice_sample']
    sample_filename = f"{uuid.uuid4()}_sample.wav"
    sample_path = os.path.join(app.config['UPLOAD_FOLDER'], sample_filename)
    voice_sample.save(sample_path)

    # Extrair texto
    text = None
    if 'file' in request.files:
        file = request.files['file']
        if file.filename and is_allowed_file(file.filename):
            temp_filename = f"{uuid.uuid4()}_{file.filename}"
            temp_filepath = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
            file.save(temp_filepath)
            try:
                text = extract_text(temp_filepath)
            except ValueError as e:
                os.remove(sample_path)
                return jsonify({'error': str(e)}), 400
            finally:
                if os.path.exists(temp_filepath):
                    os.remove(temp_filepath)
    elif 'text' in request.form:
        text = request.form.get('text', '').strip()

    if not text:
        os.remove(sample_path)
        return jsonify({'error': 'Nenhum texto fornecido.'}), 400

    # Limitar texto (XTTS e mais lento, limitar a 3000 chars)
    if len(text) > 3000:
        text = text[:3000]

    # Processar texto para narracao
    narration_text = extract_key_points(text)

    # Gerar audio com clonagem de voz
    audio_filename = f"{uuid.uuid4()}.wav"
    audio_path = os.path.join(app.config['UPLOAD_FOLDER'], audio_filename)

    try:
        clone_generate(narration_text, sample_path, audio_path)
    except Exception as e:
        return jsonify({'error': f'Erro na clonagem de voz: {str(e)}'}), 500
    finally:
        if os.path.exists(sample_path):
            os.remove(sample_path)

    if not os.path.exists(audio_path):
        return jsonify({'error': 'Falha ao gerar o arquivo de audio.'}), 500

    return send_file(
        audio_path,
        mimetype='audio/wav',
        as_attachment=False,
        download_name='resumo_audio_clone.wav'
    )


if __name__ == '__main__':
    print("\n[*] Resumo em Audio - Servidor iniciado!")
    print("[>] Acesse: http://localhost:5000\n")
    app.run(debug=True, port=5000)
