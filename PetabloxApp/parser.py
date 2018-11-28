# the name of the file the clang output is saved to
input_fn = "kek.txt"
# the name of the file this program will create
output_fn = "kek2.txt"

# list that contains tuples in format (file of error, line number of error,
# description of error, and the error code)
file_line_desc_error_list = []

# get errors from input clang error file
with open(input_fn, 'r') as in_fn:
    # using that output error format is in 3 lines with first line describing
    # the error, second line the code itself, and third line a squiggly arrow
    while(True):
        error_desc_line = in_fn.readline()
        error_line = in_fn.readline()
        # for now we won't be using this
        squiggly_line = in_fn.readline()
        if not error_desc_line or not error_line or not squiggly_line: # EOF
            break
        # expected format is file_name:line_number:i_dont_know_what_this_number_is:rest
        error_desc_s = error_desc_line.split(':', 3)
        file_line_desc_error_list.append((error_desc_s[0], error_desc_s[1], error_desc_s[-1].strip(), error_line))

# write to output file
with open(output_fn, 'w') as out_fn:
    out_fn.write("Found " + str(len(file_line_desc_error_list)) + " issues.\n")
    for issue_tuple in file_line_desc_error_list:
        out_fn.write("\n" + issue_tuple[2].capitalize() + " in " + issue_tuple[0] +
                     " on line " + issue_tuple[1] + ":\n" + issue_tuple[3])