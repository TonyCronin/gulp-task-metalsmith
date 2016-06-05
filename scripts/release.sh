#!/bin/bash

set -e

# Set variables.
ORIGIN_URL=`git config --get remote.origin.url`

# Publish to NPM.
echo "Publishing release to NPM..."

if [[ -n "$NPM_AUTH" ]]; then
  echo "//registry.npmjs.org/:_authToken=$NPM_AUTH" >> ~/.npmrc
  npm publish
  echo "Done"
else
  echo "Operation failed because NPM_AUTH was not set"
fi

exit 0
