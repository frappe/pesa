#! /usr/bin/env zsh

rm ./profiler-output.log 2> /dev/null
echo "starting profile"
# Will take around a minute
node --require ts-node/register --prof ./tests/profile/profile.ts
node --prof-process --preprocess -j ./isolate-*-v8.log > ./profiler-output.json 1> /dev/null 2> /dev/null
# Feed JSON here: https://v8.dev/tools/head/profview
rm ./isolate-*-v8.log
echo "profiler-output.log generated"