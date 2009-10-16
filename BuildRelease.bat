
svn export src temp --force
webOS_optimize.py temp
palm-package temp
del /q/s temp
