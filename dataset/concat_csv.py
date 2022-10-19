#!/bin/python3
"""
Generate multiple lesson from a csv
"""
import os
import csv
import random
import shutil

if not os.path.exists("exo"):
    os.makedirs("exo")

newfile = open(os.path.join("csv","_togenerate","exo","all.csv" ), "w")
for filename in os.listdir("csv/_togenerate/audio"):
    print(filename)
    fullname = os.path.splitext(filename)[0]
    filename_splited = fullname.split("_")
    level = filename_splited[0]
    title = filename_splited[1]
    category = "2" if len(filename_splited) <= 2 else filename_splited[2]
   
    with open(os.path.join("csv/_togenerate/audio", filename), 'r') as f: 
        csvreader = csv.reader(f)
        for row in csvreader:
            newfile.write(level + ";" + category + ";" + title+";" + row[0]+";"+row[1]+"\n")
    f.close()      
   
newfile.close()
    