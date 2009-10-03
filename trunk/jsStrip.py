#-----------------------------------------------------
#   JavaScript Minimizer for Mojo : Python 3.1
#       
#   dburman 
#   
#
#-----------------------------------------------------

import glob, os, sys


if len(sys.argv) > 1:
    directory = sys.argv[1] + '/'
else:
    directory = './'

directoryopt = directory + 'optimized/'

if not os.path.exists(directoryopt):
    os.makedirs(directoryopt)

JAVASCRIPTS= glob.glob(directory + '*.js')

i = 0
for i in range(len(JAVASCRIPTS)):
    print ("processing:", JAVASCRIPTS[i])
    fin = open(JAVASCRIPTS[i], 'r')
    tmpFile = directoryopt + JAVASCRIPTS[i]
    fout = open(tmpFile, 'w')
    finString= fin.read()
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
        if (j + 1) < len(finString) and finString[j] == '/' and finString[j+1] == '/' and (((j > 0) and finString[j-1] != ':') or j== 0):
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
                    #else:
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
                        if (j + 1) < len(finString) and finString[j+1] == ';':
                            j=j+1
                        gotoCommentEnd = False
                    j=j+1


        #find and remove double spaces etc
        if (j + 1)< len(finString) and (finString[j] == ' ' or finString[j] == '\t'): 
            j=j+1;
            gotoCommentEnd= True 
            while gotoCommentEnd == True:
                if j >= len(finString):
                    gotoCommentEnd = False
                    commentRemove = False 
                else:  
                    if finString[j] != ' ' and finString[j] != '\t':
                        gotoCommentEnd = False
                        j=j-1;
                    else:
                        j=j+1


        if j >= len(finString):
                commentRemove = False
        else:
            #if finString[j] != '\n' and finString[j] != '\r' and finString != '\t':
            if finString != '\t':
                fout.write(finString[j])
            else:
                fout.write(' ')
            #print(j)
            j=j+1
    fin.close()
    fout.close()
