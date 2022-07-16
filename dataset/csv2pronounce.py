from gtts import gTTS

import os
import csv

if not os.path.exists("audio"):
    os.makedirs("audio")
for filename in os.listdir("csv"):
    with open(os.path.join("csv", filename), 'r') as f:
        csvreader = csv.reader(f)
        for row in csvreader: 
            vocab = row[0]
            myobj = gTTS(text=vocab, lang='en', slow=False)
            myobj.save(os.path.join("audio", vocab+".mp3"))