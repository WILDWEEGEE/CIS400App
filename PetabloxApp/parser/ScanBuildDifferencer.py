# takes in three directories and puts reports in new version that are not in old version into third directory
import sys
import os
import ScanBuildResultsParser as sbresp
import shutil

if len(sys.argv != 4):
    sys.exit("Pass in three directories where the first two directories " +
             "contain scan build results and the second directory needs " +
             "duplicate reports removed. The third directory will be " +
             "created and will store new reports that are not in old version.")

filtered_directory = sys.argv[3]
if os.path.exists(filtered_directory):
    sys.exit("Third directory should not exist as it will be created.")

# create directory where filtered reports will go
os.makedirs(filtered_directory)

# assumes the first argument is an old run of scan build
sbresp_old = sbresp.ScanBuildResultsParser(sys.argv[1])
# this is the latest run of scan build
sbresp_new = sbresp.ScanBuildResultsParser(sys.argv[2])

reports_to_add = sbresp_new.get_complement(sbresp_old)
for report in reports_to_add:
    shutil.copy2(report, filtered_directory)

print("Created new directory " + filtered_directory + ". Added reports found in "
      + sys.argv[2] + " not found in " + sys.argv[1] + ".")