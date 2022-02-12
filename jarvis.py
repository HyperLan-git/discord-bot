import speech_recognition as sr
import sys
import base64

r = sr.Recognizer()

audio = sr.AudioFile(sys.argv[1])

with audio as source:
    stream = r.record(source)

result = r.recognize_google(stream, language="fr_FR");
sys.stdout.buffer.write(bytes(result, "utf-8"))
f = open(sys.argv[2], "w")
f.write(result)
f.close()
