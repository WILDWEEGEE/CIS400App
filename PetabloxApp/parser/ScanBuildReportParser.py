# -*- coding: utf-8 -*-
from bs4 import BeautifulSoup
import codecs


# given a scan build html filename, converts the file into a useful data structure
class ScanBuildReportParser:

    def __init__(self, html_filename, parser='lxml'):
        file = codecs.open(html_filename, 'r')
        self.document = BeautifulSoup(file.read(), parser)
        self.error_line, self.error_msg = self.get_error_and_line_num()
        self.rules = self.get_rule_trace()
        self.filename = self.get_filename_of_error()

    def get_filename_of_error(self):
        for line in self.document.find("body").contents:
            line = str(line).strip()
            if line.startswith("FILENAME"):
                line = line.split("FILENAME")[-1]
                return line.strip()
        raise ValueError("html file not of expected form; could not find filename")

    # returns a tuple of the line number and the error message for the file
    def get_error_and_line_num(self):
        # this assumes that the first hyperlink in the HTML corresponds to the error
        line_num_tag = self.document.find(href=True)
        # parse out the column (the text is in the form "line x, column y"
        line_num = line_num_tag.text.split(",")[0].split()[-1]
        # this one is a doozy, but at index 2 of the line tag's next_elements is a line
        # holding the desciption and warning message. The next element of that is just
        # the warning message.
        next_elem_gen = line_num_tag.next_elements
        desc_elem = None
        for i in range(0, 3):
            desc_elem = next(next_elem_gen)
        error_msg = desc_elem.next_element.nextSibling.text
        return line_num, str(error_msg)

    # returns a tuple of the form (rule_order_number, rule_text) with cleaned text
    # note that the error itself is inside this rule trace
    def get_rule_trace(self):
        # msgT is the table that holds the rules
        rules_tag_list = self.document.find_all(class_="msgT")
        uncleaned_rules_list = [rule.text for rule in rules_tag_list]
        cleaned_rules_list = []
        for rule in uncleaned_rules_list:
            # the number of the rule is the first character
            rule_order_number = rule[0]
            rule = rule[1:]
            # remove the arrows by uncommenting the next two lines
            #rule = rule.split('←')[-1]
            #rule = rule.split('→')[0]
            cleaned_rules_list.append((rule_order_number, rule))
            # remove the right arrow
        return cleaned_rules_list

    # equality is based on having the same issue and rule trace,
    # disregarding line numbers
    def __eq__(self, other):
        if isinstance(other, self.__class__):
            # error messages must be the same
            if self.error_msg == other.error_msg:
                # check rule messages are the same and in same order
                if len(self.rules) != len(other.rules):
                    return False
                for this_rule, other_rule in zip(self.rules, other.rules):
                    if this_rule[1] != other_rule[1]:
                        return False
                return True
        else:
            return False

    # for Python 2x compatibility
    def __ne__(self, other):
        return not self.__eq__(other)