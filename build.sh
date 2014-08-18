#!/bin/sh

rm -Rf telxcc
git clone git@github.com:kanongil/telxcc.git -b output-webvtt-apple || exit 1
make -C telxcc
