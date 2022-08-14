#!/bin/python3
"""
Generate multiple lesson from a csv
"""
import os
import csv
import random
import shutil

if not os.path.exists("vocab"):
    os.makedirs("vocab")
for filename in os.listdir("csv/togenerate/vocab"):
    print(filename)
    category = os.path.splitext(filename)[0]
    newfile = open(os.path.join("vocab",os.path.splitext(filename)[0]+".md"), "w")
    newfile.write('''---
title: '''+ category +
'''
description: 
icon: /media/icons/''' + os.path.splitext(filename)[0].replace(" ", "") + '''.svg\

tags: {easy, category:vocab}
---

'''
    )
    newfile.write('<div class="carrousel">\n\n')
    with open(os.path.join("csv/togenerate/vocab", filename), 'r') as f: 
        print("filename " + filename)
        csvreader = csv.reader(f)
        vocabs = []
        meanings = []
        img = []
        audio = []
        for row in csvreader:
            vocab = row[0].replace(" ", "&#x20;")
            vocabs.append(vocab)
            meanings.append(row[1])
            img.append('![]('+os.path.join("/media/img",category,vocab+'.svg')+')')
            audio.append('![]('+os.path.join("/media/audio",vocab+'.mp3')+')')
        newfile.write('\n|' + '|'.join(img) + '|\n|')
        for i in range(len(img)):
            newfile.write(" :----: |")
        newfile.write('\n|' + '|'.join(vocabs) + '|')
        newfile.write('\n|' + '|'.join(meanings) + '|')
        newfile.write('\n|' + '|'.join(audio) + '|\n\n')
    newfile.write('</div>\n\n')
    newfile.write('\n\n# แบบฝึกหัด\n\n')
    
    def questionGenerator(questions,choices,number):
        questions_tmp = questions.copy()
        choicess_tmp = choices.copy()
        for r in range(number):
            choices_tmp = choicess_tmp.copy()
            answer_index = random.choice(range(len(questions_tmp)))
            choices_list = [(choices_tmp[answer_index],True)]
            choices_tmp.pop(answer_index)
            for r in range(3):
                choice_index = random.choice(range(len(choices_tmp)))
                choices_list.append((choices_tmp[choice_index],False))
                choices_tmp.pop(choice_index)

            choices_list.sort()
            newfile.write('\n เลือกคำศัพท์/ความหมายที่ตรงกับ **' + questions_tmp[answer_index] + '**\n')
            for c in choices_list:
                if c[1]==True:
                    newfile.write(' - [x] ' + c[0] + '\n')
                else:
                    newfile.write(' - [ ] ' + c[0] + '\n')
            questions_tmp.pop(answer_index)
            choicess_tmp.pop(answer_index)
    shutil.move(os.path.join("csv/togenerate/vocab",filename),"csv/togenerate/audio")

    
    questionGenerator(vocabs,meanings,2)
    questionGenerator(meanings,vocabs,2)
    newfile.close()
    f.close()