#!/bin/python3
"""
Generate multiple lesson from a csv
"""
import os
import csv

for filename in os.listdir("vocab"):
    newfile = open(os.path.join("vocab",os.path.splitext(filename)[0]+".md"), "w")
    newfile.write('''---
title: '''+ os.path.splitext(filename)[0] +'''
description: 
tags: {easy,vocab}
---
''')
    newfile.write('<section class="carousel" aria-label="Gallery">\n<ol class="carousel__viewport">')
    with open(os.path.join("vocab", filename), 'r') as f: 
        csvreader = csv.reader(f)
        for row in csvreader:
            newfile.write('''<li id="carousel__slide1" tabindex="0" class="carousel__slide">
        <div class="carousel__snapper">
        <img src="''' + row[2] + '''">  
        Bowl
        <audio controls>
        <source src="''' + row[3] + '''" type="audio/mpeg">
        </audio>
        <a href="#carousel__slide4"
           class="carousel__prev">Go to last slide</a>
        <a href="#carousel__slide2"
           class="carousel__next">Go to next slide</a>
      </div>
    </li>''')
    newfile.write('</ol></section>')
    newfile.close()
    f.close()