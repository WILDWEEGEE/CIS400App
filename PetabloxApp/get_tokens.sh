#!/bin/bash

JWT=$(ruby ruby/generate_jwt.rb)

curl -i -H "Authorization: Bearer $JWT" -H "Accept: application/vnd.github.machine-man-preview+json" https://api.github.com/app

JSON=$(curl -i -X POST \
-H "Authorization: Bearer $JWT" \
-H "Accept: application/vnd.github.machine-man-preview+json" \
https://api.github.com/app/installations/443308/access_tokens)

INSTALLATION_TOKEN=$()