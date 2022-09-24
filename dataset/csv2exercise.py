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
for filename in os.listdir("csv/_togenerate/exo"):
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
   
    newfile = open(os.path.join("exo", title + ".md" ), "w")

    with open(os.path.join("csv/_togenerate/exo", filename), 'r') as f: 
        print("filename " + title)
        csvreader = csv.reader(f)
        vocabs = []
        meanings = []
        img = []
        audio = []
        for row in csvreader:
            vocab = row[0]
            vocabs.append(vocab)
            meanings.append(row[1])
            img.append('![]('+os.path.join("/media/img",title.replace(" ", "&#x20;"),vocab.replace(" ", "&#x20;")+'.svg')+')')
            audio.append('![]('+os.path.join("/media/audio",vocab.replace(" ", "&#x20;")+'.mp3')+')')
       
    
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
    

    def listening(vocab,audio,number):
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
            newfile.write('\n เลือกคำศัพท์ตรงกับเสียง ![]('+ audio_tmp[answer_index]+ ') \n')
            for c in choices_list:
                if c[1]==True:
                    newfile.write(' - [x] ' + c[0] + '\n')
                else:
                    newfile.write(' - [ ] ' + c[0] + '\n') 
            vocabs_tmp.pop(answer_index)
            audio_tmp.pop(answer_index)

    shutil.move(os.path.join("csv/_togenerate/exo",filename),"csv/_togenerate/OK")
    


    if category != "":
        newfile.write('\n\n# ![icon](/media/icons/quiz.svg) \n\n')
        if category == "2vocab":
            questionGenerator(vocabs,meanings,3)
            questionGenerator(meanings,vocabs,2)
            listening(vocabs,audio,3)
   
    newfile.close()
    f.close()