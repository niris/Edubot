#!/bin/python3
"""
Generate multiple lesson from a csv
"""
import os
import csv
import random

if not os.path.exists("vocab"):
    os.makedirs("vocab")
for filename in os.listdir("csv"):
    category = os.path.splitext(filename)[0]
    newfile = open(os.path.join("vocab",os.path.splitext(filename)[0]+".md"), "w")
    newfile.write('''---
    title: '''+ category +
    '''
    description: 
    icon: /media/icons/''' + os.path.splitext(filename)[0] + '''.svg
tags: {easy,vocab}
---

'''
    )
    newfile.write('<div class="carrousel">\n\n')
    with open(os.path.join("csv", filename), 'r') as f: 
        print("filename " + filename)
        csvreader = csv.reader(f)
        vocab = []
        meaning = []
        img = []
        audio = []
        for row in csvreader:
            vocab.append(row[0])
            meaning.append(row[1])
            img.append('![]('+os.path.join("/media/img",category,row[0]+'.svg')+')')
            audio.append('![]('+os.path.join("/media/audio",row[0]+'.mp3')+')')
        newfile.write('|' + '|'.join(img) + '|\n|')
        for i in range(len(img)):
            newfile.write("-------------------------------|")
        newfile.write('\n|' + '|'.join(audio) + '|\n\n')
    newfile.write('</div>\n\n')
    newfile.write('\n\n# แบบฝึกหัด\n\n')
    
    def questionGenerator(questions,choices,number):
        questions_tmp = questions.copy()
        for r in range(number):
            choices_tmp = choices.copy()
            answer_index = random.choice(range(len(questions_tmp)))
            choices_list = [(choices[answer_index],True)]
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
    
    questionGenerator(vocab,meaning,2)
    questionGenerator(meaning,vocab,2)
    newfile.close()
    f.close()