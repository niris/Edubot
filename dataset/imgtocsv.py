#!/bin/python3
"""
Generate multiple lesson from a csv
"""
import os
import csv
import random
from pythainlp.translate import Translate

if not os.path.exists("csv"):
    os.makedirs("csv")
for folder in os.listdir("../media/img"):
    newfile = open(os.path.join("csv",os.path.splitext(folder)[0]+".csv"), "w")
    for file in os.listdir(os.path.join("../media/img",folder)):
        vocab = os.path.splitext(file)[0]
        eng2th = Translate('en', 'th')
        newfile.write(vocab+","+eng2th.translate(vocab)+"\n")    
    newfile.close()
