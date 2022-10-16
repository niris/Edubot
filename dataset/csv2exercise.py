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

def generate_exo(level):
    exo = open(os.path.join("..","media","md","[category:8test][mode:exam]Level "+level+"[icon:test][level:"+level+"].md" ), "w")
    exo.write("## Exercise Level " + level + "\n")
    with open("csv/_togenerate/exo/all.csv", 'r') as f:
        csvreader = csv.reader(f)
        filtered = list(filter(lambda p: level == p[0], csvreader))

        phonics_filtered = filter(lambda q: "1" == q[1], filtered)
        phonics = []
        phonics_audio = []
        for row in phonics_filtered:
            phonics.append(row[3])
            phonics_audio.append('![]('+os.path.join("/media/audio",row[3].replace(" ", "&#x20;")+'.mp3')+')')
        print(len(phonics)," ", len(phonics_audio))
        listening(phonics,phonics_audio,3,False,exo)


        vocabs_filtered = filter(lambda p: "2" == p[1], filtered)
        vocabs = []
        meanings = []
        vocab_audio =[]
        for row in vocabs_filtered:
            vocabs.append(row[3])
            meanings.append(row[4])
            vocab_audio.append('![]('+os.path.join("/media/audio",row[3].replace(" ", "&#x20;")+'.mp3')+')')
        questionGenerator(vocabs,meanings,4,exo)
        questionGenerator(meanings,vocabs,4,exo)
        listening(vocabs,vocab_audio,4,False,exo)
        
        conversation_filtered = filter(lambda q: "3" == q[1], filtered)
        conversations = []
        conver_audio = []
        for row in conversation_filtered:
            conversations.append(row[3])
            conver_audio.append('![]('+os.path.join("/media/audio",row[3].replace(" ", "&#x20;")+'.mp3')+')')
        listening(conversations,conver_audio,3,False,exo)
        pronunc(conversations,2,exo)
    exo.close()

def generate_listening(level):
    exo = open(os.path.join("..","media","md","[category:7listening]Level "+level+"[icon:listening][level:"+level+"].md" ), "w")
    exo.write("## Listening Exercise Level " + level + "\n")
    with open("csv/_togenerate/exo/all.csv", 'r') as f:
        csvreader = csv.reader(f)
        filtered = list(filter(lambda p: level == p[0], csvreader))

        vocabs_filtered = filter(lambda q: "2" == q[1] or "3" == q[1] , filtered)
        vocabs = []
        vocabs_audio = []
        for row in vocabs_filtered:
            vocabs.append(row[3])
            vocabs_audio.append('![]('+os.path.join("/media/audio",row[3].replace(" ", "&#x20;")+'.mp3')+')')
        listening(vocabs,vocabs_audio,6,False,exo)
    exo.close()

def questionGenerator(questions,choices,number,file):
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
        file.write('\n เลือกคำศัพท์ที่ตรงกับ  **' + questions_tmp[answer_index].capitalize() + '**\n')
        for c in choices_list:
            file.write(' - (' + ('x' if c[1] else ' ') + ') ' + c[0].capitalize() + '\n')
        questions_tmp.pop(answer_index)
        choicess_tmp.pop(answer_index)

def listening(vocab,audio,number,inverse,file):
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
        desc = "เลือกคำศัพท์ตรงกับเสียง " if inverse == False else "เลือกเสียงที่ตรงกับคำศัพท์ "
        file.write('\n' + desc + ' '+ (audio_tmp[answer_index] if inverse == False else audio_tmp[answer_index].capitalize()) + ' \n')
        for c in choices_list:
            file.write(' - (' + ('x' if c[1] else ' ') + ') ' + (c[0].capitalize() if inverse == False else c[0]) + '\n')
        file.write('\n')
        vocabs_tmp.pop(answer_index)
        audio_tmp.pop(answer_index)

def pronunc(vocab,number,file):
    vocab_tmp = vocab.copy()
    for r in range(number):
        answer_index = random.choice(range(len(vocab_tmp)))
        file.write("ออกเสียงคำว่า  **"+ vocab_tmp[answer_index].capitalize() + "** :\n\n")
        file.write("🎙️ "+ vocab_tmp[answer_index].lower() +"\n\n")
        vocab_tmp.pop(answer_index)
for i in range(13):
    generate_exo(str(i))
    generate_listening(str(i))