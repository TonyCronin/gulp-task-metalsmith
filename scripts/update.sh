#!/bin/bash

set -e

ncu -a
git add package.json
git commit -m "Update packages"
npm version patch