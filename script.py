import sys
import json

firstParam = sys.argv[1]
secondParam = sys.argv[2]

# a Python object (dict):
x = {
  "name": firstParam,
  "age": 30,
  "city": secondParam
}

z = {
  "name": firstParam,
  "age": 10,
  "city": secondParam
}

# convert into JSON:
y = json.dumps(x)
t = json.dumps(z)

# the result is a JSON string:
print(y)
print(t)


