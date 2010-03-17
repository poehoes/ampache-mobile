#-----------------------------------------------------
#   JavaScript Minimizer for Mojo : Python 3.1
#       
#   Author: dburman 
#   
#   ex: python webOS_optimize.py src
#       results placed in ./optimized folder
#-----------------------------------------------------
import glob, os, sys, shutil, fnmatch, subprocess

SVN_CMD = r"C:\Program Files (x86)\CollabNet\Subversion Client\svn.exe"
PYTHON_PATH = r"C:\Python31\python.exe"


directory = sys.path[0]

print ("Processing Folder:", directory)

try:
	shutil.rmtree(directory + '\\temp')
	print ("Temp Deleted")
except:
	print ("Temp Deleted")

try:
	shutil.rmtree(directory + '\\auto_build')
	print ("auto_build Deleted")
except:
	print ("auto_build Deleted")


source = directory + "\src"
dest =  directory + "\\temp"

subprocess.call ([SVN_CMD, "export", source, dest, "--force"])
os.system(PYTHON_PATH + " \"" + directory + "\webOS_optimize.py\" temp")

os.system("palm-launch -c com.ampachemobile")
os.system("palm-package -o auto_build temp")
os.system("palm-package temp")
os.system("palm-install auto_build/*.ipk")
os.system("palm-launch com.ampachemobile")


try:
	shutil.rmtree(directory + '\\temp')
	print ("Temp Deleted")
except:
	print ("Temp Deleted")
	
try:
	shutil.rmtree(directory + '\\auto_build')
	print ("auto_build Deleted")
except:
	print ("auto_build Deleted")
