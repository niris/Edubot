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
for filename in os.listdir("csv/_togenerate/vocab"):
    print(filename)
    fullname = os.path.splitext(filename)[0]
    filename_splited = fullname.split("_")
    level = filename_splited[0]
    title = filename_splited[1]
    category = "2vocab"
    if len(filename_splited) > 2:
        print(filename_splited[2])
        match filename_splited[2]:
            case "0":
                category = ""
            case "1":
                category = "1phonics"
            case "2":
                category = "2vocab"
            case "3":
                category = "3conversation"
            case default:
                category = "2vocab"
    print("category ", category)
    os.path.splitext(title)[0].replace(" ", "")+".md"
    if category != "" :
        newfile = open(os.path.join("../media/md","[category:"+ category+ "]" + title +" [icon:" +os.path.splitext(title)[0].replace(" ", "")+"][level:"+level+"].md" ), "w")
    else :
        newfile = open(os.path.join("autogen", title + ".md" ), "w")
    newfile.write('<div class="carrousel">\n\n')
    with open(os.path.join("csv/_togenerate/vocab", filename), 'r') as f: 
        print("filename " + title)
        csvreader = csv.reader(f)
        vocabs = []
        meanings = []
        vocabs_meanings = []
        img = []
        audio = []
        for row in csvreader:
            vocab = row[0]
            vocabs.append(vocab)
            meanings.append(row[1])
            vocabs_meanings.append("**"+vocab+"**<br>"+row[1])
            img.append('![]('+os.path.join("/media/img",title.replace(" ", "&#x20;"),vocab.replace(" ", "&#x20;")+'.svg')+')')
            audio.append('![]('+os.path.join("/media/audio",vocab.replace(" ", "&#x20;")+'.mp3')+')')
        newfile.write('\n|' + '|'.join(img) + '|\n|')
        for i in range(len(img)):
            newfile.write(" :----: |")
        if category != "1phonics":
            newfile.write('\n|' + '|'.join(vocabs_meanings) + '|')
        newfile.write('\n|' + '|'.join(audio) + '|\n\n')
    newfile.write('</div>\n\n')
    
    def questionGenerator(questions,choices,number):
        questions_tmp = questions.copy()
        choicess_tmp = choices.copy()
        for r in range(number):
            choices_tmp = choicess_tmp.copy()
            answer_index = random.choice(range(len(questions_tmp)))
            choices_list = [(choices_tmp[answer_index],True)]
            choices_tmp.pop(answer_index)
            for r in range(2):
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
    shutil.move(os.path.join("csv/_togenerate/vocab",filename),"csv/_togenerate/audio")

    if category != "":
        newfile.write('\n\n# ![icon](/media/icons/quiz.svg) \n\n')
        if category == "2vocab":
            questionGenerator(vocabs,meanings,2)
            questionGenerator(meanings,vocabs,2)
    newfile.close()
    f.close()