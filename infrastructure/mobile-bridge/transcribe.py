import speech_recognition as sr
import sys
import os
import subprocess

def transcribe(audio_path, ffmpeg_path):
    # Definir o caminho de saída (WAV)
    wav_path = audio_path.replace(".oga", ".wav").replace(".ogg", ".wav")
    
    try:
        # CONVERSÃO DIRETA VIA FFMPEG (ignorando pydub)
        # Comando: ffmpeg -i input.oga output.wav -y
        print(f"Debug: Convertendo {audio_path} usando {ffmpeg_path}")
        
        cmd = [ffmpeg_path, "-i", audio_path, wav_path, "-y", "-loglevel", "error"]
        subprocess.run(cmd, check=True, capture_output=True)
        
        if not os.path.exists(wav_path):
            return "Erro: Falha na criação do arquivo WAV."

        # RECONHECIMENTO
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language="pt-BR")
            return text
            
    except subprocess.CalledProcessError as e:
        return f"Erro no FFmpeg: {e.stderr.decode()}"
    except Exception as e:
        return f"Erro na transcrição: {str(e)}"
    finally:
        # Cleanup
        if os.path.exists(wav_path):
            try: os.remove(wav_path)
            except: pass

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python transcribe.py <audio_path> <ffmpeg_path>")
        sys.exit(1)
        
    input_file = sys.argv[1]
    ffmpeg_exe = sys.argv[2]
    
    # Normalizar caminhos para Windows
    input_file = os.path.abspath(input_file)
    ffmpeg_exe = os.path.abspath(ffmpeg_exe)
    
    result = transcribe(input_file, ffmpeg_exe)
    print(result)
