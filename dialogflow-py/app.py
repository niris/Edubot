#!/bin/env python
import flask
import os
from flask import request, make_response,jsonify
from google.cloud import dialogflow
from google.api_core.exceptions import InvalidArgument
from google.auth.exceptions import DefaultCredentialsError

app = flask.Flask(__name__)

@app.route('/')
def main():
    try:
        session_client = dialogflow.SessionsClient()
        session = session_client.session_path('anglizbot-tefx', 'test')
        text_input = dialogflow.TextInput(text=request.args.get("text"), language_code=request.args.get("language_code", 'en'))
        query_input = dialogflow.QueryInput(text=text_input)
        response = session_client.detect_intent(session=session, query_input=query_input)
    except InvalidArgument:
        return make_response(jsonify({"reason" : "Invalid Argument"}), 500)
    except DefaultCredentialsError:
        return make_response(jsonify({"reason" : "Dialogflow Credentials Error"}), 500)
    return make_response(jsonify({"intent" : response.query_result.intent.display_name, "response":response.query_result.fulfillment_text}))
