#-----------------------------------------------------
#   Package Release
#       
#   Author: bgeiser
#-----------------------------------------------------
import shutil, subprocess



command = "svn export src temp --force"
process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE)
process.wait()
#print process.returncode

optimizecmd = "webOS_optimize.py temp"
optimize = subprocess.Popen(optimizecmd, shell=True, stdout=subprocess.PIPE)
optimize.wait()
#print optimize.returncode

package_cmd = "palm-package temp"
package = subprocess.Popen(package_cmd, shell=True, stdout=subprocess.PIPE)
package.wait()

shutil.rmtree('./temp')
#shutil.rmtree('./optimized')
