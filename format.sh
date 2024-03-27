#!/bin/bash
(cd data && black --line-length 120 .)
(cd site && npm run fix)
