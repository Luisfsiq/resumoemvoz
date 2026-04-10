"""
Modulo de clonagem de voz usando Coqui TTS XTTS-v2.
Carregamento lazy para nao impactar a inicializacao do app quando nao usado.
"""

import os
import logging

logger = logging.getLogger(__name__)

_tts_model = None


def is_available() -> bool:
    """Verifica se a biblioteca Coqui TTS esta instalada."""
    try:
        from TTS.api import TTS
        return True
    except ImportError:
        return False


def _get_model():
    """Carrega o modelo XTTS-v2 de forma lazy (somente na primeira chamada)."""
    global _tts_model
    if _tts_model is None:
        from TTS.api import TTS
        logger.info("Carregando modelo XTTS-v2... (primeira execucao pode demorar)")
        _tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
        logger.info("Modelo XTTS-v2 carregado com sucesso!")
    return _tts_model


def generate(text: str, speaker_wav: str, output_path: str, language: str = "pt"):
    """
    Gera fala com clonagem de voz.

    Args:
        text: Texto para sintetizar
        speaker_wav: Caminho para o arquivo WAV com a amostra da voz do usuario
        output_path: Caminho para salvar o audio gerado
        language: Codigo do idioma (padrao: "pt" para portugues)
    """
    tts = _get_model()
    tts.tts_to_file(
        text=text,
        speaker_wav=speaker_wav,
        language=language,
        file_path=output_path,
    )
