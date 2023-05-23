#!/bin/bash
(cd data && black .)
(cd site && npm run fix)
