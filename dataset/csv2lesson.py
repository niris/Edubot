#!/bin/python3
"""
Generate multiple lesson from a csv
"""
import os
import csv
import random
import shutil
import sys
import re


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
    group = "[group:" + sys.argv[1] +"]" if len(sys.argv) >1 else ""
    if category != "" :
        newfile = open(os.path.join("../media/md","[category:"+ category+ "]"+ group + title +" [icon:" +os.path.splitext(title)[0].replace(" ", "")+"][level:"+level+"].md" ), "w")
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
        index = []
        idx = 0
        for row in csvreader:
            idx =+ 1
            index.append(idx)
            vocab = row[0]
            vocabs.append(vocab)
            meanings.append(row[1])
            fullstop = "?" if re.search('^When|^What|^How|^Who|^Do|^Does|^Is|^Am|^Are',vocab) else "."
            vocabs_meanings.append("**"+vocab+ (fullstop if category=="3conversation" else "")+"**<br>"+row[1])
            img.append('![]('+os.path.join("/media/img",title.replace(" ", "&#x20;") + '__'+ vocab.replace(" ", "&#x20;")+'.svg')+')')
            audio.append('![]('+os.path.join("/media/audio",vocab.replace(" ", "&#x20;")+'.mp3')+')')
        
        slide_nbs = list(map(lambda n: str(n) +"/"+ str(len(index)),list(range(1,len(index)+1))))
        newfile.write('\n|' + '|'.join(slide_nbs) + '|\n|')
        for i in range(len(img)):
            newfile.write(" :----: |")
        newfile.write('\n|' + '|'.join(img) + '|')
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
            newfile.write('\n เลือกคำศัพท์ที่ตรงกับ **' + questions_tmp[answer_index].capitalize() + '**\n')
            for c in choices_list:
                if c[1]==True:
                    newfile.write(' - [x] ' + c[0].capitalize() + '\n')
                else:
                    newfile.write(' - [ ] ' + c[0].capitalize() + '\n')
            questions_tmp.pop(answer_index)
            choicess_tmp.pop(answer_index)
    
    def listening(vocab,audio,number,inverse):
        vocabs_tmp = vocab.copy()
        audio_tmp = audio.copy()
        for r in range(number):
            choices_tmp = vocabs_tmp.copy()
            answer_index = random.choice(range(len(audio_tmp)))
            choices_list = [(choices_tmp[answer_index],True)]
            choices_tmp.pop(answer_index)
            
            for r in range(2):
                choice_index = random.choice(range(len(choices_tmp)))
                choices_list.append((choices_tmp[choice_index],False))
                choices_tmp.pop(choice_index)

            choices_list.sort()                
            desc = "เลือกคำศัพท์ตรงกับเสียง" if inverse == False else "เลือกเสียงที่ตรงกับคำศัพท์"
            newfile.write('\n' + desc + ' '+ (audio_tmp[answer_index] if inverse == False else audio_tmp[answer_index].capitalize()) + ' \n')
            for c in choices_list:
                if c[1]==True:
                    newfile.write(' - [x] ' + (c[0].capitalize() if inverse == False else c[0]) + '\n')
                else:
                    newfile.write(' - [ ] ' + (c[0].capitalize() if inverse == False else c[0]) + '\n') 
            newfile.write('\n')
            vocabs_tmp.pop(answer_index)
            audio_tmp.pop(answer_index)
    
    def pronunc(vocab,number):
        vocab_tmp = vocab.copy()
        for r in range(number):
            answer_index = random.choice(range(len(vocab_tmp)))
            newfile.write("ออกเสียงคำว่า **"+ vocab_tmp[answer_index].capitalize() + "** :\n\n")
            newfile.write("🎙️ "+ vocab_tmp[answer_index].lower() +"\n\n")
            vocab_tmp.pop(answer_index)


    shutil.move(os.path.join("csv/_togenerate/vocab",filename),"csv/_togenerate/audio")

    if category != "":
        newfile.write('\n\n# ![icon](/media/icons/quiz.svg) \n\n')
        if category == "2vocab":
            questionGenerator(vocabs,meanings,2)
            questionGenerator(meanings,vocabs,2)
            listening(vocabs,audio,2,False)
        if category == "1phonics":
            listening(vocabs,audio,4, False)
            pronunc(vocabs,2)
        if category == "3conversation":
            listening(vocabs,audio,3, False)
            pronunc(vocabs,3)

    newfile.close()
    f.close()