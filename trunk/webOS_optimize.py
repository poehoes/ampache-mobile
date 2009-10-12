#-----------------------------------------------------
#   JavaScript Minimizer for Mojo : Python 3.1
#       
#   Author: dburman 
#   
#   ex: python webOS_optimize.py src
#       results placed in ./optimized folder
#-----------------------------------------------------
import glob, os, sys, shutil, fnmatch

if len(sys.argv) > 1:
    directory = sys.argv[1] + '/'
else:
    directory = './'

rootdir = './'+'optimized/'
# Copy (Replace) directory to optimized folder, might not replace if directory is RO
if os.path.exists(rootdir):
    shutil.rmtree(rootdir)
shutil.copytree(directory,rootdir,False)

# Find all JS and HTML files and put the respective paths into lists 
JAVASCRIPTS = []
HTML = []
for root, subFolders, files in os.walk(rootdir):
    for file in files:
        if fnmatch.fnmatch(file, '*.js'):
            JAVASCRIPTS.append(os.path.join(root,file))
        if fnmatch.fnmatch(file, '*.html'):
            HTML.append(os.path.join(root,file))

#----------------------------------------------------------------------
#  JS FILE Process List
#----------------------------------------------------------------------
i = 0
for i in range(len(JAVASCRIPTS)):
    print ("processing JS:", JAVASCRIPTS[i])
    fin = open(JAVASCRIPTS[i], 'r')
    finString= fin.read()
    fin.close()
    fout = open(JAVASCRIPTS[i], 'w')
    j = 0
    commentRemove = True
    while commentRemove == True:
       
        #find and remove comments of the form /* */ 
        if (j + 1) < len(finString) and finString[j] == '/' and finString[j+1] == '*':
            j=j+2;
            gotoCommentEnd= True 
            while gotoCommentEnd == True:
                if j >= len(finString):
                    gotoCommentEnd = False
                    commentRemove = False 
                else:  
                    if finString[j] == '*' and (j+1) < len(finString) and finString[j+1] == '/':
                        gotoCommentEnd = False
                        j=j+1
                        #finString[j+1] = ' '
                    j=j+1

        #find and remove comments of the form // 
        if (j + 1) < len(finString) and finString[j] == '/' and finString[j+1] == '/' and (((j > 0) and finString[j-1] != ':') or j==0):
            j=j+2;
            gotoCommentEnd= True 
            while gotoCommentEnd == True:
                if j >= len(finString):
                    gotoCommentEnd = False
                    commentRemove = False 
                else:  
                    if finString[j] == '\n' or finString[j] == '\r':
                        gotoCommentEnd = False
                        #finString[j+1] = ' '
                    else:
                        j=j+1

        # find and remove Mojo.Log....) messages
        if (j + 8) < len(finString) and finString[j] == 'M' and finString[j+1] == 'o'  and finString[j+2] == 'j' and finString[j+3] == 'o' and finString[j+4] == '.' and finString[j+5] == 'L' and finString[j+6] == 'o' and finString[j+7] == 'g':
            j=j+8;
            gotoCommentEnd= True 
            while gotoCommentEnd == True:
                if j >= len(finString):
                    gotoCommentEnd = False
                    commentRemove = False 
                else:  
                    if finString[j] == ')':
                        if (((j + 1) < len(finString)) and (finString[j+1] == ';')):
                            j=j+1
                        gotoCommentEnd = False
                    #else:
                    j=j+1

        #find and remove double spaces etc
        if (j + 1)< len(finString) and (finString[j] == ' ' or finString[j] == '\t' or finString[j] == '\n' or finString[j] == '\r'): 
            j=j+1;
            gotoCommentEnd= True 
            while gotoCommentEnd == True:
                if j >= len(finString):
                    gotoCommentEnd = False
                    commentRemove = False 
                else:  
                    if finString[j] != ' ' and finString[j] != '\t' and finString[j] != '\n' and finString[j] != '\r':
                        gotoCommentEnd = False
                        j=j-1;
                    else:
                        j=j+1


        # TODO remove spaces around :,=,*,+,-,{,},;,',',/,(,) that are not inside " "


        if j >= len(finString):
            commentRemove = False
        else:
            if finString[j] != '\n' and finString[j] != '\r' and finString != '\t':
            #if finString != '\t':
                fout.write(finString[j])
            else:
                fout.write(' ')
            #print(j)
            j=j+1
    fout.close()

#----------------------------------------------------------------------
#  HTML FILE Process List
#----------------------------------------------------------------------
i = 0
for i in range(len(HTML)):
    print ("processing HTML:", HTML[i])
    fin = open(HTML[i], 'r')
    finString= fin.read()
    fin.close()
    fout = open(HTML[i], 'w')
    j = 0
    spacesRemove = True
    while spacesRemove == True:
        #only write things between < > 
        if ((j+1)<len(finString) and finString[j] == '<'): 
            gotoTagEnd= True 
            while gotoTagEnd == True:
                #TODO remove <!-- --> comments
                # write everything between tabs except these
                if finString[j] != '\n' and finString[j] != '\r' and finString != '\t':
                    fout.write(finString[j])
                j=j+1;
                if j >= len(finString):
                    gotoTagEnd = False
                    spacesRemove = False 
                else:  
                    if finString[j] == '>': 
                        gotoTagEnd = False
                        #fout.write(finString[j])
                        #j=j+1

        # remove multiple whitespaces from untagged data
        if (j + 1)<len(finString) and (finString[j] == ' ' or finString[j] == '\t' or finString[j] == '\n' or finString[j] == '\r'): 
            j=j+1;
            gotoTagEnd= True 
            while gotoTagEnd == True:
                if j >= len(finString):
                    gotoTagEnd = False
                    spacesRemove = False 
                else:  
                    if finString[j] != ' ' and finString[j] != '\t' and finString[j] != '\n' and finString[j] != '\r':
                        gotoTagEnd = False
                        j=j-1;
                    else:
                        j=j+1

        if j >= len(finString):
            spacesRemove = False
        else:
            if finString[j] != '\n' and finString[j] != '\r' and finString != '\t':
            #if finString != '\t':
                fout.write(finString[j])
            #else:
            #    fout.write(' ')
            j=j+1
    fout.close()
