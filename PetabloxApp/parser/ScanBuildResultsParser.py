# Iterates over files in given directory and makes a ScanBuildReportParser for each
import os
import sys
import ScanBuildReportParser as sbrepp


class ScanBuildResultsParser:

    def __init__(self, directory_of_results):
        self.html_report_file_list = []
        for filename in os.listdir(directory_of_results):
            # do not need index.html
            if filename.endswith(".html") and filename != "index.html":
                self.html_report_file_list.append(filename)

        # list of tuples in form (report_filename, report object)
        self.report_list = []
        for report in self.html_report_file_list:
            sbrepp_obj = sbrepp.ScanBuildReportParser(report)
            self.report_list.append(report, sbrepp_obj)

    # returns the relative complement for this i.e. the report filenames
    # that are present in this ScanBuildResultsParser but not the other
    def get_complement(self, other):
        output_list = []
        for report, sbrepp_obj in self.report_list:
            if sbrepp_obj not in other.report_list:
                output_list.append(report)
        return output_list
