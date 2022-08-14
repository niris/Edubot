import shutil
from gtts import gTTS

import os
import csv

if not os.path.exists("../media/audio"):
    os.makedirs("../media/audio")
for filename in os.listdir("csv/togenerate/audio"):
    with open(os.path.join("csv/togenerate/audio", filename), 'r') as f:
        csvreader = csv.reader(f)
        for row in csvreader: 
            vocab = row[0]
            myobj = gTTS(text=vocab, lang='en', slow=False)
            myobj.save(os.path.join("../media/audio", vocab+".mp3"))
    shutil.move(os.path.join("csv/togenerate/audio",filename),"csv")
