import flask
import os
from flask import request, make_response,jsonify
from google.cloud import dialogflow
from google.api_core.exceptions import InvalidArgument

app = flask.Flask(__name__)
app.config['JSON_AS_ASCII'] = False # get unicode directly

@app.route('/')
def main():
    session_client = dialogflow.SessionsClient()
    session = session_client.session_path('anglizbot-tefx', 'test')
    text_input = dialogflow.TextInput(text=request.args.get("text"), language_code=request.args.get("language_code", 'en'))
    query_input = dialogflow.QueryInput(text=text_input)
    try:
        response = session_client.detect_intent(session=session, query_input=query_input)
    except InvalidArgument:
        raise
    return make_response(jsonify({"intent" : response.query_result.intent.display_name, "response":response.query_result.fulfillment_text}))

if __name__ == "__main__":
    app.run(port=int(os.environ.get('PORT', 8765)), host='0.0.0.0')
