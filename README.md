# AnglizBot

Mobile-first Chatbot-powered vocabulary learning Website

## Features

- Chatbot with English prompt
- English lesson with exam and rewards
- Unlockable lessons using given rewards

## Setup

Start the project with
```sh
docker-compose up -d
```
Then follow http://localhost for instructions

## Architecture

```mermaid
graph LR
user[fa:fa-user User]
httpd[fa:fa-database NGINX]
api[fa:fa-database PostgREST]
db[fa:fa-database Postgres]
vosk[fa:fa-microphone VOSK]
bot[fa:fa-robot dialogflow]
user --> |HTTP/S| httpd
httpd --> |REST| api --> |SQL| db
httpd --> |Voice| vosk
httpd --> |Prompt| bot
```
