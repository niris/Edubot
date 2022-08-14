#!/bin/python3
"""
Generate multiple lesson from a csv
"""
import os
from pythainlp.translate import Translate
import shutil


if not os.path.exists("csv/togenerate/vocab"):
    os.makedirs("csv/togenerate/vocab")
for folder in os.listdir("../media/img/togenerate"):
    newfile = open(os.path.join("csv/togenerate/vocab",os.path.splitext(folder)[0]+".csv"), "w")
    for file in os.listdir(os.path.join("../media/img/togenerate",folder)):
        vocab = os.path.splitext(file)[0]
        eng2th = Translate('en', 'th')
        newfile.write(vocab+","+eng2th.translate(vocab)+"\n")    
    newfile.close()
    shutil.move(os.path.join("../media/img/togenerate",folder),"../media/img")
