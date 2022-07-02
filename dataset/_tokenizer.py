from pythainlp.tokenize import word_tokenize
import sys
import re

clean = re.sub(r'[^ก-๙]', "", sys.argv[1].strip())
tokenized = word_tokenize(clean, engine="newmm")
print(tokenized, " ", ' '.join(tokenized))