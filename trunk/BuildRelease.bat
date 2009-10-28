
svn export src temp --force
python webOS_optimize.py temp
palm-package temp
del /q/s temp
